import sys
import asyncio
from typing import Callable, Any, Optional, Dict, List, Union
from datetime import datetime

from loguru import logger as loguru_logger

from app.config import PROJECT_ROOT

# Configure loguru
loguru_logger.remove()  # Remove default handler
loguru_logger.add(
    sys.stdout,
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
)

# Create a wrapper class for logger to handle async handlers
class AsyncLogger:
    def __init__(self, logger_instance):
        self._logger = logger_instance
        self._async_handlers = []
        self._handler_ids = {}

    def info(self, message):
        self._logger.info(message)
        asyncio.create_task(self._notify_async_handlers(message))
        
    def warning(self, message):
        self._logger.warning(message)
        asyncio.create_task(self._notify_async_handlers(message))
        
    def error(self, message):
        self._logger.error(message)
        asyncio.create_task(self._notify_async_handlers(message))
        
    def debug(self, message):
        self._logger.debug(message)
        asyncio.create_task(self._notify_async_handlers(message))

    def critical(self, message):
        self._logger.critical(message)
        asyncio.create_task(self._notify_async_handlers(message))
        
    def add(self, handler, level="INFO"):
        """Add an async handler to the logger"""
        if callable(handler) and handler not in self._async_handlers:
            self._async_handlers.append(handler)
            
            # Also add to the underlying logger to catch direct logs
            handler_id = self._logger.add(
                lambda msg: asyncio.create_task(self._handle_original_log(handler, msg)),
                level=level
            )
            self._handler_ids[handler] = handler_id
            
        return handler
        
    def remove(self, handler):
        """Remove a handler from the logger"""
        if handler in self._async_handlers:
            self._async_handlers.remove(handler)
            
            # Also remove from the underlying logger
            if handler in self._handler_ids:
                try:
                    self._logger.remove(self._handler_ids[handler])
                    del self._handler_ids[handler]
                except:
                    pass
                
    async def _handle_original_log(self, handler, record):
        """Format and handle a raw loguru record"""
        try:
            # Extract message from record
            if hasattr(record, "message"):
                message = record["message"]
            else:
                message = str(record)
                
            await handler(message)
        except Exception as e:
            print(f"Error in async log handler: {e}")
        
    async def _notify_async_handlers(self, message):
        """Notify all async handlers of a new log message"""
        for handler in self._async_handlers:
            try:
                await handler(message)
            except Exception as e:
                print(f"Error notifying async handler: {e}")

# Create the logger instance
logger = AsyncLogger(loguru_logger)


if __name__ == "__main__":
    logger.info("Starting application")
    logger.debug("Debug message")
    logger.warning("Warning message")
    logger.error("Error message")
    logger.critical("Critical message")

    try:
        raise ValueError("Test error")
    except Exception as e:
        logger.exception(f"An error occurred: {e}")
