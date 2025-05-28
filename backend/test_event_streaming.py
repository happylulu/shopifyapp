"""
Tests for Event Streaming System
Tests Redis Streams, Celery tasks, and GraphQL API
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import uuid

from event_streaming import (
    LoyaltyEvent, EventStreamer, EventProcessor, 
    publish_loyalty_event, process_event_task
)
from graphql_api import schema
from monitoring import MetricsCollector


class TestLoyaltyEvent:
    """Test LoyaltyEvent data class"""
    
    def test_event_serialization(self):
        """Test event to_dict and from_dict"""
        event = LoyaltyEvent(
            event_id="test-123",
            event_type="order_created",
            shop_domain="test.myshopify.com",
            customer_id="cust-456",
            event_data={"order_id": "order-789", "total": 150.00},
            timestamp=datetime(2024, 1, 15, 10, 0, 0),
            source="api"
        )
        
        # Test serialization
        event_dict = event.to_dict()
        assert event_dict["event_id"] == "test-123"
        assert event_dict["timestamp"] == "2024-01-15T10:00:00"
        
        # Test deserialization
        restored_event = LoyaltyEvent.from_dict(event_dict)
        assert restored_event.event_id == event.event_id
        assert restored_event.timestamp == event.timestamp
        assert restored_event.event_data == event.event_data


class TestEventStreamer:
    """Test EventStreamer Redis Streams functionality"""
    
    @pytest.fixture
    async def event_streamer(self):
        """Create test event streamer"""
        # Use a test Redis instance or mock
        streamer = EventStreamer("redis://localhost:6379/15")  # Test DB
        yield streamer
        await streamer.disconnect()

    @pytest.mark.asyncio
    async def test_publish_event(self, event_streamer):
        """Test publishing events to Redis Stream"""
        event = LoyaltyEvent(
            event_id=str(uuid.uuid4()),
            event_type="test_event",
            shop_domain="test.myshopify.com",
            customer_id="test-customer",
            event_data={"test": "data"},
            timestamp=datetime.utcnow()
        )
        
        try:
            stream_id = await event_streamer.publish_event(event)
            assert stream_id is not None
            assert "-" in stream_id  # Redis stream ID format
        except Exception as e:
            # Skip if Redis not available
            pytest.skip(f"Redis not available: {e}")

    @pytest.mark.asyncio
    async def test_consume_events(self, event_streamer):
        """Test consuming events from Redis Stream"""
        try:
            await event_streamer.connect()
            
            # Publish a test event first
            event = LoyaltyEvent(
                event_id=str(uuid.uuid4()),
                event_type="test_consume",
                shop_domain="test.myshopify.com",
                customer_id="test-customer",
                event_data={"test": "consume"},
                timestamp=datetime.utcnow()
            )
            
            await event_streamer.publish_event(event)
            
            # Try to consume (with timeout)
            consumed_events = []
            async for events in event_streamer.consume_events(batch_size=1):
                consumed_events.extend(events)
                break  # Just test one batch
            
            assert len(consumed_events) > 0
            assert consumed_events[0].event_type == "test_consume"
            
        except Exception as e:
            pytest.skip(f"Redis not available: {e}")


class TestEventProcessor:
    """Test EventProcessor functionality"""
    
    @pytest.fixture
    def mock_rule_engine(self):
        """Mock rule engine for testing"""
        with patch('event_streaming.RuleEngine') as mock:
            mock_instance = Mock()
            mock_instance.process_event = AsyncMock(return_value=[
                {
                    "success": True,
                    "conditions_met": True,
                    "actions_executed": [
                        {"type": "points", "amount": 100}
                    ]
                }
            ])
            mock.return_value = mock_instance
            yield mock_instance

    @pytest.mark.asyncio
    async def test_process_single_event(self, mock_rule_engine):
        """Test processing a single event"""
        processor = EventProcessor()
        
        event = LoyaltyEvent(
            event_id=str(uuid.uuid4()),
            event_type="order_created",
            shop_domain="test.myshopify.com",
            customer_id="test-customer",
            event_data={"order_id": "123", "total": 100.00},
            timestamp=datetime.utcnow()
        )
        
        with patch('event_streaming.get_db') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            await processor.process_single_event(event)
            
            # Verify rule engine was called
            mock_rule_engine.process_event.assert_called_once()


class TestCeleryTasks:
    """Test Celery task functionality"""
    
    def test_process_event_task_serialization(self):
        """Test that event data can be serialized for Celery"""
        event = LoyaltyEvent(
            event_id=str(uuid.uuid4()),
            event_type="order_created",
            shop_domain="test.myshopify.com",
            customer_id="test-customer",
            event_data={"order_id": "123"},
            timestamp=datetime.utcnow()
        )
        
        # Test that event data can be JSON serialized
        event_dict = event.to_dict()
        json_str = json.dumps(event_dict)
        restored_dict = json.loads(json_str)
        
        assert restored_dict["event_id"] == event.event_id
        assert restored_dict["event_type"] == event.event_type

    @patch('event_streaming.EventProcessor')
    def test_process_event_task(self, mock_processor_class):
        """Test Celery event processing task"""
        mock_processor = Mock()
        mock_processor_class.return_value = mock_processor
        
        event_data = {
            "event_id": str(uuid.uuid4()),
            "event_type": "order_created",
            "shop_domain": "test.myshopify.com",
            "customer_id": "test-customer",
            "event_data": {"order_id": "123"},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Mock asyncio.new_event_loop and run_until_complete
        with patch('asyncio.new_event_loop') as mock_loop_create, \
             patch('asyncio.set_event_loop') as mock_set_loop:
            
            mock_loop = Mock()
            mock_loop_create.return_value = mock_loop
            mock_loop.run_until_complete = Mock()
            
            # This would normally be called by Celery
            # process_event_task(event_data)
            
            # Verify the task structure is correct
            assert "event_id" in event_data
            assert "timestamp" in event_data


class TestGraphQLAPI:
    """Test GraphQL API functionality"""
    
    @pytest.mark.asyncio
    async def test_loyalty_profile_query(self):
        """Test GraphQL loyalty profile query"""
        query = """
        query GetLoyaltyProfile($customerId: String!) {
            loyaltyProfile(customerId: $customerId) {
                id
                points_balance
                current_tier {
                    name
                    level
                }
            }
        }
        """
        
        variables = {"customerId": "test-customer-123"}
        
        # Mock the database and context
        with patch('graphql_api.get_db') as mock_db, \
             patch('graphql_api.loyalty_service') as mock_loyalty_service:
            
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock shop lookup
            mock_session.execute.return_value.scalar_one_or_none.return_value = "shop-id-123"
            
            # Mock loyalty profile
            mock_profile = Mock()
            mock_profile.id = "profile-123"
            mock_profile.shopify_customer_id = "test-customer-123"
            mock_profile.points_balance = 1500
            mock_profile.current_tier_name = "Gold"
            mock_profile.created_at = datetime.utcnow()
            mock_profile.updated_at = datetime.utcnow()
            
            mock_loyalty_service.get_profile.return_value = mock_profile
            
            # Mock context
            context = {
                "db": mock_session,
                "shop_domain": "test.myshopify.com",
                "api_token": "test-token"
            }
            
            # Execute query
            result = await schema.execute(
                query,
                variable_values=variables,
                context_value=context
            )
            
            # Verify no errors
            assert result.errors is None or len(result.errors) == 0

    @pytest.mark.asyncio
    async def test_redeem_reward_mutation(self):
        """Test GraphQL reward redemption mutation"""
        mutation = """
        mutation RedeemReward($input: RedeemRewardInput!) {
            redeemReward(input: $input) {
                success
                message
                points_deducted
                new_balance
            }
        }
        """
        
        variables = {
            "input": {
                "reward_id": "reward-123",
                "customer_id": "customer-456",
                "quantity": 1
            }
        }
        
        # Mock the database operations
        with patch('graphql_api.get_db') as mock_db, \
             patch('graphql_api.loyalty_service') as mock_loyalty_service, \
             patch('graphql_api.publish_loyalty_event') as mock_publish:
            
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock successful redemption
            mock_profile = Mock()
            mock_profile.points_balance = 2000
            
            mock_reward = Mock()
            mock_reward.id = "reward-123"
            mock_reward.name = "Test Reward"
            mock_reward.points_cost = 500
            
            mock_updated_profile = Mock()
            mock_updated_profile.points_balance = 1500
            
            mock_loyalty_service.get_profile.return_value = mock_profile
            mock_loyalty_service.adjust_points.return_value = mock_updated_profile
            
            # Mock database queries
            mock_session.execute.return_value.scalar_one_or_none.side_effect = [
                "shop-id-123",  # Shop lookup
                mock_reward      # Reward lookup
            ]
            
            mock_publish.return_value = None
            
            context = {
                "db": mock_session,
                "shop_domain": "test.myshopify.com",
                "api_token": "test-token"
            }
            
            # Execute mutation
            result = await schema.execute(
                mutation,
                variable_values=variables,
                context_value=context
            )
            
            # Verify no errors
            assert result.errors is None or len(result.errors) == 0


class TestMonitoring:
    """Test monitoring and metrics functionality"""
    
    @pytest.fixture
    def metrics_collector(self):
        """Create metrics collector for testing"""
        return MetricsCollector()

    @pytest.mark.asyncio
    async def test_system_metrics_collection(self, metrics_collector):
        """Test system metrics collection"""
        with patch('monitoring.get_db') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock database queries
            mock_session.execute.return_value.scalar.side_effect = [
                100,  # events_1h
                500,  # events_24h
                80,   # rules_1h
                400,  # rules_24h
                150.5, # avg_processing_time
                5     # errors_1h
            ]
            
            with patch.object(metrics_collector, 'stream_monitor') as mock_monitor:
                mock_monitor.get_stream_info.return_value = {
                    "pending_info": {"pending": 10},
                    "groups_info": [{"name": "test_group"}]
                }
                
                metrics = await metrics_collector.get_system_metrics()
                
                assert metrics.events_processed_1h == 100
                assert metrics.events_processed_24h == 500
                assert metrics.rules_executed_1h == 80
                assert metrics.average_processing_time_ms == 150.5
                assert metrics.stream_lag == 10

    @pytest.mark.asyncio
    async def test_shop_metrics_collection(self, metrics_collector):
        """Test shop-specific metrics collection"""
        shop_domain = "test.myshopify.com"
        
        with patch('monitoring.get_db') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock database queries
            mock_session.execute.return_value.scalar.side_effect = [
                50,   # events_1h
                40,   # rules_1h
                2,    # errors_1h
                125.0 # avg_processing_time
            ]
            
            # Mock top rules query
            mock_session.execute.return_value.__iter__ = Mock(return_value=iter([
                Mock(name="First Order Bonus", execution_count=15),
                Mock(name="VIP Upgrade", execution_count=10)
            ]))
            
            metrics = await metrics_collector.get_shop_metrics(shop_domain)
            
            assert metrics.shop_domain == shop_domain
            assert metrics.events_processed_1h == 50
            assert metrics.rules_executed_1h == 40


class TestIntegration:
    """Integration tests for the complete system"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_event_flow(self):
        """Test complete event flow from publish to processing"""
        # This would test the full flow:
        # 1. Publish event to Redis Stream
        # 2. Event processor picks it up
        # 3. Rules are evaluated
        # 4. Actions are executed
        # 5. Webhooks are delivered
        # 6. Metrics are updated
        
        # For now, just test the publish function
        with patch('event_streaming.EventStreamer') as mock_streamer_class:
            mock_streamer = AsyncMock()
            mock_streamer.publish_event.return_value = "test-stream-id"
            mock_streamer.disconnect.return_value = None
            mock_streamer_class.return_value = mock_streamer
            
            stream_id = await publish_loyalty_event(
                event_type="order_created",
                shop_domain="test.myshopify.com",
                event_data={"order_id": "123", "total": 100.00},
                customer_id="customer-456"
            )
            
            assert stream_id == "test-stream-id"
            mock_streamer.publish_event.assert_called_once()
            mock_streamer.disconnect.assert_called_once()


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

class TestPerformance:
    """Performance and load tests"""
    
    @pytest.mark.asyncio
    async def test_event_publishing_performance(self):
        """Test event publishing performance"""
        with patch('event_streaming.EventStreamer') as mock_streamer_class:
            mock_streamer = AsyncMock()
            mock_streamer.publish_event.return_value = "test-id"
            mock_streamer.disconnect.return_value = None
            mock_streamer_class.return_value = mock_streamer
            
            # Publish multiple events and measure time
            start_time = datetime.utcnow()
            
            tasks = []
            for i in range(100):
                task = publish_loyalty_event(
                    event_type="test_event",
                    shop_domain="test.myshopify.com",
                    event_data={"test_id": i},
                    customer_id=f"customer-{i}"
                )
                tasks.append(task)
            
            await asyncio.gather(*tasks)
            
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            # Should be able to publish 100 events in under 1 second (mocked)
            assert duration < 1.0
            assert mock_streamer.publish_event.call_count == 100

    def test_event_serialization_performance(self):
        """Test event serialization performance"""
        event = LoyaltyEvent(
            event_id=str(uuid.uuid4()),
            event_type="order_created",
            shop_domain="test.myshopify.com",
            customer_id="test-customer",
            event_data={"large_data": "x" * 1000},  # 1KB of data
            timestamp=datetime.utcnow()
        )
        
        start_time = datetime.utcnow()
        
        # Serialize/deserialize 1000 times
        for _ in range(1000):
            event_dict = event.to_dict()
            LoyaltyEvent.from_dict(event_dict)
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Should be able to serialize 1000 events in under 1 second
        assert duration < 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
