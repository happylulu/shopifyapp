"""
Rule Engine Database Models
Defines the schema for flexible rule-based loyalty program automation
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from models_v2 import Base
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum


class RuleStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class EventType(str, Enum):
    ORDER_CREATED = "order_created"
    ORDER_PAID = "order_paid"
    ORDER_FULFILLED = "order_fulfilled"
    CUSTOMER_CREATED = "customer_created"
    REFERRAL_SIGNUP = "referral_signup"
    REFERRAL_CONVERSION = "referral_conversion"
    MANUAL_ADJUSTMENT = "manual_adjustment"
    TIER_CHANGE = "tier_change"
    BIRTHDAY = "birthday"
    ANNIVERSARY = "anniversary"
    PRODUCT_REVIEW = "product_review"
    SOCIAL_SHARE = "social_share"


class ActionType(str, Enum):
    AWARD_POINTS = "award_points"
    DEDUCT_POINTS = "deduct_points"
    SET_TIER = "set_tier"
    AWARD_BADGE = "award_badge"
    TRIGGER_WEBHOOK = "trigger_webhook"
    SEND_EMAIL = "send_email"
    CREATE_DISCOUNT = "create_discount"
    ADD_TAG = "add_tag"
    REMOVE_TAG = "remove_tag"


class Rule(Base):
    """
    Main rules table with JSONB conditions and actions
    """
    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_domain = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Rule configuration
    event_type = Column(String(50), nullable=False, index=True)  # EventType enum
    status = Column(String(20), default=RuleStatus.DRAFT, index=True)
    priority = Column(Integer, default=100)  # Lower number = higher priority
    
    # JSONB fields for flexible rule definition
    conditions = Column(JSONB, nullable=False)  # Conditions to evaluate
    actions = Column(JSONB, nullable=False)     # Actions to execute
    
    # Metadata
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255))  # User who created the rule
    
    # Execution tracking
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True))
    
    # Relationships
    executions = relationship("RuleExecution", back_populates="rule", cascade="all, delete-orphan")
    versions = relationship("RuleVersion", back_populates="rule", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_rules_shop_event_status', 'shop_domain', 'event_type', 'status'),
        Index('idx_rules_priority', 'priority'),
    )


class RuleVersion(Base):
    """
    Rule version history for audit trail and rollback capability
    """
    __tablename__ = "rule_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey('rules.id'), nullable=False)
    version_number = Column(Integer, nullable=False)
    
    # Snapshot of rule at this version
    name = Column(String(255), nullable=False)
    description = Column(Text)
    event_type = Column(String(50), nullable=False)
    conditions = Column(JSONB, nullable=False)
    actions = Column(JSONB, nullable=False)
    
    # Version metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(255))
    change_notes = Column(Text)
    
    # Relationships
    rule = relationship("Rule", back_populates="versions")

    __table_args__ = (
        Index('idx_rule_versions_rule_version', 'rule_id', 'version_number'),
    )


class RuleExecution(Base):
    """
    Log of rule executions for debugging and analytics
    """
    __tablename__ = "rule_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey('rules.id'), nullable=False)
    shop_domain = Column(String(255), nullable=False, index=True)
    
    # Execution context
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSONB, nullable=False)  # The event that triggered this rule
    customer_id = Column(String(255), index=True)  # Shopify customer ID
    
    # Execution results
    conditions_met = Column(Boolean, nullable=False)
    actions_executed = Column(JSONB)  # List of actions that were executed
    execution_time_ms = Column(Integer)  # How long the rule took to execute
    
    # Error handling
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    error_details = Column(JSONB)
    
    # Timestamps
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    rule = relationship("Rule", back_populates="executions")

    __table_args__ = (
        Index('idx_rule_executions_shop_customer', 'shop_domain', 'customer_id'),
        Index('idx_rule_executions_executed_at', 'executed_at'),
    )


class EventQueue(Base):
    """
    Queue for processing events asynchronously
    """
    __tablename__ = "event_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_domain = Column(String(255), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False, index=True)
    event_data = Column(JSONB, nullable=False)
    customer_id = Column(String(255), index=True)
    
    # Processing status
    status = Column(String(20), default="pending", index=True)  # pending, processing, completed, failed
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scheduled_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
    
    # Error handling
    error_message = Column(Text)
    error_details = Column(JSONB)

    __table_args__ = (
        Index('idx_event_queue_status_scheduled', 'status', 'scheduled_at'),
        Index('idx_event_queue_shop_event', 'shop_domain', 'event_type'),
    )
