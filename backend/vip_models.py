from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum

class VIPTierLevel(str, Enum):
    """VIP tier levels in ascending order"""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class QualificationCriteria(str, Enum):
    """How customers qualify for VIP tiers"""
    TOTAL_SPENT = "total_spent"
    POINTS_EARNED = "points_earned"
    ORDERS_COUNT = "orders_count"
    MANUAL = "manual"
    HYBRID = "hybrid"  # Combination of criteria

class BenefitType(str, Enum):
    """Types of VIP benefits"""
    POINTS_MULTIPLIER = "points_multiplier"
    EXCLUSIVE_DISCOUNT = "exclusive_discount"
    FREE_SHIPPING = "free_shipping"
    EARLY_ACCESS = "early_access"
    BIRTHDAY_REWARD = "birthday_reward"
    PRIORITY_SUPPORT = "priority_support"
    EXCLUSIVE_PRODUCTS = "exclusive_products"
    CUSTOM_BENEFIT = "custom_benefit"

class VIPBenefit(BaseModel):
    """Individual VIP benefit configuration"""
    id: str = Field(..., description="Unique benefit ID")
    type: BenefitType = Field(..., description="Type of benefit")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Benefit description")
    value: Union[float, str, bool] = Field(..., description="Benefit value (e.g., 2.0 for 2x points)")
    icon: str = Field(default="🎁", description="Display icon")
    is_active: bool = Field(default=True, description="Benefit is active")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional benefit data")

class VIPTier(BaseModel):
    """VIP tier configuration"""
    id: str = Field(..., description="Unique tier ID")
    level: VIPTierLevel = Field(..., description="Tier level")
    name: str = Field(..., description="Display name (e.g., 'Gold Member')")
    description: str = Field(..., description="Tier description")
    color: str = Field(..., description="Brand color for tier")
    icon: str = Field(..., description="Tier icon/emoji")
    
    # Qualification criteria
    qualification_criteria: QualificationCriteria = Field(..., description="How to qualify")
    min_spent: Optional[float] = Field(None, description="Minimum total spent")
    min_points: Optional[int] = Field(None, description="Minimum points earned")
    min_orders: Optional[int] = Field(None, description="Minimum orders placed")
    qualification_period_days: int = Field(365, description="Period for qualification (0 = lifetime)")
    
    # Benefits
    benefits: List[VIPBenefit] = Field(default_factory=list, description="Tier benefits")
    points_multiplier: float = Field(1.0, description="Points earning multiplier")
    
    # Retention
    retention_period_days: int = Field(365, description="How long tier status lasts")
    grace_period_days: int = Field(30, description="Grace period before downgrade")
    
    # Display
    badge_url: Optional[str] = Field(None, description="Custom badge image URL")
    welcome_message: str = Field("Welcome to {tier_name}!", description="Welcome message template")
    
    # Metadata
    is_active: bool = Field(default=True, description="Tier is active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VIPMember(BaseModel):
    """VIP program member"""
    id: str = Field(..., description="Unique member ID")
    customer_id: str = Field(..., description="Shopify customer ID")
    customer_name: str = Field(..., description="Customer name")
    customer_email: str = Field(..., description="Customer email")
    
    # Current status
    current_tier: VIPTierLevel = Field(..., description="Current VIP tier")
    tier_started_at: datetime = Field(..., description="When current tier was achieved")
    tier_expires_at: Optional[datetime] = Field(None, description="When tier expires")
    
    # Progress tracking
    total_spent: float = Field(0.0, description="Total amount spent")
    total_points: int = Field(0, description="Total points earned")
    total_orders: int = Field(0, description="Total orders placed")
    
    # Qualification progress
    spent_this_period: float = Field(0.0, description="Spent in current qualification period")
    points_this_period: int = Field(0, description="Points in current qualification period")
    orders_this_period: int = Field(0, description="Orders in current qualification period")
    
    # Next tier progress
    next_tier: Optional[VIPTierLevel] = Field(None, description="Next achievable tier")
    progress_to_next_tier: float = Field(0.0, description="Progress percentage to next tier")
    amount_to_next_tier: Optional[float] = Field(None, description="Amount needed for next tier")
    
    # Benefits usage
    benefits_used: Dict[str, int] = Field(default_factory=dict, description="Benefits usage count")
    lifetime_value: float = Field(0.0, description="Customer lifetime value")
    
    # Metadata
    is_active: bool = Field(default=True, description="Member is active")
    joined_vip_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = Field(None, description="Internal notes")

class VIPActivity(BaseModel):
    """Track VIP member activities"""
    id: str = Field(..., description="Activity ID")
    member_id: str = Field(..., description="VIP member ID")
    activity_type: str = Field(..., description="Type of activity")
    description: str = Field(..., description="Activity description")
    points_earned: Optional[int] = Field(None, description="Points from activity")
    amount_spent: Optional[float] = Field(None, description="Amount spent")
    benefit_used: Optional[str] = Field(None, description="Benefit ID if used")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VIPProgramConfig(BaseModel):
    """Overall VIP program configuration"""
    shop_domain: str = Field(..., description="Shopify shop domain")
    program_name: str = Field(default="VIP Program", description="Program display name")
    is_active: bool = Field(default=True, description="Program is active")
    
    # Tiers
    tiers: List[VIPTier] = Field(default_factory=list, description="Configured tiers")
    auto_upgrade: bool = Field(default=True, description="Automatically upgrade tiers")
    auto_downgrade: bool = Field(default=True, description="Automatically downgrade tiers")
    
    # Notifications
    send_tier_notifications: bool = Field(default=True, description="Send tier change emails")
    send_benefit_reminders: bool = Field(default=True, description="Send benefit reminder emails")
    
    # Display
    show_progress_bar: bool = Field(default=True, description="Show tier progress to customers")
    show_benefits_page: bool = Field(default=True, description="Show VIP benefits page")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# API Request/Response Models
class CreateVIPMemberRequest(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    tier_level: VIPTierLevel
    manual_assignment: bool = Field(default=False)
    notes: Optional[str] = None

class UpdateVIPTierRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_spent: Optional[float] = None
    min_points: Optional[int] = None
    min_orders: Optional[int] = None
    benefits: Optional[List[VIPBenefit]] = None
    points_multiplier: Optional[float] = None
    is_active: Optional[bool] = None

class VIPAnalytics(BaseModel):
    """VIP program analytics"""
    total_vip_members: int = Field(0, description="Total VIP members")
    members_by_tier: Dict[VIPTierLevel, int] = Field(default_factory=dict)
    total_vip_revenue: float = Field(0.0, description="Revenue from VIP members")
    avg_vip_order_value: float = Field(0.0, description="Average VIP order value")
    vip_retention_rate: float = Field(0.0, description="VIP customer retention rate")
    benefits_redemption_rate: float = Field(0.0, description="Benefits usage rate")
    tier_progression_rate: float = Field(0.0, description="Members upgrading tiers")
    
    # Time-based metrics
    new_vip_members_30d: int = Field(0, description="New VIP members last 30 days")
    vip_revenue_30d: float = Field(0.0, description="VIP revenue last 30 days")
    
    # Top performers
    top_vip_members: List[Dict[str, Any]] = Field(default_factory=list)
    most_used_benefits: List[Dict[str, Any]] = Field(default_factory=list)
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# Response models
class VIPMemberResponse(BaseModel):
    success: bool
    member: Optional[VIPMember] = None
    error: Optional[str] = None

class VIPTierResponse(BaseModel):
    success: bool
    tier: Optional[VIPTier] = None
    error: Optional[str] = None

class VIPAnalyticsResponse(BaseModel):
    success: bool
    analytics: Optional[VIPAnalytics] = None
    error: Optional[str] = None 