"""
Unit Tests for Rule Engine
Tests rule evaluation, action execution, and edge cases
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock, patch

from rule_engine import RuleEngine, RuleManager
from rule_models import Rule, RuleStatus, EventType
from rule_schemas import ComparisonOperator, LogicalOperator


class TestRuleEngine:
    """Test cases for the RuleEngine class"""
    
    @pytest.fixture
    async def db_session(self):
        """Create test database session"""
        # Use in-memory SQLite for testing
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            yield session

    @pytest.fixture
    def rule_engine(self, db_session):
        """Create RuleEngine instance"""
        return RuleEngine(db_session)

    @pytest.fixture
    def sample_order_event(self):
        """Sample order created event"""
        return {
            "event_type": "order_created",
            "order": {
                "id": "12345",
                "total_price": "150.00",
                "currency": "USD",
                "line_items": [
                    {
                        "product": {
                            "id": "prod_123",
                            "title": "Test Product",
                            "tags": ["electronics", "featured"]
                        },
                        "quantity": 2,
                        "price": "75.00"
                    }
                ]
            },
            "customer": {
                "id": "cust_456",
                "email": "test@example.com",
                "total_spent": "500.00",
                "orders_count": 3,
                "tags": ["vip", "loyal"]
            }
        }

    @pytest.fixture
    def sample_rule_data(self):
        """Sample rule configuration"""
        return {
            "name": "First Order Bonus",
            "description": "Award 500 points for first order over $100",
            "event_type": "order_created",
            "priority": 100,
            "conditions": {
                "operator": "and",
                "conditions": [
                    {
                        "type": "order_total",
                        "operator": "greater_than_or_equal",
                        "value": 100.0
                    },
                    {
                        "type": "frequency",
                        "event_type": "order_created",
                        "operator": "equals",
                        "value": 1
                    }
                ]
            },
            "actions": [
                {
                    "type": "points",
                    "operation": "add",
                    "amount": 500,
                    "reason": "First order bonus"
                }
            ]
        }

    # ========================================================================
    # CONDITION EVALUATION TESTS
    # ========================================================================

    @pytest.mark.asyncio
    async def test_order_total_condition_greater_than(self, rule_engine, sample_order_event):
        """Test order total greater than condition"""
        condition = {
            "type": "order_total",
            "operator": "greater_than",
            "value": 100.0
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is True  # 150.00 > 100.0

    @pytest.mark.asyncio
    async def test_order_total_condition_less_than(self, rule_engine, sample_order_event):
        """Test order total less than condition"""
        condition = {
            "type": "order_total",
            "operator": "less_than",
            "value": 100.0
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is False  # 150.00 is not < 100.0

    @pytest.mark.asyncio
    async def test_order_item_count_condition(self, rule_engine, sample_order_event):
        """Test order item count condition"""
        condition = {
            "type": "order_item_count",
            "operator": "equals",
            "value": 2
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is True  # 2 items in order

    @pytest.mark.asyncio
    async def test_product_condition_contains_tag(self, rule_engine, sample_order_event):
        """Test product condition with tag matching"""
        condition = {
            "type": "product",
            "operator": "contains",
            "product_tags": ["electronics"]
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is True  # Product has "electronics" tag

    @pytest.mark.asyncio
    async def test_product_condition_not_contains_tag(self, rule_engine, sample_order_event):
        """Test product condition with tag not matching"""
        condition = {
            "type": "product",
            "operator": "not_contains",
            "product_tags": ["clothing"]
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is True  # Product doesn't have "clothing" tag

    @pytest.mark.asyncio
    async def test_customer_condition_email(self, rule_engine, sample_order_event):
        """Test customer condition with email"""
        condition = {
            "type": "customer",
            "field": "email",
            "operator": "equals",
            "value": "test@example.com"
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is True

    @pytest.mark.asyncio
    async def test_customer_condition_total_spent(self, rule_engine, sample_order_event):
        """Test customer condition with total spent"""
        condition = {
            "type": "customer",
            "field": "total_spent",
            "operator": "greater_than",
            "value": "400.00"
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is True  # 500.00 > 400.00

    # ========================================================================
    # LOGICAL CONDITION TESTS
    # ========================================================================

    @pytest.mark.asyncio
    async def test_logical_and_condition_all_true(self, rule_engine, sample_order_event):
        """Test AND condition where all sub-conditions are true"""
        condition = {
            "operator": "and",
            "conditions": [
                {
                    "type": "order_total",
                    "operator": "greater_than",
                    "value": 100.0
                },
                {
                    "type": "order_item_count",
                    "operator": "equals",
                    "value": 2
                }
            ]
        }
        
        result = await rule_engine._evaluate_logical_condition(condition, sample_order_event)
        assert result is True

    @pytest.mark.asyncio
    async def test_logical_and_condition_one_false(self, rule_engine, sample_order_event):
        """Test AND condition where one sub-condition is false"""
        condition = {
            "operator": "and",
            "conditions": [
                {
                    "type": "order_total",
                    "operator": "greater_than",
                    "value": 100.0
                },
                {
                    "type": "order_item_count",
                    "operator": "equals",
                    "value": 5  # This will be false
                }
            ]
        }
        
        result = await rule_engine._evaluate_logical_condition(condition, sample_order_event)
        assert result is False

    @pytest.mark.asyncio
    async def test_logical_or_condition_one_true(self, rule_engine, sample_order_event):
        """Test OR condition where one sub-condition is true"""
        condition = {
            "operator": "or",
            "conditions": [
                {
                    "type": "order_total",
                    "operator": "greater_than",
                    "value": 1000.0  # This will be false
                },
                {
                    "type": "order_item_count",
                    "operator": "equals",
                    "value": 2  # This will be true
                }
            ]
        }
        
        result = await rule_engine._evaluate_logical_condition(condition, sample_order_event)
        assert result is True

    @pytest.mark.asyncio
    async def test_logical_not_condition(self, rule_engine, sample_order_event):
        """Test NOT condition"""
        condition = {
            "operator": "not",
            "conditions": [
                {
                    "type": "order_total",
                    "operator": "less_than",
                    "value": 100.0  # This will be false, so NOT will be true
                }
            ]
        }
        
        result = await rule_engine._evaluate_logical_condition(condition, sample_order_event)
        assert result is True

    # ========================================================================
    # COMPARISON OPERATOR TESTS
    # ========================================================================

    def test_compare_values_equals(self, rule_engine):
        """Test equals comparison"""
        assert rule_engine._compare_values(10, "equals", 10) is True
        assert rule_engine._compare_values(10, "equals", 5) is False
        assert rule_engine._compare_values("test", "equals", "test") is True

    def test_compare_values_greater_than(self, rule_engine):
        """Test greater than comparison"""
        assert rule_engine._compare_values(10, "greater_than", 5) is True
        assert rule_engine._compare_values(5, "greater_than", 10) is False
        assert rule_engine._compare_values(10, "greater_than", 10) is False

    def test_compare_values_contains(self, rule_engine):
        """Test contains comparison"""
        assert rule_engine._compare_values("hello world", "contains", "world") is True
        assert rule_engine._compare_values("hello world", "contains", "xyz") is False
        assert rule_engine._compare_values("HELLO WORLD", "contains", "world") is True  # Case insensitive

    def test_compare_values_in_list(self, rule_engine):
        """Test in list comparison"""
        assert rule_engine._compare_values("apple", "in", ["apple", "banana", "orange"]) is True
        assert rule_engine._compare_values("grape", "in", ["apple", "banana", "orange"]) is False

    def test_compare_values_starts_with(self, rule_engine):
        """Test starts with comparison"""
        assert rule_engine._compare_values("hello world", "starts_with", "hello") is True
        assert rule_engine._compare_values("hello world", "starts_with", "world") is False

    # ========================================================================
    # ACTION EXECUTION TESTS
    # ========================================================================

    @pytest.mark.asyncio
    async def test_points_action_execution(self, rule_engine, sample_order_event):
        """Test points action execution"""
        action = {
            "type": "points",
            "operation": "add",
            "amount": 500,
            "reason": "Test points award"
        }
        
        result = await rule_engine._execute_points_action(action, sample_order_event)
        
        assert result["type"] == "points"
        assert result["operation"] == "add"
        assert result["amount"] == 500
        assert result["customer_id"] == "cust_456"
        assert result["success"] is True

    # ========================================================================
    # INTEGRATION TESTS
    # ========================================================================

    @pytest.mark.asyncio
    async def test_full_rule_processing(self, rule_engine, sample_order_event):
        """Test complete rule processing flow"""
        # Create a mock rule
        rule = Rule(
            shop_domain="test.myshopify.com",
            name="Test Rule",
            event_type="order_created",
            status=RuleStatus.ACTIVE,
            conditions={
                "type": "order_total",
                "operator": "greater_than",
                "value": 100.0
            },
            actions=[
                {
                    "type": "points",
                    "operation": "add",
                    "amount": 500,
                    "reason": "Order bonus"
                }
            ],
            priority=100,
            execution_count=0
        )
        
        result = await rule_engine._process_rule(rule, sample_order_event)
        
        assert result["conditions_met"] is True
        assert result["success"] is True
        assert len(result["actions_executed"]) == 1
        assert result["actions_executed"][0]["type"] == "points"

    # ========================================================================
    # ERROR HANDLING TESTS
    # ========================================================================

    @pytest.mark.asyncio
    async def test_invalid_condition_type(self, rule_engine, sample_order_event):
        """Test handling of invalid condition type"""
        condition = {
            "type": "invalid_condition_type",
            "operator": "equals",
            "value": 100
        }
        
        result = await rule_engine._evaluate_single_condition(condition, sample_order_event)
        assert result is False  # Should return False for unknown condition types

    @pytest.mark.asyncio
    async def test_invalid_action_type(self, rule_engine, sample_order_event):
        """Test handling of invalid action type"""
        action = {
            "type": "invalid_action_type",
            "value": 100
        }
        
        with pytest.raises(ValueError):
            await rule_engine._execute_action(action, sample_order_event)

    def test_compare_values_error_handling(self, rule_engine):
        """Test comparison error handling"""
        # Should not crash on type mismatches
        result = rule_engine._compare_values("string", "greater_than", 10)
        assert result is False


class TestRuleManager:
    """Test cases for the RuleManager class"""
    
    @pytest.fixture
    async def db_session(self):
        """Create test database session"""
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            yield session

    @pytest.fixture
    def rule_manager(self, db_session):
        """Create RuleManager instance"""
        return RuleManager(db_session)

    def test_rule_validation_valid_rule(self, rule_manager):
        """Test validation of a valid rule"""
        rule_data = {
            "name": "Test Rule",
            "description": "A test rule",
            "event_type": "order_created",
            "priority": 100,
            "conditions": {
                "type": "order_total",
                "operator": "greater_than",
                "value": 100.0
            },
            "actions": [
                {
                    "type": "points",
                    "operation": "add",
                    "amount": 500
                }
            ]
        }
        
        result = rule_manager.validate_rule(rule_data)
        assert result.valid is True
        assert len(result.errors) == 0

    def test_rule_validation_missing_name(self, rule_manager):
        """Test validation with missing name"""
        rule_data = {
            "description": "A test rule",
            "event_type": "order_created",
            "conditions": {
                "type": "order_total",
                "operator": "greater_than",
                "value": 100.0
            },
            "actions": [
                {
                    "type": "points",
                    "operation": "add",
                    "amount": 500
                }
            ]
        }
        
        result = rule_manager.validate_rule(rule_data)
        assert result.valid is False
        assert len(result.errors) > 0

    def test_rule_validation_no_actions(self, rule_manager):
        """Test validation with no actions"""
        rule_data = {
            "name": "Test Rule",
            "event_type": "order_created",
            "conditions": {
                "type": "order_total",
                "operator": "greater_than",
                "value": 100.0
            },
            "actions": []
        }
        
        result = rule_manager.validate_rule(rule_data)
        assert result.valid is False
        assert "Rule must have at least one action" in result.errors


# ============================================================================
# SAMPLE TEST DATA
# ============================================================================

SAMPLE_RULES = [
    {
        "name": "First Order Welcome Bonus",
        "description": "Award 1000 points for first order",
        "event_type": "order_created",
        "conditions": {
            "type": "frequency",
            "event_type": "order_created",
            "operator": "equals",
            "value": 1
        },
        "actions": [
            {
                "type": "points",
                "operation": "add",
                "amount": 1000,
                "reason": "Welcome bonus"
            }
        ]
    },
    {
        "name": "High Value Order Bonus",
        "description": "Award extra points for orders over $200",
        "event_type": "order_created",
        "conditions": {
            "type": "order_total",
            "operator": "greater_than_or_equal",
            "value": 200.0
        },
        "actions": [
            {
                "type": "points",
                "operation": "add",
                "amount": 500,
                "reason": "High value order bonus"
            }
        ]
    },
    {
        "name": "VIP Customer Tier Upgrade",
        "description": "Upgrade customers to VIP after $1000 total spent",
        "event_type": "order_created",
        "conditions": {
            "type": "customer",
            "field": "total_spent",
            "operator": "greater_than_or_equal",
            "value": 1000.0
        },
        "actions": [
            {
                "type": "tier",
                "tier_name": "VIP",
                "reason": "Reached $1000 total spent"
            }
        ]
    }
]

SAMPLE_EVENTS = [
    {
        "event_type": "order_created",
        "order": {
            "id": "order_001",
            "total_price": "150.00",
            "currency": "USD",
            "line_items": [
                {
                    "product": {"id": "prod_123", "tags": ["electronics"]},
                    "quantity": 1,
                    "price": "150.00"
                }
            ]
        },
        "customer": {
            "id": "cust_001",
            "email": "customer1@example.com",
            "total_spent": "150.00",
            "orders_count": 1
        }
    },
    {
        "event_type": "order_created",
        "order": {
            "id": "order_002",
            "total_price": "250.00",
            "currency": "USD",
            "line_items": [
                {
                    "product": {"id": "prod_456", "tags": ["clothing"]},
                    "quantity": 2,
                    "price": "125.00"
                }
            ]
        },
        "customer": {
            "id": "cust_002",
            "email": "customer2@example.com",
            "total_spent": "1200.00",
            "orders_count": 8
        }
    }
]
