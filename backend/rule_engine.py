"""
Rule Engine Implementation
Processes events and executes rules based on conditions and actions
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from rule_models import Rule, RuleExecution, EventQueue, RuleStatus, EventType
from rule_schemas import (
    RuleSchema, ConditionType, ActionType, LogicalCondition, LogicalOperator,
    ComparisonOperator, RuleValidationResult
)
from models_v2 import CustomerLoyaltyProfile, RewardDefinition, TierDefinition
import logging

logger = logging.getLogger(__name__)


class RuleEngine:
    """
    Main rule engine that processes events and executes rules
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.condition_evaluators = {
            "order_total": self._evaluate_order_total,
            "order_item_count": self._evaluate_order_item_count,
            "product": self._evaluate_product,
            "customer": self._evaluate_customer,
            "date": self._evaluate_date,
            "date_range": self._evaluate_date_range,
            "metafield": self._evaluate_metafield,
            "tier": self._evaluate_tier,
            "points": self._evaluate_points,
            "frequency": self._evaluate_frequency,
        }

        self.action_executors = {
            "points": self._execute_points_action,
            "tier": self._execute_tier_action,
            "badge": self._execute_badge_action,
            "webhook": self._execute_webhook_action,
            "email": self._execute_email_action,
            "discount": self._execute_discount_action,
            "tag": self._execute_tag_action,
        }

    async def process_event(self, shop_domain: str, event_type: str, event_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process an event and execute all matching rules

        Args:
            shop_domain: The shop domain
            event_type: Type of event (order_created, etc.)
            event_data: Event payload data

        Returns:
            List of execution results
        """
        start_time = time.time()
        results = []

        try:
            # Load active rules for this shop and event type
            rules = await self._load_active_rules(shop_domain, event_type)
            logger.info(f"Processing {len(rules)} rules for event {event_type} in shop {shop_domain}")

            # Process each rule
            for rule in rules:
                try:
                    result = await self._process_rule(rule, event_data)
                    results.append(result)

                    # Log execution
                    await self._log_execution(rule, event_data, result)

                except Exception as e:
                    logger.error(f"Error processing rule {rule.id}: {str(e)}")
                    error_result = {
                        "rule_id": str(rule.id),
                        "success": False,
                        "error": str(e),
                        "actions_executed": []
                    }
                    results.append(error_result)
                    await self._log_execution(rule, event_data, error_result)

            execution_time = (time.time() - start_time) * 1000
            logger.info(f"Processed {len(rules)} rules in {execution_time:.2f}ms")

        except Exception as e:
            logger.error(f"Error processing event: {str(e)}")
            raise

        return results

    async def _load_active_rules(self, shop_domain: str, event_type: str) -> List[Rule]:
        """Load active rules for shop and event type, ordered by priority"""
        query = select(Rule).where(
            and_(
                Rule.shop_domain == shop_domain,
                Rule.event_type == event_type,
                Rule.status == RuleStatus.ACTIVE
            )
        ).order_by(Rule.priority.asc(), Rule.created_at.asc())

        result = await self.db.execute(query)
        return result.scalars().all()

    async def _process_rule(self, rule: Rule, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single rule against event data"""
        start_time = time.time()

        # Evaluate conditions
        conditions_met = await self._evaluate_conditions(rule.conditions, event_data)

        actions_executed = []
        success = True
        error_message = None

        if conditions_met:
            # Execute actions
            for action_data in rule.actions:
                try:
                    action_result = await self._execute_action(action_data, event_data)
                    actions_executed.append(action_result)
                except Exception as e:
                    logger.error(f"Error executing action in rule {rule.id}: {str(e)}")
                    success = False
                    error_message = str(e)
                    break

            # Update rule execution count
            rule.execution_count += 1
            rule.last_executed_at = datetime.utcnow()
            await self.db.commit()

        execution_time = (time.time() - start_time) * 1000

        return {
            "rule_id": str(rule.id),
            "rule_name": rule.name,
            "conditions_met": conditions_met,
            "actions_executed": actions_executed,
            "success": success,
            "error": error_message,
            "execution_time_ms": round(execution_time, 2)
        }

    async def _evaluate_conditions(self, conditions: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate rule conditions against event data"""
        if "operator" in conditions:
            # Logical condition (AND, OR, NOT)
            return await self._evaluate_logical_condition(conditions, event_data)
        else:
            # Single condition
            return await self._evaluate_single_condition(conditions, event_data)

    async def _evaluate_logical_condition(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate logical condition (AND, OR, NOT)"""
        operator = condition.get("operator")
        sub_conditions = condition.get("conditions", [])

        if operator == LogicalOperator.AND:
            for sub_condition in sub_conditions:
                if not await self._evaluate_conditions(sub_condition, event_data):
                    return False
            return True

        elif operator == LogicalOperator.OR:
            for sub_condition in sub_conditions:
                if await self._evaluate_conditions(sub_condition, event_data):
                    return True
            return False

        elif operator == LogicalOperator.NOT:
            if sub_conditions:
                return not await self._evaluate_conditions(sub_conditions[0], event_data)
            return False

        return False

    async def _evaluate_single_condition(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate a single condition"""
        condition_type = condition.get("type")

        if condition_type in self.condition_evaluators:
            evaluator = self.condition_evaluators[condition_type]
            return await evaluator(condition, event_data)
        else:
            logger.warning(f"Unknown condition type: {condition_type}")
            return False

    async def _execute_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single action"""
        action_type = action.get("type")

        if action_type in self.action_executors:
            executor = self.action_executors[action_type]
            return await executor(action, event_data)
        else:
            raise ValueError(f"Unknown action type: {action_type}")

    # ========================================================================
    # CONDITION EVALUATORS
    # ========================================================================

    async def _evaluate_order_total(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate order total condition"""
        order_total = event_data.get("order", {}).get("total_price", 0)
        operator = condition.get("operator")
        value = condition.get("value", 0)

        return self._compare_values(float(order_total), operator, float(value))

    async def _evaluate_order_item_count(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate order item count condition"""
        line_items = event_data.get("order", {}).get("line_items", [])
        item_count = sum(item.get("quantity", 0) for item in line_items)
        operator = condition.get("operator")
        value = condition.get("value", 0)

        return self._compare_values(item_count, operator, value)

    async def _evaluate_product(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate product-based condition"""
        line_items = event_data.get("order", {}).get("line_items", [])
        operator = condition.get("operator")

        product_ids = set(condition.get("product_ids", []))
        product_tags = set(condition.get("product_tags", []))

        order_product_ids = set()
        order_product_tags = set()

        for item in line_items:
            product = item.get("product", {})
            order_product_ids.add(str(product.get("id", "")))
            order_product_tags.update(product.get("tags", []))

        if product_ids:
            if operator == ComparisonOperator.IN:
                return bool(product_ids.intersection(order_product_ids))
            elif operator == ComparisonOperator.NOT_IN:
                return not bool(product_ids.intersection(order_product_ids))

        if product_tags:
            if operator == ComparisonOperator.CONTAINS:
                return bool(product_tags.intersection(order_product_tags))
            elif operator == ComparisonOperator.NOT_CONTAINS:
                return not bool(product_tags.intersection(order_product_tags))

        return False

    async def _evaluate_customer(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate customer-based condition"""
        customer = event_data.get("customer", {})
        field = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")

        customer_value = customer.get(field)

        if customer_value is None:
            return False

        return self._compare_values(customer_value, operator, value)

    async def _evaluate_date(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate date-based condition"""
        # Implementation for date conditions
        return True  # Placeholder

    async def _evaluate_date_range(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate date range condition"""
        # Implementation for date range conditions
        return True  # Placeholder

    async def _evaluate_metafield(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate metafield condition"""
        # Implementation for metafield conditions
        return True  # Placeholder

    async def _evaluate_tier(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate tier condition"""
        # Implementation for tier conditions
        return True  # Placeholder

    async def _evaluate_points(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate points condition"""
        # Implementation for points conditions
        return True  # Placeholder

    async def _evaluate_frequency(self, condition: Dict[str, Any], event_data: Dict[str, Any]) -> bool:
        """Evaluate frequency condition"""
        # Implementation for frequency conditions
        return True  # Placeholder

    # ========================================================================
    # ACTION EXECUTORS
    # ========================================================================

    async def _execute_points_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute points award/deduction action"""
        customer_id = event_data.get("customer", {}).get("id")
        operation = action.get("operation", "add")
        amount = action.get("amount", 0)
        reason = action.get("reason", "Rule-based points adjustment")

        # Load customer loyalty profile
        # Implementation would update customer points

        return {
            "type": "points",
            "operation": operation,
            "amount": amount,
            "customer_id": customer_id,
            "reason": reason,
            "success": True
        }

    async def _execute_tier_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute tier change action"""
        # Implementation for tier changes
        return {"type": "tier", "success": True}

    async def _execute_badge_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute badge award action"""
        # Implementation for badge awards
        return {"type": "badge", "success": True}

    async def _execute_webhook_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute webhook trigger action"""
        # Implementation for webhook triggers
        return {"type": "webhook", "success": True}

    async def _execute_email_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute email send action"""
        # Implementation for email sending
        return {"type": "email", "success": True}

    async def _execute_discount_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute discount creation action"""
        # Implementation for discount creation
        return {"type": "discount", "success": True}

    async def _execute_tag_action(self, action: Dict[str, Any], event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute tag add/remove action"""
        # Implementation for tag management
        return {"type": "tag", "success": True}

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def _compare_values(self, actual: Any, operator: str, expected: Any) -> bool:
        """Compare two values using the specified operator"""
        try:
            if operator == ComparisonOperator.EQUALS:
                return actual == expected
            elif operator == ComparisonOperator.NOT_EQUALS:
                return actual != expected
            elif operator == ComparisonOperator.GREATER_THAN:
                return actual > expected
            elif operator == ComparisonOperator.GREATER_THAN_OR_EQUAL:
                return actual >= expected
            elif operator == ComparisonOperator.LESS_THAN:
                return actual < expected
            elif operator == ComparisonOperator.LESS_THAN_OR_EQUAL:
                return actual <= expected
            elif operator == ComparisonOperator.CONTAINS:
                return str(expected).lower() in str(actual).lower()
            elif operator == ComparisonOperator.NOT_CONTAINS:
                return str(expected).lower() not in str(actual).lower()
            elif operator == ComparisonOperator.IN:
                return actual in expected if isinstance(expected, (list, set)) else False
            elif operator == ComparisonOperator.NOT_IN:
                return actual not in expected if isinstance(expected, (list, set)) else True
            elif operator == ComparisonOperator.STARTS_WITH:
                return str(actual).lower().startswith(str(expected).lower())
            elif operator == ComparisonOperator.ENDS_WITH:
                return str(actual).lower().endswith(str(expected).lower())
            else:
                return False
        except Exception:
            return False

    async def _log_execution(self, rule: Rule, event_data: Dict[str, Any], result: Dict[str, Any]):
        """Log rule execution for debugging and analytics"""
        execution = RuleExecution(
            rule_id=rule.id,
            shop_domain=rule.shop_domain,
            event_type=rule.event_type,
            event_data=event_data,
            customer_id=event_data.get("customer", {}).get("id"),
            conditions_met=result.get("conditions_met", False),
            actions_executed=result.get("actions_executed", []),
            execution_time_ms=result.get("execution_time_ms", 0),
            success=result.get("success", True),
            error_message=result.get("error"),
        )

        self.db.add(execution)
        await self.db.commit()


class RuleManager:
    """
    Service for managing rules (CRUD operations, validation, testing)
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.rule_engine = RuleEngine(db_session)

    async def create_rule(self, shop_domain: str, rule_data: Dict[str, Any], created_by: str) -> Rule:
        """Create a new rule"""
        # Validate rule schema
        validation_result = self.validate_rule(rule_data)
        if not validation_result.valid:
            raise ValueError(f"Invalid rule: {', '.join(validation_result.errors)}")

        # Create rule
        rule = Rule(
            shop_domain=shop_domain,
            name=rule_data["name"],
            description=rule_data.get("description"),
            event_type=rule_data["event_type"],
            conditions=rule_data["conditions"],
            actions=rule_data["actions"],
            priority=rule_data.get("priority", 100),
            status=RuleStatus.DRAFT,
            created_by=created_by,
            version=1
        )

        self.db.add(rule)
        await self.db.commit()
        await self.db.refresh(rule)

        # Create initial version
        await self._create_version(rule, created_by, "Initial version")

        return rule

    async def update_rule(self, rule_id: str, rule_data: Dict[str, Any], updated_by: str) -> Rule:
        """Update an existing rule"""
        # Load rule
        rule = await self._get_rule(rule_id)
        if not rule:
            raise ValueError(f"Rule {rule_id} not found")

        # Validate rule schema
        validation_result = self.validate_rule(rule_data)
        if not validation_result.valid:
            raise ValueError(f"Invalid rule: {', '.join(validation_result.errors)}")

        # Update rule
        rule.name = rule_data["name"]
        rule.description = rule_data.get("description")
        rule.event_type = rule_data["event_type"]
        rule.conditions = rule_data["conditions"]
        rule.actions = rule_data["actions"]
        rule.priority = rule_data.get("priority", 100)
        rule.version += 1
        rule.updated_at = datetime.utcnow()

        await self.db.commit()

        # Create new version
        await self._create_version(rule, updated_by, "Updated rule")

        return rule

    async def activate_rule(self, rule_id: str) -> Rule:
        """Activate a rule"""
        rule = await self._get_rule(rule_id)
        if not rule:
            raise ValueError(f"Rule {rule_id} not found")

        rule.status = RuleStatus.ACTIVE
        await self.db.commit()
        return rule

    async def deactivate_rule(self, rule_id: str) -> Rule:
        """Deactivate a rule"""
        rule = await self._get_rule(rule_id)
        if not rule:
            raise ValueError(f"Rule {rule_id} not found")

        rule.status = RuleStatus.PAUSED
        await self.db.commit()
        return rule

    async def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule (soft delete by archiving)"""
        rule = await self._get_rule(rule_id)
        if not rule:
            return False

        rule.status = RuleStatus.ARCHIVED
        await self.db.commit()
        return True

    async def test_rule(self, rule_data: Dict[str, Any], test_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Test a rule against sample data"""
        # Create temporary rule for testing
        temp_rule = Rule(
            shop_domain="test",
            name="Test Rule",
            event_type=rule_data["event_type"],
            conditions=rule_data["conditions"],
            actions=rule_data["actions"],
            status=RuleStatus.ACTIVE
        )

        # Process the rule
        result = await self.rule_engine._process_rule(temp_rule, test_payload)
        return result

    def validate_rule(self, rule_data: Dict[str, Any]) -> RuleValidationResult:
        """Validate rule schema and logic"""
        errors = []
        warnings = []

        try:
            # Validate using Pydantic schema
            rule_schema = RuleSchema(**rule_data)

            # Additional business logic validation
            if rule_schema.priority < 1 or rule_schema.priority > 1000:
                warnings.append("Priority should be between 1 and 1000")

            if not rule_schema.actions:
                errors.append("Rule must have at least one action")

            # Validate condition logic
            self._validate_conditions(rule_schema.conditions, errors, warnings)

            # Validate actions
            self._validate_actions(rule_schema.actions, errors, warnings)

        except Exception as e:
            errors.append(f"Schema validation error: {str(e)}")

        return RuleValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    def _validate_conditions(self, conditions: Any, errors: List[str], warnings: List[str]):
        """Validate rule conditions"""
        # Implementation for condition validation
        pass

    def _validate_actions(self, actions: List[Any], errors: List[str], warnings: List[str]):
        """Validate rule actions"""
        # Implementation for action validation
        pass

    async def _get_rule(self, rule_id: str) -> Optional[Rule]:
        """Get rule by ID"""
        query = select(Rule).where(Rule.id == rule_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _create_version(self, rule: Rule, created_by: str, change_notes: str):
        """Create a version snapshot of the rule"""
        from rule_models import RuleVersion

        version = RuleVersion(
            rule_id=rule.id,
            version_number=rule.version,
            name=rule.name,
            description=rule.description,
            event_type=rule.event_type,
            conditions=rule.conditions,
            actions=rule.actions,
            created_by=created_by,
            change_notes=change_notes
        )

        self.db.add(version)
        await self.db.commit()
