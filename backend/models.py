from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class SocialPlatform(str, Enum):
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    EMAIL = "email"

class ReferralLinkConfig(BaseModel):
    """Configuration for referral link generation"""
    shop_domain: str = Field(..., description="Shopify shop domain")
    custom_slug: str = Field(default="ref", description="Custom URL slug for referrals")
    use_utm_parameters: bool = Field(default=True, description="Include UTM tracking parameters")
    use_url_shortener: bool = Field(default=False, description="Use URL shortener service")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('custom_slug')
    def validate_slug(cls, v):
        if not v.isalnum():
            raise ValueError('Custom slug must be alphanumeric')
        return v.lower()

class SocialSharingConfig(BaseModel):
    """Configuration for social media sharing"""
    shop_domain: str = Field(..., description="Shopify shop domain")
    enabled: bool = Field(default=True, description="Enable social sharing")
    platforms: List[SocialPlatform] = Field(default_factory=list, description="Enabled platforms")
    default_message: str = Field(
        default="I love shopping at [Store Name]! Use my referral link for a special discount: [Referral Link]",
        description="Default sharing message"
    )
    use_platform_specific: bool = Field(default=True, description="Use platform-specific messages")
    platform_messages: Dict[SocialPlatform, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ReferralLink(BaseModel):
    """Individual referral link tracking"""
    id: str = Field(..., description="Unique referral link ID")
    shop_domain: str = Field(..., description="Shopify shop domain")
    customer_id: str = Field(..., description="Referring customer ID")
    customer_name: str = Field(..., description="Referring customer name")
    referral_code: str = Field(..., description="Unique referral code")
    full_url: str = Field(..., description="Complete referral URL")
    clicks: int = Field(default=0, description="Number of clicks")
    conversions: int = Field(default=0, description="Number of successful referrals")
    revenue_generated: float = Field(default=0.0, description="Revenue from referrals")
    is_active: bool = Field(default=True, description="Link is active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(None, description="Link expiration date")

class ReferralClick(BaseModel):
    """Track individual referral clicks"""
    id: str = Field(..., description="Click tracking ID")
    referral_link_id: str = Field(..., description="Associated referral link")
    ip_address: str = Field(..., description="Visitor IP address")
    user_agent: str = Field(..., description="Browser user agent")
    platform: Optional[SocialPlatform] = Field(None, description="Source platform")
    utm_source: Optional[str] = Field(None, description="UTM source parameter")
    utm_medium: Optional[str] = Field(None, description="UTM medium parameter")
    utm_campaign: Optional[str] = Field(None, description="UTM campaign parameter")
    converted: bool = Field(default=False, description="Click resulted in purchase")
    order_id: Optional[str] = Field(None, description="Associated order ID if converted")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ReferralAnalytics(BaseModel):
    """Analytics summary for referral program"""
    shop_domain: str = Field(..., description="Shopify shop domain")
    date: datetime = Field(..., description="Analytics date")
    total_links: int = Field(default=0, description="Total active referral links")
    total_clicks: int = Field(default=0, description="Total clicks today")
    total_conversions: int = Field(default=0, description="Total conversions today")
    conversion_rate: float = Field(default=0.0, description="Conversion rate percentage")
    revenue_today: float = Field(default=0.0, description="Revenue generated today")
    top_referrers: List[Dict[str, Any]] = Field(default_factory=list, description="Top performing referrers")

# API Request/Response Models
class CreateReferralLinkRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID creating the referral")
    customer_name: str = Field(..., description="Customer name")
    custom_message: Optional[str] = Field(None, description="Custom sharing message")

class TrackClickRequest(BaseModel):
    referral_link_id: str = Field(..., description="Referral link ID")
    ip_address: str = Field(..., description="Visitor IP address")
    user_agent: str = Field(..., description="Browser user agent")
    platform: Optional[SocialPlatform] = Field(None, description="Source platform")
    utm_source: Optional[str] = Field(None, description="UTM source parameter")
    utm_medium: Optional[str] = Field(None, description="UTM medium parameter")
    utm_campaign: Optional[str] = Field(None, description="UTM campaign parameter")

class TrackConversionRequest(BaseModel):
    referral_link_id: str = Field(..., description="Referral link ID")
    order_id: str = Field(..., description="Order ID")
    order_value: float = Field(..., description="Order value")
    customer_id: Optional[str] = Field(None, description="New customer ID")

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

# Response Models
class ReferralLinkResponse(BaseModel):
    success: bool
    referral_link: Optional[ReferralLink] = None
    error: Optional[str] = None

class AnalyticsResponse(BaseModel):
    success: bool
    analytics: Optional[ReferralAnalytics] = None
    error: Optional[str] = None 