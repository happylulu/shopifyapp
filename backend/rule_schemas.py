"""
Rule Engine Schema Definitions
Defines the JSON schemas for rule conditions and actions
"""

from typing import Dict, List, Any, Union, Optional, Literal
from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import datetime, date


# ============================================================================
# CONDITION SCHEMAS
# ============================================================================

class ComparisonOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
    LESS_THAN = "less_than"
    LESS_THAN_OR_EQUAL = "less_than_or_equal"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"


class LogicalOperator(str, Enum):
    AND = "and"
    OR = "or"
    NOT = "not"


class OrderTotalCondition(BaseModel):
    """Condition based on order total amount"""
    type: Literal["order_total"] = "order_total"
    operator: ComparisonOperator
    value: float
    currency: Optional[str] = None  # If None, uses shop's default currency


class OrderItemCountCondition(BaseModel):
    """Condition based on number of items in order"""
    type: Literal["order_item_count"] = "order_item_count"
    operator: ComparisonOperator
    value: int


class ProductCondition(BaseModel):
    """Condition based on specific products in order"""
    type: Literal["product"] = "product"
    operator: ComparisonOperator  # in, not_in, contains, etc.
    product_ids: List[str] = Field(default_factory=list)
    product_tags: List[str] = Field(default_factory=list)
    product_types: List[str] = Field(default_factory=list)
    collections: List[str] = Field(default_factory=list)


class CustomerCondition(BaseModel):
    """Condition based on customer properties"""
    type: Literal["customer"] = "customer"
    field: str  # email, tags, total_spent, orders_count, etc.
    operator: ComparisonOperator
    value: Union[str, int, float, List[str]]


class DateCondition(BaseModel):
    """Condition based on date/time"""
    type: Literal["date"] = "date"
    field: str  # order_date, customer_created_at, etc.
    operator: ComparisonOperator
    value: Union[str, datetime]  # ISO string or datetime
    timezone: Optional[str] = "UTC"


class DateRangeCondition(BaseModel):
    """Condition for date ranges (e.g., holiday periods)"""
    type: Literal["date_range"] = "date_range"
    start_date: Union[str, date]
    end_date: Union[str, date]
    recurring_yearly: bool = False  # If true, applies every year


class MetafieldCondition(BaseModel):
    """Condition based on product/customer metafields"""
    type: Literal["metafield"] = "metafield"
    namespace: str
    key: str
    operator: ComparisonOperator
    value: Union[str, int, float, bool]
    target: str = "product"  # product, customer, order


class TierCondition(BaseModel):
    """Condition based on customer's current tier"""
    type: Literal["tier"] = "tier"
    operator: ComparisonOperator
    tier_names: List[str]


class PointsCondition(BaseModel):
    """Condition based on customer's current points"""
    type: Literal["points"] = "points"
    operator: ComparisonOperator
    value: int


class FrequencyCondition(BaseModel):
    """Condition based on event frequency (e.g., first order, Nth order)"""
    type: Literal["frequency"] = "frequency"
    event_type: str
    operator: ComparisonOperator
    value: int  # e.g., 1 for first order, 5 for fifth order
    time_window_days: Optional[int] = None  # Within X days


# Union of all condition types
ConditionType = Union[
    OrderTotalCondition,
    OrderItemCountCondition,
    ProductCondition,
    CustomerCondition,
    DateCondition,
    DateRangeCondition,
    MetafieldCondition,
    TierCondition,
    PointsCondition,
    FrequencyCondition
]


class LogicalCondition(BaseModel):
    """Logical grouping of conditions"""
    operator: LogicalOperator
    conditions: List[Union[ConditionType, 'LogicalCondition']]


# ============================================================================
# ACTION SCHEMAS
# ============================================================================

class PointsAction(BaseModel):
    """Award or deduct points"""
    type: Literal["points"] = "points"
    operation: str = "add"  # add, subtract, set
    amount: int
    reason: Optional[str] = None
    multiplier_field: Optional[str] = None  # e.g., "order_total" for percentage-based points


class TierAction(BaseModel):
    """Change customer tier"""
    type: Literal["tier"] = "tier"
    tier_name: str
    reason: Optional[str] = None


class BadgeAction(BaseModel):
    """Award a badge to customer"""
    type: Literal["badge"] = "badge"
    badge_name: str
    badge_description: Optional[str] = None
    badge_icon: Optional[str] = None


class WebhookAction(BaseModel):
    """Trigger external webhook"""
    type: Literal["webhook"] = "webhook"
    url: str
    method: str = "POST"
    headers: Dict[str, str] = Field(default_factory=dict)
    payload_template: Optional[Dict[str, Any]] = None


class EmailAction(BaseModel):
    """Send email to customer"""
    type: Literal["email"] = "email"
    template_id: str
    subject: Optional[str] = None
    variables: Dict[str, Any] = Field(default_factory=dict)


class DiscountAction(BaseModel):
    """Create discount code for customer"""
    type: Literal["discount"] = "discount"
    discount_type: str  # percentage, fixed_amount, free_shipping
    value: float
    code_prefix: Optional[str] = None
    expires_in_days: Optional[int] = 30
    usage_limit: Optional[int] = 1


class TagAction(BaseModel):
    """Add or remove customer tags"""
    type: Literal["tag"] = "tag"
    operation: str  # add, remove
    tags: List[str]


# Union of all action types
ActionType = Union[
    PointsAction,
    TierAction,
    BadgeAction,
    WebhookAction,
    EmailAction,
    DiscountAction,
    TagAction
]


# ============================================================================
# COMPLETE RULE SCHEMA
# ============================================================================

class RuleSchema(BaseModel):
    """Complete rule definition schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: str
    priority: int = Field(100, ge=1, le=1000)

    # Conditions (all must be true for rule to execute)
    conditions: Union[ConditionType, LogicalCondition]

    # Actions (all will be executed if conditions are met)
    actions: List[ActionType]

    # Metadata
    enabled: bool = True
    tags: List[str] = Field(default_factory=list)


# ============================================================================
# VALIDATION SCHEMAS
# ============================================================================

class RuleValidationResult(BaseModel):
    """Result of rule validation"""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class RuleTestPayload(BaseModel):
    """Payload for testing rules"""
    event_type: str
    event_data: Dict[str, Any]
    customer_data: Optional[Dict[str, Any]] = None
    expected_actions: Optional[List[str]] = None


# Update forward references
LogicalCondition.model_rebuild()
