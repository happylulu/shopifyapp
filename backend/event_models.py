from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class EventStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EventType(str, Enum):
    POINTS_MULTIPLIER = "points_multiplier"
    BONUS_POINTS = "bonus_points"
    EXCLUSIVE_DISCOUNT = "exclusive_discount"
    EARLY_ACCESS = "early_access"
    VIP_APPRECIATION = "vip_appreciation"
    RECOVERY_CAMPAIGN = "recovery_campaign"
    ONBOARDING = "onboarding"
    SEASONAL = "seasonal"

class TargetType(str, Enum):
    VIP_TIER = "vip_tier"
    AI_SEGMENT = "ai_segment"
    CUSTOM = "custom"
    ALL_VIPS = "all_vips"

class EventReward(BaseModel):
    type: str
    value: float
    description: str
    max_uses_per_customer: Optional[int] = None

class EventTarget(BaseModel):
    type: TargetType
    values: List[str]  # tier names or segment names
    estimated_reach: int = 0

class VIPEvent(BaseModel):
    id: str
    name: str
    description: str
    event_type: EventType
    status: EventStatus = EventStatus.DRAFT
    
    # Targeting
    targets: List[EventTarget]
    
    # Rewards
    rewards: List[EventReward]
    
    # Scheduling
    start_date: datetime
    end_date: datetime
    
    # Metrics
    total_participants: int = 0
    total_rewards_claimed: int = 0
    total_revenue_generated: float = 0.0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    created_by: str = "admin"
    
    # Additional settings
    auto_enroll: bool = True
    send_notifications: bool = True
    require_opt_in: bool = False
    max_participants: Optional[int] = None
    budget_limit: Optional[float] = None
    
    # Display
    icon: str = "🎉"
    color: str = "#8B5CF6"

class CreateEventRequest(BaseModel):
    name: str
    description: str
    event_type: EventType
    targets: List[EventTarget]
    rewards: List[EventReward]
    start_date: datetime
    end_date: datetime
    auto_enroll: bool = True
    send_notifications: bool = True
    require_opt_in: bool = False
    max_participants: Optional[int] = None
    budget_limit: Optional[float] = None
    icon: str = "🎉"

class UpdateEventRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    targets: Optional[List[EventTarget]] = None
    rewards: Optional[List[EventReward]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[EventStatus] = None
    auto_enroll: Optional[bool] = None
    send_notifications: Optional[bool] = None

class EventParticipant(BaseModel):
    event_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    enrolled_at: datetime
    rewards_claimed: List[Dict[str, Any]] = []
    total_value_claimed: float = 0.0
    last_activity: Optional[datetime] = None

class EventAnalytics(BaseModel):
    event_id: str
    status: EventStatus
    participants_count: int
    conversion_rate: float
    avg_order_value: float
    total_revenue: float
    roi: float
    engagement_rate: float
    
    # Breakdown by target
    performance_by_target: Dict[str, Dict[str, Any]]
    
    # Time series data
    daily_metrics: List[Dict[str, Any]]

class EventListResponse(BaseModel):
    events: List[VIPEvent]
    total: int
    active_count: int
    scheduled_count: int
    draft_count: int

class EventCalendarItem(BaseModel):
    id: str
    name: str
    event_type: EventType
    status: EventStatus
    start_date: datetime
    end_date: datetime
    targets_summary: List[str]
    rewards_summary: List[str]
    estimated_reach: int
    icon: str
    color: str 