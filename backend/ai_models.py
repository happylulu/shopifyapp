from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class InsightType(str, Enum):
    OPPORTUNITY = "opportunity"
    WARNING = "warning"
    OPTIMIZATION = "optimization"
    TREND = "trend"

class ActionType(str, Enum):
    AWARD_POINTS = "award_points"
    SEND_EMAIL = "send_email"
    CREATE_SEGMENT = "create_segment"
    OFFER_DISCOUNT = "offer_discount"
    REFERRAL_INVITE = "referral_invite"

class CustomerSegment(str, Enum):
    HIGH_VALUE = "high_value"
    AT_RISK = "at_risk"
    FREQUENT_BROWSERS = "frequent_browsers"
    WEEKEND_SHOPPERS = "weekend_shoppers"
    RISING_STARS = "rising_stars"
    NEW_CUSTOMERS = "new_customers"
    DORMANT = "dormant"
    VIP = "vip"

class CustomerInsight(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    segment: CustomerSegment
    growth_percentage: float
    orders_count: int
    total_spent: float
    last_order_date: datetime
    risk_score: Optional[float] = None
    engagement_score: float
    predicted_ltv: float
    recommended_actions: List[str]

class AIOpportunity(BaseModel):
    id: str
    type: InsightType
    title: str
    description: str
    impact_score: float  # 0-100
    confidence: float    # 0-1
    affected_customers: List[CustomerInsight]
    recommended_action: str
    potential_revenue: float
    effort_level: str    # "low", "medium", "high"
    created_at: datetime
    expires_at: Optional[datetime] = None

class SegmentAnalytics(BaseModel):
    segment: CustomerSegment
    name: str
    description: str
    customer_count: int
    percentage: float
    avg_order_value: float
    total_revenue: float
    growth_rate: float
    color: str
    icon: str

class AIInsightsResponse(BaseModel):
    success: bool
    opportunities: List[AIOpportunity]
    segments: List[SegmentAnalytics]
    total_customers: int
    insights_generated_at: datetime
    next_update_at: datetime

class CreateSegmentRequest(BaseModel):
    name: str
    description: str
    criteria: Dict[str, Any]
    auto_update: bool = True

class ExecuteActionRequest(BaseModel):
    opportunity_id: str
    action_type: ActionType
    customer_ids: List[str]
    parameters: Dict[str, Any] = {}

class AIPerformanceMetrics(BaseModel):
    total_opportunities_identified: int
    opportunities_acted_upon: int
    success_rate: float
    revenue_generated: float
    customers_engaged: int
    avg_response_time: float
    last_30_days_performance: Dict[str, float] 