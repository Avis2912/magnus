import asyncio
from typing import Callable, Any, Dict, Optional


class LogInterceptor:
    """Intercepts logs and passes them to a handler function"""
    
    def __init__(self, task_id: str, handler: Callable):
        self.task_id = task_id
        self.handler = handler
        self.queue = asyncio.Queue()
        self._running = True
        self._task = None
        
    async def start(self):
        """Start the interceptor"""
        self._task = asyncio.create_task(self._process_logs())
        return self
        
    async def stop(self):
        """Stop the interceptor"""
        if self._running:
            self._running = False
            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
                
    async def _process_logs(self):
        """Process logs from the queue"""
        while self._running:
            try:
                log = await self.queue.get()
                await self.handler(log)
                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error processing log: {str(e)}")
                
    async def log(self, message: str, log_type: str = "log", step: int = 0, **kwargs):
        """Add a log message to the queue"""
        await self.queue.put({
            "message": message,
            "type": log_type,
            "step": step,
            "task_id": self.task_id,
            **kwargs
        })
