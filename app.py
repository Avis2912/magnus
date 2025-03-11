from fastapi import FastAPI, Request, Body, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import asyncio
import uuid
from json import dumps

# Import the logger module
from app.logger import logger

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your Next.js frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type"]
)

class Task(BaseModel):
    id: str
    prompt: str
    created_at: datetime
    status: str
    steps: list = []

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['created_at'] = self.created_at.isoformat()
        return data

class TaskManager:
    def __init__(self):
        self.tasks = {}
        self.queues = {}

    def create_task(self, prompt: str) -> Task:
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            prompt=prompt,
            created_at=datetime.now(),
            status="pending"
        )
        self.tasks[task_id] = task
        self.queues[task_id] = asyncio.Queue()
        return task

    async def update_task_step(self, task_id: str, step: int, result: str, step_type: str = "step"):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.steps.append({"step": step, "result": result, "type": step_type})
            await self.queues[task_id].put({
                "type": step_type,
                "step": step,
                "result": result
            })
            await self.queues[task_id].put({
                "type": "status",
                "status": task.status,
                "steps": task.steps
            })

    async def complete_task(self, task_id: str):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.status = "completed"
            await self.queues[task_id].put({
                "type": "status",
                "status": task.status,
                "steps": task.steps
            })
            await self.queues[task_id].put({"type": "complete"})

    async def fail_task(self, task_id: str, error: str):
        if task_id in self.tasks:
            self.tasks[task_id].status = f"failed: {error}"
            await self.queues[task_id].put({
                "type": "error",
                "message": error
            })

task_manager = TaskManager()

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Import run_flow functionality
from app.agent.manus import Manus
from app.flow.base import FlowType
from app.flow.flow_factory import FlowFactory
# Import the task executor
from app.task_executor import task_executor

@app.post("/tasks")
async def create_task(prompt: str = Body(..., embed=True)):
    try:
        # Create a new task and start processing
        task = task_manager.create_task(prompt)
        print(f"Created task: {task.id}")
        
        # Start processing in the background
        asyncio.create_task(run_task(task.id, prompt))
        
        # Return a simple, clean response with just the task_id as a string
        return {"task_id": task.id}
    except Exception as e:
        print(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

async def run_task(task_id: str, prompt: str):
    try:
        task_manager.tasks[task_id].status = "running"
        
        # Create a custom SSE log handler to capture logs
        class SSELogHandler:
            def __init__(self, task_id):
                self.task_id = task_id
                self.step_counter = 0
                
            async def __call__(self, message):
                # Handle string messages from logger
                if isinstance(message, str):
                    import re
                    
                    # Extract content and identify message type based on patterns
                    event_type = "log"
                    cleaned_message = message
                    
                    # Remove timestamp and log level if present
                    timestamp_pattern = r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3} \| \w+ +\| '
                    cleaned_message = re.sub(timestamp_pattern, '', cleaned_message)
                    
                    # Remove module info if present
                    module_pattern = r'^[\w\.]+:\w+:\d+ - '
                    cleaned_message = re.sub(module_pattern, '', cleaned_message)
                    
                    # Determine event type based on message content and icons
                    if '✨' in cleaned_message or 'thoughts:' in cleaned_message.lower():
                        event_type = "think"
                        # Extract the actual thought content after the emoji
                        thoughts_match = re.search(r'✨ \w+\'s thoughts: (.*)', cleaned_message)
                        if thoughts_match:
                            cleaned_message = thoughts_match.group(1)
                    elif '🛠️' in cleaned_message or 'selected tool' in cleaned_message.lower():
                        event_type = "tool"
                    elif '🔧' in cleaned_message or 'Activating tool:' in cleaned_message:
                        event_type = "tool"
                    elif '🎯' in cleaned_message or 'Tool .* completed' in cleaned_message:
                        event_type = "act"
                        # Extract the result after "Result:"
                        result_match = re.search(r'Result: (.*)', cleaned_message, re.DOTALL)
                        if result_match:
                            cleaned_message = result_match.group(1)
                    elif 'error' in cleaned_message.lower() or 'failed' in cleaned_message.lower():
                        event_type = "error"
                    
                    print(f"Processing log: {event_type} - {cleaned_message[:50]}...")
                    
                    self.step_counter += 1
                    await task_manager.update_task_step(self.task_id, self.step_counter, cleaned_message, event_type)
                
                # Handle structured log data
                elif isinstance(message, dict):
                    event_type = message.get("type", "log")
                    content = message.get("message", "")
                    step = message.get("step", self.step_counter)
                    self.step_counter += 1
                    await task_manager.update_task_step(self.task_id, step, content, event_type)
        
        # Register the SSE handler with the logger
        sse_handler = SSELogHandler(task_id)
        
        # Directly hook into the logger's handlers list to capture all logs
        logger.add(sse_handler, level="INFO")
        print(f"SSE handler registered for task {task_id}")
        
        try:
            # Log the start of the task
            await task_manager.update_task_step(task_id, 0, f"Starting task execution: {prompt}", "log")
            
            # Create a sublogger to capture all stdout/stderr during execution
            import sys
            from io import StringIO
            
            # Create a custom interceptor for stdout/stderr
            class OutputInterceptor(StringIO):
                def __init__(self, handler, *args, **kwargs):
                    super().__init__(*args, **kwargs)
                    self.handler = handler
                    self.buffer = ""
                
                def write(self, text):
                    self.buffer += text
                    if '\n' in text:
                        lines = self.buffer.split('\n')
                        for line in lines[:-1]:
                            if line.strip():  # Skip empty lines
                                asyncio.create_task(self.handler(line))
                        self.buffer = lines[-1]
                    return super().write(text)
            
            # Create stdout/stderr interceptors
            stdout_interceptor = OutputInterceptor(
                lambda msg: task_manager.update_task_step(task_id, 9000 + sse_handler.step_counter, msg, "log")
            )
            
            # Use the run_flow.py functionality
            agents = {
                "manus": Manus(),
            }
            
            flow = FlowFactory.create_flow(
                flow_type=FlowType.PLANNING,
                agents=agents,
            )
            
            # Execute with timeout to avoid hanging
            result = await asyncio.wait_for(
                flow.execute(prompt),
                timeout=3600,  # 1 hour timeout
            )
            
            # Log the result
            await task_manager.update_task_step(task_id, 999, str(result), "result")
            await task_manager.complete_task(task_id)
            
        except asyncio.TimeoutError:
            error_msg = "Task execution timed out after 1 hour"
            logger.error(error_msg)
            await task_manager.fail_task(task_id, error_msg)
            
        except Exception as e:
            error_msg = f"Task execution failed: {str(e)}"
            logger.error(error_msg)
            await task_manager.fail_task(task_id, error_msg)
            
        finally:
            # Remove the logger handler
            try:
                logger.remove(sse_handler)
            except:
                pass
            
    except Exception as e:
        error_msg = f"Error in task setup: {str(e)}"
        logger.error(error_msg)
        await task_manager.fail_task(task_id, error_msg)

@app.get("/tasks/{task_id}/events")
async def task_events(task_id: str):
    """Stream task events as Server-Sent Events (SSE)"""
    
    if task_id not in task_manager.tasks:
        return JSONResponse(
            status_code=404, 
            content={"detail": "Task not found"}
        )
    
    async def event_generator():
        """Generate SSE events for this task"""
        if task_id not in task_manager.queues:
            yield f"event: error\ndata: {{\"message\": \"Task queue not found\"}}\n\n"
            return
            
        queue = task_manager.queues[task_id]
        task = task_manager.tasks[task_id]
        
        # Send initial status with proper JSON escaping
        try:
            steps_json = dumps(task.steps)
            status_data = dumps({
                "type": "status", 
                "status": task.status, 
                "steps": task.steps
            })
            yield f"event: status\ndata: {status_data}\n\n"
        except Exception as e:
            print(f"Error sending initial status: {str(e)}")
            yield f"event: error\ndata: {{\"message\": \"Error sending initial status\"}}\n\n"
        
        # Set up heartbeat
        heartbeat_interval = 5  # Send a heartbeat every 5 seconds
        
        while True:
            try:
                # Wait for an event with timeout for heartbeat
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=heartbeat_interval)
                    
                    # Ensure the event is properly serializable
                    try:
                        # Make sure we're sending valid JSON
                        event_json = dumps(event)
                        yield f"event: {event['type']}\ndata: {event_json}\n\n"
                        
                        # If the event is "complete", we're done
                        if event["type"] == "complete":
                            break
                            
                    except Exception as json_error:
                        print(f"Error serializing event: {str(json_error)}, event: {event}")
                        # Send a simplified version of the event
                        safe_event = {
                            "type": event.get("type", "error"),
                            "message": "Error serializing event data"
                        }
                        yield f"event: {safe_event['type']}\ndata: {dumps(safe_event)}\n\n"
                        
                except asyncio.TimeoutError:
                    # Send a heartbeat
                    yield ": heartbeat\n\n"
                    continue
                    
            except asyncio.CancelledError:
                print(f"SSE connection for task {task_id} was cancelled")
                break
                
            except Exception as e:
                print(f"Error in SSE stream for task {task_id}: {str(e)}")
                safe_error = {"message": str(e)}
                try:
                    error_json = dumps(safe_error)
                    yield f"event: error\ndata: {error_json}\n\n"
                except:
                    yield f"event: error\ndata: {{\"message\": \"Unknown error\"}}\n\n"
                break
                
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive", 
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream",
            "Access-Control-Allow-Origin": "*"  # Add CORS header for SSE
        }
    )

@app.get("/tasks")
async def get_tasks():
    sorted_tasks = sorted(
        task_manager.tasks.values(),
        key=lambda task: task.created_at,
        reverse=True
    )
    return JSONResponse(
        content=[task.model_dump() for task in sorted_tasks],
        headers={"Content-Type": "application/json"}
    )

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    if task_id not in task_manager.tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_manager.tasks[task_id]

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": f"服务器内部错误: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
