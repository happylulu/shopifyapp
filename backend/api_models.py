"""
API Models for Shopify Loyalty App

This module contains Pydantic models for API requests and responses.
These are separate from the database models in models_v2.py.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


# Enums
class SocialPlatform(str, Enum):
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    EMAIL = "email"


# Referral System Models
class ReferralLinkConfig(BaseModel):
    shop_domain: str
    custom_slug: str = "ref"
    use_utm_parameters: bool = True
    use_url_shortener: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SocialSharingConfig(BaseModel):
    shop_domain: str
    enabled: bool = True
    platforms: List[SocialPlatform] = [SocialPlatform.FACEBOOK, SocialPlatform.TWITTER]
    default_message: str = "Check out this amazing store! Use my referral link: [Referral Link]"
    use_platform_specific: bool = True
    platform_messages: Dict[SocialPlatform, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReferralLink(BaseModel):
    id: str
    shop_domain: str
    customer_id: str
    customer_name: str
    referral_code: str
    full_url: str
    clicks: int = 0
    conversions: int = 0
    revenue_generated: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReferralClick(BaseModel):
    id: str
    referral_link_id: str
    ip_address: str
    user_agent: str
    platform: Optional[SocialPlatform] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    converted: bool = False
    order_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ReferralAnalytics(BaseModel):
    shop_domain: str
    date: datetime
    total_links: int
    total_clicks: int
    total_conversions: int
    conversion_rate: float
    revenue_today: float
    top_referrers: List[Dict[str, Any]]


# Request Models
class CreateReferralLinkRequest(BaseModel):
    customer_id: str
    customer_name: str


class UpdateSocialConfigRequest(BaseModel):
    enabled: Optional[bool] = None
    platforms: Optional[List[SocialPlatform]] = None
    default_message: Optional[str] = None
    use_platform_specific: Optional[bool] = None
    platform_messages: Optional[Dict[SocialPlatform, str]] = None


class UpdateLinkConfigRequest(BaseModel):
    custom_slug: Optional[str] = None
    use_utm_parameters: Optional[bool] = None
    use_url_shortener: Optional[bool] = None


class TrackClickRequest(BaseModel):
    referral_code: str
    ip_address: str
    user_agent: str
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None


class TrackConversionRequest(BaseModel):
    referral_code: str
    order_id: str
    order_value: float


# Response Models
class ReferralLinkResponse(BaseModel):
    success: bool
    referral_link: Optional[ReferralLink] = None
    error: Optional[str] = None


class AnalyticsResponse(BaseModel):
    success: bool
    analytics: Optional[ReferralAnalytics] = None
    error: Optional[str] = None


# ---------------- Loyalty Program Models ----------------

class LoyaltyProfileCreate(BaseModel):
    shopify_customer_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoyaltyProfileResponse(BaseModel):
    id: int
    shopify_customer_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    points_balance: int
    current_tier_name: Optional[str] = None


class AdjustPointsRequest(BaseModel):
    amount: int
    reason: Optional[str] = None


class RewardCreate(BaseModel):
    name: str
    points_cost: int
    reward_type: str
    description: Optional[str] = None


class RewardResponse(BaseModel):
    id: int
    name: str
    points_cost: int
    reward_type: str
    description: Optional[str] = None


class TierCreate(BaseModel):
    name: str
    tier_level: int
    min_points_required: int = 0
    description: Optional[str] = None


class TierResponse(BaseModel):
    id: int
    name: str
    tier_level: int
    min_points_required: int
