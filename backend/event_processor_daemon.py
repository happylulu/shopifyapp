#!/usr/bin/env python3
"""
Event Processor Daemon
Runs the Redis Streams event processor as a standalone service
"""

import asyncio
import logging
import signal
import sys
from typing import Optional

from event_streaming import EventProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/event_processor.log')
    ]
)

logger = logging.getLogger(__name__)


class EventProcessorDaemon:
    """Daemon wrapper for the event processor"""
    
    def __init__(self):
        self.processor: Optional[EventProcessor] = None
        self.running = False
        self.shutdown_event = asyncio.Event()

    async def start(self):
        """Start the event processor daemon"""
        logger.info("Starting Event Processor Daemon...")
        
        # Set up signal handlers
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self.signal_handler)
        
        self.processor = EventProcessor()
        self.running = True
        
        try:
            # Start processing events
            await self.processor.start_processing()
        except Exception as e:
            logger.error(f"Event processor failed: {e}")
            raise
        finally:
            await self.cleanup()

    def signal_handler(self):
        """Handle shutdown signals"""
        logger.info("Received shutdown signal")
        self.running = False
        self.shutdown_event.set()

    async def cleanup(self):
        """Cleanup resources"""
        logger.info("Cleaning up event processor...")
        if self.processor:
            await self.processor.streamer.disconnect()
        logger.info("Event processor stopped")

    async def health_check(self):
        """Health check endpoint"""
        return {
            "status": "healthy" if self.running else "stopped",
            "processor": self.processor is not None
        }


async def main():
    """Main entry point"""
    daemon = EventProcessorDaemon()
    
    try:
        await daemon.start()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Daemon failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
