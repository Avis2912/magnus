import asyncio
from typing import Dict, Any, Optional

from app.agent.manus import Manus
from app.flow.base import FlowType
from app.flow.flow_factory import FlowFactory
from app.logger import logger


class TaskExecutor:
    """Executes tasks using the MetaGPT flow system"""
    
    def __init__(self):
        """Initialize the task executor"""
        # Set up shared resources
        self._agents = None
        
    async def _init_agents(self):
        """Initialize agents if not already done"""
        if self._agents is None:
            self._agents = {
                "manus": Manus(),
            }
        return self._agents
        
    async def execute_task(self, task_id: str, prompt: str, on_log=None) -> str:
        """Execute a task with the given prompt"""
        # Initialize agents if needed
        agents = await self._init_agents()
        
        # Create a message handler for the logger if provided
        if on_log:
            # Create a log handler that forwards to the on_log callback
            async def log_handler(message):
                if isinstance(on_log, callable):
                    await on_log(message)
                    
            # Add the handler to the logger
            logger.add(log_handler)
        
        # Create and execute the flow
        flow = FlowFactory.create_flow(
            flow_type=FlowType.PLANNING,
            agents=agents,
        )
        
        # Execute with timeout to avoid hanging
        try:
            logger.info(f"Starting task execution: {prompt}")
            result = await asyncio.wait_for(
                flow.execute(prompt),
                timeout=3600,  # 1 hour timeout
            )
            logger.info(f"Task execution completed successfully")
            return result
        except asyncio.TimeoutError:
            logger.error("Task execution timed out after 1 hour")
            raise
        except Exception as e:
            logger.error(f"Task execution failed: {str(e)}")
            raise


# Create a singleton instance
task_executor = TaskExecutor()
