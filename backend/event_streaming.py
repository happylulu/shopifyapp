"""
Redis Streams Event Processing System
Handles scalable event streaming with Redis Streams and Celery workers
"""

import json
import asyncio
import logging
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import redis.asyncio as redis
from redis.asyncio import Redis
from celery import Celery
from celery.result import AsyncResult
import uuid

from rule_models import EventType
from rule_engine import RuleEngine
from models_v2 import get_db

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_URL = "redis://localhost:6379/0"
REDIS_STREAMS_DB = 1  # Separate DB for streams

# Celery configuration
celery_app = Celery(
    'loyalty_events',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['event_streaming']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_compression='gzip',
    result_compression='gzip',
)


@dataclass
class LoyaltyEvent:
    """Structured loyalty event for processing"""
    event_id: str
    event_type: str
    shop_domain: str
    customer_id: Optional[str]
    event_data: Dict[str, Any]
    timestamp: datetime
    source: str = "api"
    correlation_id: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LoyaltyEvent':
        """Create from dictionary"""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)


class EventStreamer:
    """
    Redis Streams-based event streaming system
    """
    
    def __init__(self, redis_url: str = REDIS_URL):
        self.redis_url = redis_url
        self.redis_client: Optional[Redis] = None
        self.stream_name = "loyalty:events"
        self.consumer_group = "loyalty_processors"
        self.consumer_name = f"processor_{uuid.uuid4().hex[:8]}"
        
    async def connect(self):
        """Initialize Redis connection"""
        self.redis_client = redis.from_url(
            self.redis_url,
            db=REDIS_STREAMS_DB,
            decode_responses=True
        )
        
        # Create consumer group if it doesn't exist
        try:
            await self.redis_client.xgroup_create(
                self.stream_name,
                self.consumer_group,
                id='0',
                mkstream=True
            )
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()

    async def publish_event(self, event: LoyaltyEvent) -> str:
        """Publish event to Redis Stream"""
        if not self.redis_client:
            await self.connect()
        
        # Add event to stream
        stream_id = await self.redis_client.xadd(
            self.stream_name,
            event.to_dict(),
            maxlen=100000  # Keep last 100k events
        )
        
        logger.info(f"Published event {event.event_id} to stream: {stream_id}")
        return stream_id

    async def consume_events(self, batch_size: int = 10) -> AsyncGenerator[List[LoyaltyEvent], None]:
        """Consume events from Redis Stream"""
        if not self.redis_client:
            await self.connect()
        
        while True:
            try:
                # Read from stream
                messages = await self.redis_client.xreadgroup(
                    self.consumer_group,
                    self.consumer_name,
                    {self.stream_name: '>'},
                    count=batch_size,
                    block=1000  # Block for 1 second
                )
                
                if messages:
                    events = []
                    for stream, msgs in messages:
                        for msg_id, fields in msgs:
                            try:
                                event = LoyaltyEvent.from_dict(fields)
                                event.stream_id = msg_id
                                events.append(event)
                            except Exception as e:
                                logger.error(f"Failed to parse event {msg_id}: {e}")
                                # Acknowledge malformed message
                                await self.redis_client.xack(
                                    self.stream_name,
                                    self.consumer_group,
                                    msg_id
                                )
                    
                    if events:
                        yield events
                        
            except Exception as e:
                logger.error(f"Error consuming events: {e}")
                await asyncio.sleep(5)  # Wait before retrying

    async def acknowledge_event(self, stream_id: str):
        """Acknowledge successful event processing"""
        if not self.redis_client:
            await self.connect()
        
        await self.redis_client.xack(
            self.stream_name,
            self.consumer_group,
            stream_id
        )

    async def get_pending_events(self) -> List[Dict[str, Any]]:
        """Get pending events for this consumer"""
        if not self.redis_client:
            await self.connect()
        
        pending = await self.redis_client.xpending_range(
            self.stream_name,
            self.consumer_group,
            min='-',
            max='+',
            count=100,
            consumer=self.consumer_name
        )
        
        return pending

    async def claim_abandoned_events(self, min_idle_time: int = 300000):  # 5 minutes
        """Claim events abandoned by other consumers"""
        if not self.redis_client:
            await self.connect()
        
        # Get pending events from all consumers
        pending_info = await self.redis_client.xpending(
            self.stream_name,
            self.consumer_group
        )
        
        if pending_info['pending'] > 0:
            # Claim abandoned events
            claimed = await self.redis_client.xclaim(
                self.stream_name,
                self.consumer_group,
                self.consumer_name,
                min_idle_time,
                pending_info['min'],
                pending_info['max']
            )
            
            if claimed:
                logger.info(f"Claimed {len(claimed)} abandoned events")
                return claimed
        
        return []


class EventProcessor:
    """
    Event processor that handles rule execution and webhook delivery
    """
    
    def __init__(self):
        self.streamer = EventStreamer()
        self.webhook_delivery = WebhookDelivery()

    async def start_processing(self):
        """Start the event processing loop"""
        logger.info("Starting event processor...")
        
        await self.streamer.connect()
        
        # Process events in batches
        async for events in self.streamer.consume_events():
            await self.process_event_batch(events)

    async def process_event_batch(self, events: List[LoyaltyEvent]):
        """Process a batch of events"""
        for event in events:
            try:
                # Process event through rule engine
                await self.process_single_event(event)
                
                # Acknowledge successful processing
                await self.streamer.acknowledge_event(event.stream_id)
                
            except Exception as e:
                logger.error(f"Failed to process event {event.event_id}: {e}")
                
                # Handle retry logic
                if event.retry_count < event.max_retries:
                    await self.retry_event(event)
                else:
                    logger.error(f"Event {event.event_id} exceeded max retries")
                    await self.streamer.acknowledge_event(event.stream_id)

    async def process_single_event(self, event: LoyaltyEvent):
        """Process a single event through the rule engine"""
        async with get_db() as session:
            rule_engine = RuleEngine(session)
            
            # Execute rules for this event
            results = await rule_engine.process_event(
                shop_domain=event.shop_domain,
                event_type=event.event_type,
                event_data=event.event_data
            )
            
            # Process webhook actions
            for result in results:
                if result.get('success') and result.get('actions_executed'):
                    for action in result['actions_executed']:
                        if action.get('type') == 'webhook':
                            await self.webhook_delivery.deliver_webhook(
                                event=event,
                                action=action,
                                rule_result=result
                            )

    async def retry_event(self, event: LoyaltyEvent):
        """Retry failed event processing"""
        event.retry_count += 1
        
        # Exponential backoff
        delay = min(300, 2 ** event.retry_count)  # Max 5 minutes
        
        # Schedule retry using Celery
        process_event_task.apply_async(
            args=[event.to_dict()],
            countdown=delay
        )


class WebhookDelivery:
    """
    Resilient webhook delivery system
    """
    
    def __init__(self):
        self.max_retries = 5
        self.timeout = 30

    async def deliver_webhook(self, event: LoyaltyEvent, action: Dict[str, Any], rule_result: Dict[str, Any]):
        """Deliver webhook with retry logic"""
        webhook_data = {
            'event': event.to_dict(),
            'action': action,
            'rule_result': rule_result,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Use Celery for async webhook delivery
        deliver_webhook_task.apply_async(
            args=[
                action.get('url'),
                webhook_data,
                action.get('headers', {}),
                action.get('method', 'POST')
            ],
            retry=True,
            retry_policy={
                'max_retries': self.max_retries,
                'interval_start': 1,
                'interval_step': 2,
                'interval_max': 60,
            }
        )


# ============================================================================
# CELERY TASKS
# ============================================================================

@celery_app.task(bind=True, max_retries=3)
def process_event_task(self, event_data: Dict[str, Any]):
    """Celery task for processing events"""
    try:
        event = LoyaltyEvent.from_dict(event_data)
        
        # Run async event processing
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        processor = EventProcessor()
        loop.run_until_complete(processor.process_single_event(event))
        
    except Exception as exc:
        logger.error(f"Event processing failed: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=5)
def deliver_webhook_task(self, url: str, data: Dict[str, Any], headers: Dict[str, str], method: str = 'POST'):
    """Celery task for webhook delivery"""
    import httpx
    
    try:
        with httpx.Client(timeout=30) as client:
            response = client.request(
                method=method,
                url=url,
                json=data,
                headers=headers
            )
            response.raise_for_status()
            
        logger.info(f"Webhook delivered successfully to {url}")
        return {"status": "success", "status_code": response.status_code}
        
    except Exception as exc:
        logger.error(f"Webhook delivery failed to {url}: {exc}")
        
        # Exponential backoff
        countdown = min(300, (2 ** self.request.retries) * 60)
        raise self.retry(exc=exc, countdown=countdown)


@celery_app.task
def cleanup_old_events():
    """Periodic task to cleanup old events"""
    # This would run periodically to clean up old stream data
    pass


# ============================================================================
# EVENT PUBLISHING HELPERS
# ============================================================================

async def publish_loyalty_event(
    event_type: str,
    shop_domain: str,
    event_data: Dict[str, Any],
    customer_id: Optional[str] = None,
    source: str = "api"
) -> str:
    """Helper function to publish loyalty events"""
    
    event = LoyaltyEvent(
        event_id=str(uuid.uuid4()),
        event_type=event_type,
        shop_domain=shop_domain,
        customer_id=customer_id,
        event_data=event_data,
        timestamp=datetime.utcnow(),
        source=source
    )
    
    streamer = EventStreamer()
    try:
        stream_id = await streamer.publish_event(event)
        return stream_id
    finally:
        await streamer.disconnect()


# ============================================================================
# MONITORING AND HEALTH CHECKS
# ============================================================================

class EventStreamMonitor:
    """Monitor event stream health and performance"""
    
    def __init__(self):
        self.streamer = EventStreamer()

    async def get_stream_info(self) -> Dict[str, Any]:
        """Get stream information and metrics"""
        await self.streamer.connect()
        
        try:
            # Stream info
            stream_info = await self.streamer.redis_client.xinfo_stream(
                self.streamer.stream_name
            )
            
            # Consumer group info
            groups_info = await self.streamer.redis_client.xinfo_groups(
                self.streamer.stream_name
            )
            
            # Pending messages
            pending_info = await self.streamer.redis_client.xpending(
                self.streamer.stream_name,
                self.streamer.consumer_group
            )
            
            return {
                "stream_info": stream_info,
                "groups_info": groups_info,
                "pending_info": pending_info,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        finally:
            await self.streamer.disconnect()

    async def get_consumer_lag(self) -> Dict[str, Any]:
        """Calculate consumer lag"""
        await self.streamer.connect()
        
        try:
            # Get last message ID in stream
            stream_info = await self.streamer.redis_client.xinfo_stream(
                self.streamer.stream_name
            )
            
            # Get consumer group last delivered ID
            groups_info = await self.streamer.redis_client.xinfo_groups(
                self.streamer.stream_name
            )
            
            lag_info = {
                "stream_length": stream_info.get('length', 0),
                "last_generated_id": stream_info.get('last-generated-id'),
                "groups": []
            }
            
            for group in groups_info:
                lag_info["groups"].append({
                    "name": group['name'],
                    "consumers": group['consumers'],
                    "pending": group['pending'],
                    "last_delivered_id": group['last-delivered-id']
                })
            
            return lag_info
            
        finally:
            await self.streamer.disconnect()
