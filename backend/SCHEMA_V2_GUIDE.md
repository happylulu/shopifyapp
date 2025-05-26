# Enhanced Loyalty Program Schema v2.0

## Overview

The v2 schema represents a complete redesign of the loyalty program database to support enterprise-level features, comprehensive analytics, and flexible business rules. This schema replaces the simple v1 models with a robust, scalable architecture.

## 🎯 Key Improvements

### From v1 to v2:
- **Simple points tracking** → **Complete transaction history with audit trail**
- **Basic customer records** → **Comprehensive loyalty profiles with engagement metrics**
- **No tier system** → **Flexible tier management with progression tracking**
- **No rewards system** → **Full reward catalog with redemption management**
- **Basic referrals** → **Advanced referral system with detailed analytics**
- **No campaigns** → **Campaign management with participation tracking**
- **No analytics** → **Pre-computed analytics and customer segmentation**

## 📊 Schema Architecture

### Core Entities

#### 1. **Shop** (Enhanced)
Multi-tenant shop management with loyalty program configuration.

**Key Features:**
- Loyalty program settings (points per dollar, welcome points, etc.)
- Point expiration rules
- Branding customization
- Notification preferences

**New Columns:**
```sql
loyalty_enabled BOOLEAN DEFAULT TRUE
points_per_dollar NUMERIC(10,2) DEFAULT 1.00
welcome_points INTEGER DEFAULT 100
referral_points_referrer INTEGER DEFAULT 500
referral_points_referee INTEGER DEFAULT 250
points_expire_enabled BOOLEAN DEFAULT FALSE
points_expire_days INTEGER DEFAULT 365
brand_color VARCHAR(7) DEFAULT '#8B5CF6'
loyalty_program_name VARCHAR(100) DEFAULT 'Loyalty Program'
email_notifications_enabled BOOLEAN DEFAULT TRUE
sms_notifications_enabled BOOLEAN DEFAULT FALSE
```

#### 2. **CustomerLoyaltyProfile** (Replaces Customer)
Comprehensive customer loyalty data with engagement tracking.

**Key Features:**
- Points balance with lifetime metrics
- Current tier assignment
- Engagement tracking (last purchase, login, etc.)
- Preference management
- VIP status tracking

**Schema:**
```sql
shopify_customer_id VARCHAR(50) NOT NULL
email VARCHAR(255)
first_name VARCHAR(100)
last_name VARCHAR(100)
phone VARCHAR(20)
points_balance INTEGER DEFAULT 0
lifetime_points_earned INTEGER DEFAULT 0
lifetime_points_redeemed INTEGER DEFAULT 0
lifetime_spent NUMERIC(12,2) DEFAULT 0.00
lifetime_orders INTEGER DEFAULT 0
current_tier_id INTEGER REFERENCES tier_definitions(id)
tier_achieved_at TIMESTAMP WITH TIME ZONE
tier_expires_at TIMESTAMP WITH TIME ZONE
last_purchase_at TIMESTAMP WITH TIME ZONE
last_login_at TIMESTAMP WITH TIME ZONE
last_points_earned_at TIMESTAMP WITH TIME ZONE
email_opt_in BOOLEAN DEFAULT TRUE
sms_opt_in BOOLEAN DEFAULT FALSE
birthday TIMESTAMP WITH TIME ZONE
is_active BOOLEAN DEFAULT TRUE
is_vip BOOLEAN DEFAULT FALSE
```

#### 3. **PointTransaction** (Replaces LoyaltyPoint)
Complete points transaction history with full audit trail.

**Key Features:**
- Transaction types (earned, redeemed, expired, adjusted, bonus, refunded)
- Source tracking (purchase, referral, signup, review, etc.)
- Balance tracking after each transaction
- Expiration management
- Campaign attribution

**Schema:**
```sql
customer_id INTEGER REFERENCES customer_loyalty_profiles(id)
transaction_type VARCHAR(20) NOT NULL -- PointTransactionType enum
points_amount INTEGER NOT NULL -- Can be negative
points_balance_after INTEGER NOT NULL
source VARCHAR(20) NOT NULL -- PointEarnSource enum
source_id VARCHAR(100) -- Order ID, campaign ID, etc.
description TEXT
order_id VARCHAR(100) -- Shopify order ID
campaign_id INTEGER REFERENCES campaigns(id)
redemption_id INTEGER REFERENCES redemption_logs(id)
expires_at TIMESTAMP WITH TIME ZONE
expired_at TIMESTAMP WITH TIME ZONE
created_by VARCHAR(50) DEFAULT 'system'
```

### Tier Management System

#### 4. **TierDefinition**
Define loyalty tiers with qualification criteria and benefits.

**Key Features:**
- Flexible qualification criteria (points, spend, orders)
- Tier benefits (multipliers, discounts, perks)
- Tier maintenance requirements
- Visual customization (colors, icons)

#### 5. **CustomerTierHistory**
Track customer tier changes over time.

**Key Features:**
- Complete tier progression history
- Qualification metrics at achievement
- Expiration tracking
- Reason tracking (qualification, manual, downgrade)

### Reward System

#### 6. **RewardDefinition**
Catalog of available rewards with flexible configuration.

**Key Features:**
- Multiple reward types (discounts, free shipping, products, store credit)
- Flexible reward value storage (JSON)
- Redemption limits (per customer, total)
- Tier restrictions
- Scheduling (valid from/until dates)

#### 7. **RedemptionLog**
Track reward redemptions with complete audit trail.

**Key Features:**
- Redemption status tracking
- Generated discount codes
- Usage tracking
- Failure reason logging
- Expiration management

### Campaign Management

#### 8. **Campaign**
Marketing campaigns and special events.

**Key Features:**
- Campaign types (points bonus, tier promotion, referral boost)
- Flexible targeting (all customers, specific tiers, customer lists)
- Budget and participation limits
- Campaign rules (JSON storage for flexibility)

#### 9. **CampaignParticipation**
Track customer participation in campaigns.

### Enhanced Referral System

#### 10. **ReferralLink** (Enhanced)
Advanced referral system with detailed tracking.

**Key Features:**
- Configurable rewards for both referrer and referee
- Usage limits and expiration
- Performance tracking
- Revenue attribution

#### 11. **ReferralClick**
Track referral link clicks for analytics.

**Key Features:**
- UTM parameter tracking
- Conversion tracking
- IP and user agent logging

#### 12. **ReferralConversion**
Track successful referral conversions.

**Key Features:**
- Order attribution
- Reward distribution tracking
- Status management

### Analytics & Segmentation

#### 13. **LoyaltyAnalytics**
Pre-computed analytics for performance.

**Key Features:**
- Time-based metrics (daily, weekly, monthly)
- Customer, points, revenue, and engagement metrics
- Tier distribution tracking

#### 14. **CustomerSegment**
Customer segmentation for targeted marketing.

**Key Features:**
- Flexible criteria (JSON storage)
- Automatic membership updates
- Segment performance metrics

#### 15. **CustomerSegmentMembership**
Track segment membership over time.

## 🔄 Migration Strategy

### Phase 1: Schema Creation
1. Create v2 schema alongside v1
2. Validate schema integrity
3. Create default tiers for existing shops

### Phase 2: Data Migration
1. Migrate shops with enhanced settings
2. Convert customers to loyalty profiles
3. Transform point records to transaction history
4. Upgrade referral links
5. Create tier assignments

### Phase 3: Validation & Cutover
1. Validate data integrity
2. Update application code
3. Switch to v2 models
4. Archive v1 tables

## 📈 Performance Optimizations

### Indexes
- **Customer lookups**: `(shop_id, shopify_customer_id)`, `(shop_id, email)`
- **Points queries**: `(customer_id, created_at)`, `(transaction_type, source)`
- **Tier queries**: `(customer_id, is_current)`, `(tier_level)`
- **Redemption tracking**: `(customer_id, redeemed_at)`, `(status)`
- **Analytics**: `(shop_id, date)`, `(period_type, date)`

### Constraints
- **Data integrity**: Foreign key constraints with CASCADE deletes
- **Business rules**: Check constraints for positive values
- **Uniqueness**: Unique constraints for referral codes, shop domains

## 🛡️ Data Integrity

### Audit Trail
- All transactions tracked with timestamps
- Change reasons recorded
- Created by tracking (system, admin, customer)

### Soft Deletes
- Archive flags instead of hard deletes
- Maintains referential integrity
- Enables data recovery

### Validation
- Check constraints for business rules
- Enum types for consistent values
- NOT NULL constraints for required fields

## 🚀 Business Benefits

### For Merchants
- **Comprehensive Analytics**: Deep insights into customer behavior
- **Flexible Campaigns**: Targeted marketing with detailed tracking
- **Tier Management**: Automated tier progression with custom benefits
- **Revenue Attribution**: Track loyalty program ROI

### For Customers
- **Transparent History**: Complete points transaction history
- **Tier Benefits**: Clear progression path with rewards
- **Personalized Experience**: Targeted offers based on behavior
- **Multiple Earning Sources**: Points from purchases, referrals, campaigns

### For Developers
- **Scalable Architecture**: Handles millions of customers and transactions
- **Flexible Schema**: JSON fields for custom business rules
- **Performance Optimized**: Proper indexing for fast queries
- **Migration Safe**: Comprehensive migration tools and validation

## Table Relationships Overview

The diagram below summarizes the primary relationships between the new tables:

- **Shop ↔ CustomerLoyaltyProfile** – one-to-many. Deleting a `Shop` cascades
  to its customers.
- **CustomerLoyaltyProfile ↔ PointTransaction** – one-to-many. Points history is
  tied to each customer.
- **CustomerLoyaltyProfile ↔ TierDefinition** – many-to-one via
  `current_tier_id` with back-populated `customers` on the tier model.
- **CustomerLoyaltyProfile ↔ CampaignParticipation** – one-to-many for tracking
  campaign engagement.
- **CustomerLoyaltyProfile ↔ ReferralLink** – one-to-many, allowing multiple
  referral codes per customer.
- **RewardDefinition ↔ RedemptionLog** – one-to-many. Reward redemptions are
  recorded in `RedemptionLog`.
- **TierDefinition ↔ CustomerTierHistory** – one-to-many to maintain a history
  of tier changes.

These relationships enable powerful queries while maintaining data integrity
through cascading deletes and constraints.
