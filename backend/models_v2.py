"""
Enhanced Database Models for Shopify Loyalty App
Version 2.0 - Comprehensive loyalty program schema

This module contains the improved database models that support:
- Multi-tenant shop management
- Comprehensive customer loyalty profiles
- Points transaction system with full audit trail
- Tier management with progression tracking
- Reward catalog and redemption system
- Campaign and event management
- Enhanced referral system
- Analytics and reporting support
"""

import os
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Float,
    Numeric,
    Text,
    JSON,
    func,
    Index,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://neondb_owner:npg_nTXijxMf0yL9@ep-divine-snow-a8px2qp1-pooler.eastus2.azure.neon.tech/shopify?ssl=require",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, expire_on_commit=False)

Base = declarative_base()


# Enums for better type safety
class PointTransactionType(str, Enum):
    EARNED = "earned"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    ADJUSTED = "adjusted"
    BONUS = "bonus"
    REFUNDED = "refunded"


class PointEarnSource(str, Enum):
    PURCHASE = "purchase"
    REFERRAL = "referral"
    SIGNUP = "signup"
    REVIEW = "review"
    SOCIAL_SHARE = "social_share"
    BIRTHDAY = "birthday"
    CAMPAIGN = "campaign"
    MANUAL = "manual"


class TierType(str, Enum):
    POINTS_BASED = "points_based"
    SPEND_BASED = "spend_based"
    HYBRID = "hybrid"


class RewardType(str, Enum):
    DISCOUNT_PERCENTAGE = "discount_percentage"
    DISCOUNT_FIXED = "discount_fixed"
    FREE_SHIPPING = "free_shipping"
    FREE_PRODUCT = "free_product"
    STORE_CREDIT = "store_credit"
    CUSTOM = "custom"


class RedemptionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Core Models

class Shop(Base):
    """Enhanced shop model with loyalty program configuration"""
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True)
    shop_domain = Column(String(255), unique=True, index=True, nullable=False)
    access_token = Column(String(255))

    # Loyalty program settings
    loyalty_enabled = Column(Boolean, default=True)
    points_per_dollar = Column(Numeric(10, 2), default=Decimal('1.00'))
    welcome_points = Column(Integer, default=100)
    referral_points_referrer = Column(Integer, default=500)
    referral_points_referee = Column(Integer, default=250)

    # Point expiration settings
    points_expire_enabled = Column(Boolean, default=False)
    points_expire_days = Column(Integer, default=365)

    # Branding and customization
    brand_color = Column(String(7), default="#8B5CF6")  # Hex color
    loyalty_program_name = Column(String(100), default="Loyalty Program")

    # Notification settings
    email_notifications_enabled = Column(Boolean, default=True)
    sms_notifications_enabled = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customers = relationship("CustomerLoyaltyProfile", back_populates="shop", cascade="all, delete-orphan")
    tiers = relationship("TierDefinition", back_populates="shop", cascade="all, delete-orphan")
    rewards = relationship("RewardDefinition", back_populates="shop", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="shop", cascade="all, delete-orphan")


class CustomerLoyaltyProfile(Base):
    """Comprehensive customer loyalty profile"""
    __tablename__ = "customer_loyalty_profiles"

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    shopify_customer_id = Column(String(50), nullable=False)  # Shopify's customer ID

    # Customer basic info (cached from Shopify)
    email = Column(String(255))
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))

    # Loyalty metrics
    points_balance = Column(Integer, default=0)
    lifetime_points_earned = Column(Integer, default=0)
    lifetime_points_redeemed = Column(Integer, default=0)
    lifetime_spent = Column(Numeric(12, 2), default=Decimal('0.00'))
    lifetime_orders = Column(Integer, default=0)

    # Tier information
    current_tier_id = Column(Integer, ForeignKey("tier_definitions.id"), nullable=True)
    tier_achieved_at = Column(DateTime(timezone=True))
    tier_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Engagement metrics
    last_purchase_at = Column(DateTime(timezone=True))
    last_login_at = Column(DateTime(timezone=True))
    last_points_earned_at = Column(DateTime(timezone=True))

    # Preferences
    email_opt_in = Column(Boolean, default=True)
    sms_opt_in = Column(Boolean, default=False)
    birthday = Column(DateTime(timezone=True), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_vip = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    shop = relationship("Shop", back_populates="customers")
    current_tier = relationship(
        "TierDefinition",
        foreign_keys=[current_tier_id],
        back_populates="customers",
    )
    point_transactions = relationship(
        "PointTransaction",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    redemptions = relationship(
        "RedemptionLog",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    tier_history = relationship(
        "CustomerTierHistory",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    referral_links = relationship(
        "ReferralLink",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    participations = relationship(
        "CampaignParticipation",
        back_populates="customer",
        cascade="all, delete-orphan",
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint('shop_id', 'shopify_customer_id', name='uq_shop_customer'),
        Index('ix_customer_email_shop', 'shop_id', 'email'),
        Index('ix_customer_points_balance', 'points_balance'),
        Index('ix_customer_tier', 'current_tier_id'),
        CheckConstraint('points_balance >= 0', name='ck_points_balance_positive'),
        CheckConstraint('lifetime_points_earned >= 0', name='ck_lifetime_earned_positive'),
        CheckConstraint('lifetime_spent >= 0', name='ck_lifetime_spent_positive'),
    )

    @property
    def current_tier_name(self) -> Optional[str]:
        """Convenience access to the name of the customer's current tier."""
        return self.current_tier.name if self.current_tier else None


class PointTransaction(Base):
    """Detailed points transaction history with full audit trail"""
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)

    # Transaction details
    transaction_type = Column(String(20), nullable=False)  # PointTransactionType enum
    points_amount = Column(Integer, nullable=False)  # Can be negative for redemptions
    points_balance_after = Column(Integer, nullable=False)

    # Source tracking
    source = Column(String(20), nullable=False)  # PointEarnSource enum
    source_id = Column(String(100), nullable=True)  # Order ID, campaign ID, etc.
    description = Column(Text)

    # Related entities
    order_id = Column(String(100), nullable=True)  # Shopify order ID
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    redemption_id = Column(Integer, ForeignKey("redemption_logs.id"), nullable=True)

    # Expiration tracking
    expires_at = Column(DateTime(timezone=True), nullable=True)
    expired_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(50), default="system")  # system, admin, customer

    # Relationships
    customer = relationship("CustomerLoyaltyProfile", back_populates="point_transactions")
    campaign = relationship("Campaign", back_populates="point_transactions")
    redemption = relationship("RedemptionLog", back_populates="point_transaction")

    # Constraints
    __table_args__ = (
        Index('ix_points_customer_date', 'customer_id', 'created_at'),
        Index('ix_points_type_source', 'transaction_type', 'source'),
        Index('ix_points_expiration', 'expires_at'),
        CheckConstraint('points_amount != 0', name='ck_points_amount_not_zero'),
        CheckConstraint('points_balance_after >= 0', name='ck_balance_after_positive'),
    )


class TierDefinition(Base):
    """Loyalty tier definitions with progression rules"""
    __tablename__ = "tier_definitions"

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)

    # Tier details
    name = Column(String(100), nullable=False)
    description = Column(Text)
    tier_level = Column(Integer, nullable=False)  # 1 = lowest, higher = better
    color = Column(String(7), default="#8B5CF6")  # Hex color for UI
    icon = Column(String(50), default="⭐")  # Emoji or icon identifier

    # Qualification criteria
    tier_type = Column(String(20), default=TierType.POINTS_BASED)
    min_points_required = Column(Integer, default=0)
    min_spend_required = Column(Numeric(12, 2), default=Decimal('0.00'))
    min_orders_required = Column(Integer, default=0)
    qualification_period_days = Column(Integer, default=365)  # 0 = lifetime

    # Benefits
    points_multiplier = Column(Numeric(3, 2), default=Decimal('1.00'))  # 1.5x points
    discount_percentage = Column(Numeric(5, 2), default=Decimal('0.00'))  # 5% discount
    free_shipping = Column(Boolean, default=False)
    early_access = Column(Boolean, default=False)
    birthday_bonus_points = Column(Integer, default=0)

    # Tier maintenance
    requires_maintenance = Column(Boolean, default=False)  # Must maintain criteria
    maintenance_period_days = Column(Integer, default=365)

    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Default tier for new customers

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    shop = relationship("Shop", back_populates="tiers")
    customers = relationship(
        "CustomerLoyaltyProfile",
        foreign_keys="CustomerLoyaltyProfile.current_tier_id",
        back_populates="current_tier",
    )
    tier_history = relationship("CustomerTierHistory", back_populates="tier")

    # Constraints
    __table_args__ = (
        UniqueConstraint('shop_id', 'name', name='uq_shop_tier_name'),
        UniqueConstraint('shop_id', 'tier_level', name='uq_shop_tier_level'),
        Index('ix_tier_level', 'tier_level'),
        CheckConstraint('tier_level > 0', name='ck_tier_level_positive'),
        CheckConstraint('min_points_required >= 0', name='ck_min_points_positive'),
        CheckConstraint('min_spend_required >= 0', name='ck_min_spend_positive'),
        CheckConstraint('points_multiplier > 0', name='ck_points_multiplier_positive'),
    )


class CustomerTierHistory(Base):
    """Track customer tier changes over time"""
    __tablename__ = "customer_tier_history"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)
    tier_id = Column(Integer, ForeignKey("tier_definitions.id", ondelete="CASCADE"), nullable=False)

    # Tier change details
    achieved_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    reason = Column(String(100))  # "qualification", "manual", "downgrade"

    # Qualification metrics at time of achievement
    points_at_achievement = Column(Integer)
    spend_at_achievement = Column(Numeric(12, 2))
    orders_at_achievement = Column(Integer)

    # Status
    is_current = Column(Boolean, default=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer = relationship("CustomerLoyaltyProfile", back_populates="tier_history")
    tier = relationship("TierDefinition", back_populates="tier_history")

    # Constraints
    __table_args__ = (
        Index('ix_tier_history_customer', 'customer_id', 'achieved_at'),
        Index('ix_tier_history_current', 'customer_id', 'is_current'),
    )


class RewardDefinition(Base):
    """Catalog of available rewards"""
    __tablename__ = "reward_definitions"

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)

    # Reward details
    name = Column(String(200), nullable=False)
    description = Column(Text)
    reward_type = Column(String(30), nullable=False)  # RewardType enum

    # Cost and value
    points_cost = Column(Integer, nullable=False)
    reward_value = Column(JSON)  # Flexible storage for different reward types

    # Availability
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)

    # Limits
    max_redemptions_per_customer = Column(Integer, nullable=True)  # NULL = unlimited
    max_redemptions_total = Column(Integer, nullable=True)  # NULL = unlimited
    current_redemptions = Column(Integer, default=0)

    # Scheduling
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)

    # Tier restrictions
    min_tier_level = Column(Integer, default=1)
    allowed_tier_ids = Column(JSON, nullable=True)  # List of specific tier IDs

    # Display
    image_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    shop = relationship("Shop", back_populates="rewards")
    redemptions = relationship("RedemptionLog", back_populates="reward")

    # Constraints
    __table_args__ = (
        Index('ix_reward_shop_active', 'shop_id', 'is_active'),
        Index('ix_reward_points_cost', 'points_cost'),
        Index('ix_reward_tier_level', 'min_tier_level'),
        CheckConstraint('points_cost > 0', name='ck_points_cost_positive'),
        CheckConstraint('max_redemptions_per_customer > 0', name='ck_max_redemptions_customer_positive'),
        CheckConstraint('max_redemptions_total > 0', name='ck_max_redemptions_total_positive'),
        CheckConstraint('current_redemptions >= 0', name='ck_current_redemptions_positive'),
    )


class RedemptionLog(Base):
    """Track reward redemptions with full audit trail"""
    __tablename__ = "redemption_logs"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)
    reward_id = Column(Integer, ForeignKey("reward_definitions.id", ondelete="CASCADE"), nullable=False)

    # Redemption details
    points_spent = Column(Integer, nullable=False)
    status = Column(String(20), default=RedemptionStatus.PENDING)

    # Generated reward details
    discount_code = Column(String(50), nullable=True)  # Generated discount code
    discount_amount = Column(Numeric(10, 2), nullable=True)
    reward_data = Column(JSON, nullable=True)  # Additional reward-specific data

    # Usage tracking
    used_at = Column(DateTime(timezone=True), nullable=True)
    used_order_id = Column(String(100), nullable=True)  # Shopify order where used
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Failure tracking
    failure_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Metadata
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer = relationship("CustomerLoyaltyProfile", back_populates="redemptions")
    reward = relationship("RewardDefinition", back_populates="redemptions")
    point_transaction = relationship("PointTransaction", back_populates="redemption", uselist=False)

    # Constraints
    __table_args__ = (
        Index('ix_redemption_customer_date', 'customer_id', 'redeemed_at'),
        Index('ix_redemption_status', 'status'),
        Index('ix_redemption_discount_code', 'discount_code'),
        Index('ix_redemption_expiration', 'expires_at'),
        CheckConstraint('points_spent > 0', name='ck_points_spent_positive'),
    )


class Campaign(Base):
    """Marketing campaigns and special events"""
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)

    # Campaign details
    name = Column(String(200), nullable=False)
    description = Column(Text)
    campaign_type = Column(String(50))  # "points_bonus", "tier_promotion", "referral_boost"

    # Scheduling
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)

    # Campaign rules
    rules = Column(JSON)  # Flexible rules storage
    bonus_points = Column(Integer, default=0)
    bonus_multiplier = Column(Numeric(3, 2), default=Decimal('1.00'))

    # Targeting
    target_all_customers = Column(Boolean, default=True)
    target_tier_ids = Column(JSON, nullable=True)  # List of tier IDs
    target_customer_ids = Column(JSON, nullable=True)  # List of customer IDs

    # Limits
    max_participants = Column(Integer, nullable=True)
    budget_limit = Column(Numeric(12, 2), nullable=True)
    current_participants = Column(Integer, default=0)
    current_spend = Column(Numeric(12, 2), default=Decimal('0.00'))

    # Status
    status = Column(String(20), default=CampaignStatus.DRAFT)
    is_featured = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100))

    # Relationships
    shop = relationship("Shop", back_populates="campaigns")
    point_transactions = relationship("PointTransaction", back_populates="campaign")
    participations = relationship("CampaignParticipation", back_populates="campaign", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        Index('ix_campaign_shop_status', 'shop_id', 'status'),
        Index('ix_campaign_dates', 'start_date', 'end_date'),
        CheckConstraint('end_date > start_date', name='ck_campaign_dates_valid'),
        CheckConstraint('max_participants > 0', name='ck_max_participants_positive'),
        CheckConstraint('budget_limit > 0', name='ck_budget_limit_positive'),
    )


class CampaignParticipation(Base):
    """Track customer participation in campaigns"""
    __tablename__ = "campaign_participations"

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)

    # Participation details
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    points_earned = Column(Integer, default=0)
    orders_made = Column(Integer, default=0)
    amount_spent = Column(Numeric(12, 2), default=Decimal('0.00'))

    # Status
    is_active = Column(Boolean, default=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="participations")
    customer = relationship(
        "CustomerLoyaltyProfile",
        back_populates="participations",
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint('campaign_id', 'customer_id', name='uq_campaign_customer'),
        Index('ix_participation_campaign', 'campaign_id', 'joined_at'),
    )


class ReferralLink(Base):
    """Enhanced referral link system"""
    __tablename__ = "referral_links"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)

    # Link details
    referral_code = Column(String(50), unique=True, nullable=False)
    referral_url = Column(String(500), nullable=False)

    # Rewards configuration
    referrer_points = Column(Integer, default=500)  # Points for referrer
    referee_points = Column(Integer, default=250)   # Points for new customer
    referrer_discount_percentage = Column(Numeric(5, 2), default=Decimal('0.00'))
    referee_discount_percentage = Column(Numeric(5, 2), default=Decimal('10.00'))

    # Performance tracking
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    total_revenue = Column(Numeric(12, 2), default=Decimal('0.00'))
    total_points_awarded = Column(Integer, default=0)

    # Status and limits
    is_active = Column(Boolean, default=True)
    max_uses = Column(Integer, nullable=True)  # NULL = unlimited
    current_uses = Column(Integer, default=0)

    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer = relationship("CustomerLoyaltyProfile", back_populates="referral_links")
    referrals = relationship("ReferralConversion", back_populates="referral_link", cascade="all, delete-orphan")
    clicks_log = relationship("ReferralClick", back_populates="referral_link", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        Index('ix_referral_code', 'referral_code'),
        Index('ix_referral_customer', 'customer_id'),
        Index('ix_referral_active', 'is_active'),
        CheckConstraint('referrer_points >= 0', name='ck_referrer_points_positive'),
        CheckConstraint('referee_points >= 0', name='ck_referee_points_positive'),
        CheckConstraint('max_uses > 0', name='ck_max_uses_positive'),
        CheckConstraint('current_uses >= 0', name='ck_current_uses_positive'),
    )


class ReferralClick(Base):
    """Track referral link clicks for analytics"""
    __tablename__ = "referral_clicks"

    id = Column(Integer, primary_key=True)
    referral_link_id = Column(Integer, ForeignKey("referral_links.id", ondelete="CASCADE"), nullable=False)

    # Click details
    ip_address = Column(String(45))  # IPv6 support
    user_agent = Column(Text)
    referrer_url = Column(String(500), nullable=True)

    # UTM tracking
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    utm_content = Column(String(100), nullable=True)

    # Conversion tracking
    converted = Column(Boolean, default=False)
    conversion_order_id = Column(String(100), nullable=True)
    conversion_amount = Column(Numeric(12, 2), nullable=True)

    # Metadata
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())
    converted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    referral_link = relationship("ReferralLink", back_populates="clicks_log")

    # Constraints
    __table_args__ = (
        Index('ix_click_referral_date', 'referral_link_id', 'clicked_at'),
        Index('ix_click_conversion', 'converted', 'converted_at'),
        Index('ix_click_ip', 'ip_address'),
    )


class ReferralConversion(Base):
    """Track successful referral conversions"""
    __tablename__ = "referral_conversions"

    id = Column(Integer, primary_key=True)
    referral_link_id = Column(Integer, ForeignKey("referral_links.id", ondelete="CASCADE"), nullable=False)
    referred_customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)

    # Conversion details
    order_id = Column(String(100), nullable=False)  # Shopify order ID
    order_amount = Column(Numeric(12, 2), nullable=False)

    # Rewards given
    referrer_points_awarded = Column(Integer, default=0)
    referee_points_awarded = Column(Integer, default=0)
    referrer_discount_used = Column(Numeric(10, 2), default=Decimal('0.00'))
    referee_discount_used = Column(Numeric(10, 2), default=Decimal('0.00'))

    # Status
    status = Column(String(20), default="completed")  # completed, pending, cancelled

    # Metadata
    converted_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    referral_link = relationship("ReferralLink", back_populates="referrals")
    referred_customer = relationship("CustomerLoyaltyProfile")

    # Constraints
    __table_args__ = (
        Index('ix_conversion_referral', 'referral_link_id', 'converted_at'),
        Index('ix_conversion_customer', 'referred_customer_id'),
        Index('ix_conversion_order', 'order_id'),
        CheckConstraint('order_amount > 0', name='ck_order_amount_positive'),
    )


class LoyaltyAnalytics(Base):
    """Pre-computed analytics for performance"""
    __tablename__ = "loyalty_analytics"

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)

    # Time period
    date = Column(DateTime(timezone=True), nullable=False)
    period_type = Column(String(20), nullable=False)  # daily, weekly, monthly

    # Customer metrics
    total_customers = Column(Integer, default=0)
    active_customers = Column(Integer, default=0)
    new_customers = Column(Integer, default=0)

    # Points metrics
    points_earned = Column(Integer, default=0)
    points_redeemed = Column(Integer, default=0)
    points_expired = Column(Integer, default=0)

    # Revenue metrics
    total_revenue = Column(Numeric(12, 2), default=Decimal('0.00'))
    loyalty_revenue = Column(Numeric(12, 2), default=Decimal('0.00'))  # From loyalty customers

    # Engagement metrics
    redemptions_count = Column(Integer, default=0)
    referrals_count = Column(Integer, default=0)
    campaign_participations = Column(Integer, default=0)

    # Tier metrics
    tier_distributions = Column(JSON, nullable=True)  # {tier_id: count}
    tier_upgrades = Column(Integer, default=0)
    tier_downgrades = Column(Integer, default=0)

    # Metadata
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shop = relationship("Shop")

    # Constraints
    __table_args__ = (
        UniqueConstraint('shop_id', 'date', 'period_type', name='uq_analytics_period'),
        Index('ix_analytics_shop_date', 'shop_id', 'date'),
        Index('ix_analytics_period', 'period_type', 'date'),
    )


class CustomerSegment(Base):
    """Customer segmentation for targeted marketing"""
    __tablename__ = "customer_segments"

    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)

    # Segment details
    name = Column(String(100), nullable=False)
    description = Column(Text)
    segment_type = Column(String(50))  # "behavioral", "demographic", "value"

    # Segment criteria (stored as JSON for flexibility)
    criteria = Column(JSON, nullable=False)

    # Computed metrics
    customer_count = Column(Integer, default=0)
    avg_lifetime_value = Column(Numeric(12, 2), default=Decimal('0.00'))
    avg_points_balance = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)
    auto_update = Column(Boolean, default=True)  # Automatically update membership

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_computed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    shop = relationship("Shop")
    memberships = relationship("CustomerSegmentMembership", back_populates="segment", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        UniqueConstraint('shop_id', 'name', name='uq_segment_name'),
        Index('ix_segment_shop_active', 'shop_id', 'is_active'),
    )


class CustomerSegmentMembership(Base):
    """Track which customers belong to which segments"""
    __tablename__ = "customer_segment_memberships"

    id = Column(Integer, primary_key=True)
    segment_id = Column(Integer, ForeignKey("customer_segments.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customer_loyalty_profiles.id", ondelete="CASCADE"), nullable=False)

    # Membership details
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    removed_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # How they qualified
    qualification_reason = Column(String(200))
    qualification_data = Column(JSON, nullable=True)

    # Relationships
    segment = relationship("CustomerSegment", back_populates="memberships")
    customer = relationship("CustomerLoyaltyProfile")

    # Constraints
    __table_args__ = (
        UniqueConstraint('segment_id', 'customer_id', name='uq_segment_customer'),
        Index('ix_membership_segment', 'segment_id', 'is_active'),
        Index('ix_membership_customer', 'customer_id', 'is_active'),
    )


# Database utility functions
async def get_db():
    """Get database session for FastAPI dependency injection"""
    session: AsyncSession = async_session()
    try:
        yield session
    finally:
        await session.close()


async def init_db() -> None:
    """Initialize database - using Prisma for schema management"""
    print("✅ Database initialization skipped - using Prisma for schema management")
    print("   Run 'npx prisma migrate dev' in the web/ directory to manage database schema")

    # Note: We're using Prisma (from Next.js) for database schema management
    # instead of Alembic. This avoids conflicts between the two migration systems.
    # The database tables are created and managed by Prisma migrations.
