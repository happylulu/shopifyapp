from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import random
from vip_models import (
    VIPTierLevel, VIPTier, VIPMember, VIPBenefit, VIPActivity,
    VIPProgramConfig, VIPAnalytics, BenefitType, QualificationCriteria,
    CreateVIPMemberRequest, UpdateVIPTierRequest,
    VIPMemberResponse, VIPTierResponse, VIPAnalyticsResponse
)

class VIPService:
    """Service for managing VIP tiers and members"""
    
    def __init__(self):
        # In production, this would be database-backed
        self.configs: Dict[str, VIPProgramConfig] = {}
        self.members: Dict[str, List[VIPMember]] = {}
        self.activities: Dict[str, List[VIPActivity]] = {}
        
        # Initialize with default tiers
        self._init_default_tiers()
    
    def _init_default_tiers(self):
        """Initialize default VIP tier configuration"""
        default_benefits = {
            VIPTierLevel.BRONZE: [
                VIPBenefit(
                    id="bronze_points",
                    type=BenefitType.POINTS_MULTIPLIER,
                    name="1.25x Points",
                    description="Earn 25% more points on every purchase",
                    value=1.25,
                    icon="⭐"
                ),
                VIPBenefit(
                    id="bronze_birthday",
                    type=BenefitType.BIRTHDAY_REWARD,
                    name="Birthday Bonus",
                    description="Special birthday discount",
                    value="10%",
                    icon="🎂"
                )
            ],
            VIPTierLevel.SILVER: [
                VIPBenefit(
                    id="silver_points",
                    type=BenefitType.POINTS_MULTIPLIER,
                    name="1.5x Points",
                    description="Earn 50% more points on every purchase",
                    value=1.5,
                    icon="⭐"
                ),
                VIPBenefit(
                    id="silver_shipping",
                    type=BenefitType.FREE_SHIPPING,
                    name="Free Shipping",
                    description="Free shipping on all orders",
                    value=True,
                    icon="📦"
                ),
                VIPBenefit(
                    id="silver_early_access",
                    type=BenefitType.EARLY_ACCESS,
                    name="Early Access",
                    description="Shop new products 24 hours early",
                    value="24h",
                    icon="⏰"
                )
            ],
            VIPTierLevel.GOLD: [
                VIPBenefit(
                    id="gold_points",
                    type=BenefitType.POINTS_MULTIPLIER,
                    name="2x Points",
                    description="Double points on every purchase",
                    value=2.0,
                    icon="⭐"
                ),
                VIPBenefit(
                    id="gold_discount",
                    type=BenefitType.EXCLUSIVE_DISCOUNT,
                    name="15% VIP Discount",
                    description="Exclusive 15% discount on all purchases",
                    value="15%",
                    icon="💰"
                ),
                VIPBenefit(
                    id="gold_support",
                    type=BenefitType.PRIORITY_SUPPORT,
                    name="Priority Support",
                    description="Skip the queue with priority customer support",
                    value=True,
                    icon="🎯"
                ),
                VIPBenefit(
                    id="gold_exclusive",
                    type=BenefitType.EXCLUSIVE_PRODUCTS,
                    name="VIP-Only Products",
                    description="Access to exclusive VIP-only products",
                    value=True,
                    icon="👑"
                )
            ],
            VIPTierLevel.PLATINUM: [
                VIPBenefit(
                    id="platinum_points",
                    type=BenefitType.POINTS_MULTIPLIER,
                    name="3x Points",
                    description="Triple points on every purchase",
                    value=3.0,
                    icon="💎"
                ),
                VIPBenefit(
                    id="platinum_discount",
                    type=BenefitType.EXCLUSIVE_DISCOUNT,
                    name="20% VIP Discount",
                    description="Exclusive 20% discount on all purchases",
                    value="20%",
                    icon="💰"
                ),
                VIPBenefit(
                    id="platinum_concierge",
                    type=BenefitType.CUSTOM_BENEFIT,
                    name="Personal Shopper",
                    description="Dedicated personal shopping assistant",
                    value="concierge",
                    icon="🤵"
                ),
                VIPBenefit(
                    id="platinum_events",
                    type=BenefitType.CUSTOM_BENEFIT,
                    name="VIP Events",
                    description="Invitations to exclusive VIP events",
                    value="events",
                    icon="🎉"
                )
            ]
        }
        
        self.default_tiers = [
            VIPTier(
                id="tier_bronze",
                level=VIPTierLevel.BRONZE,
                name="Bronze Member",
                description="Welcome to our VIP family! Enjoy exclusive perks and rewards.",
                color="#CD7F32",
                icon="🥉",
                qualification_criteria=QualificationCriteria.TOTAL_SPENT,
                min_spent=500.0,
                qualification_period_days=365,
                benefits=default_benefits[VIPTierLevel.BRONZE],
                points_multiplier=1.25,
                retention_period_days=365,
                grace_period_days=30,
                welcome_message="Welcome to Bronze! You're now part of our VIP family 🎉"
            ),
            VIPTier(
                id="tier_silver",
                level=VIPTierLevel.SILVER,
                name="Silver Member",
                description="You're a valued customer! Unlock better rewards and exclusive benefits.",
                color="#C0C0C0",
                icon="🥈",
                qualification_criteria=QualificationCriteria.TOTAL_SPENT,
                min_spent=1500.0,
                qualification_period_days=365,
                benefits=default_benefits[VIPTierLevel.SILVER],
                points_multiplier=1.5,
                retention_period_days=365,
                grace_period_days=30,
                welcome_message="Congratulations on reaching Silver! Enjoy your enhanced benefits ✨"
            ),
            VIPTier(
                id="tier_gold",
                level=VIPTierLevel.GOLD,
                name="Gold Member",
                description="You're among our top customers! Experience premium benefits and rewards.",
                color="#FFD700",
                icon="🥇",
                qualification_criteria=QualificationCriteria.TOTAL_SPENT,
                min_spent=3000.0,
                qualification_period_days=365,
                benefits=default_benefits[VIPTierLevel.GOLD],
                points_multiplier=2.0,
                retention_period_days=365,
                grace_period_days=60,
                welcome_message="Welcome to Gold status! You're now enjoying our premium experience 👑"
            ),
            VIPTier(
                id="tier_platinum",
                level=VIPTierLevel.PLATINUM,
                name="Platinum Member",
                description="Our most exclusive tier! Enjoy unparalleled benefits and personalized service.",
                color="#E5E4E2",
                icon="💎",
                qualification_criteria=QualificationCriteria.TOTAL_SPENT,
                min_spent=5000.0,
                qualification_period_days=365,
                benefits=default_benefits[VIPTierLevel.PLATINUM],
                points_multiplier=3.0,
                retention_period_days=365,
                grace_period_days=90,
                welcome_message="Welcome to Platinum! You've achieved our highest honor 💎"
            )
        ]
    
    def get_program_config(self, shop_domain: str) -> VIPProgramConfig:
        """Get VIP program configuration for a shop"""
        if shop_domain not in self.configs:
            # Create default config
            self.configs[shop_domain] = VIPProgramConfig(
                shop_domain=shop_domain,
                program_name="VIP Rewards Program",
                is_active=True,
                tiers=self.default_tiers,
                auto_upgrade=True,
                auto_downgrade=True,
                send_tier_notifications=True,
                send_benefit_reminders=True,
                show_progress_bar=True,
                show_benefits_page=True
            )
        return self.configs[shop_domain]
    
    def update_program_config(self, shop_domain: str, updates: Dict[str, Any]) -> VIPProgramConfig:
        """Update VIP program configuration"""
        config = self.get_program_config(shop_domain)
        
        for key, value in updates.items():
            if hasattr(config, key):
                setattr(config, key, value)
        
        config.updated_at = datetime.utcnow()
        return config
    
    def get_tiers(self, shop_domain: str) -> List[VIPTier]:
        """Get all VIP tiers for a shop"""
        config = self.get_program_config(shop_domain)
        return config.tiers
    
    def get_tier(self, shop_domain: str, tier_level: VIPTierLevel) -> Optional[VIPTier]:
        """Get a specific VIP tier"""
        tiers = self.get_tiers(shop_domain)
        for tier in tiers:
            if tier.level == tier_level:
                return tier
        return None
    
    def update_tier(self, shop_domain: str, tier_level: VIPTierLevel, updates: UpdateVIPTierRequest) -> VIPTierResponse:
        """Update a VIP tier configuration"""
        try:
            config = self.get_program_config(shop_domain)
            
            for i, tier in enumerate(config.tiers):
                if tier.level == tier_level:
                    # Update tier fields
                    update_dict = updates.dict(exclude_unset=True)
                    for key, value in update_dict.items():
                        if hasattr(tier, key) and value is not None:
                            setattr(tier, key, value)
                    
                    tier.updated_at = datetime.utcnow()
                    config.tiers[i] = tier
                    config.updated_at = datetime.utcnow()
                    
                    return VIPTierResponse(success=True, tier=tier)
            
            return VIPTierResponse(success=False, error="Tier not found")
            
        except Exception as e:
            return VIPTierResponse(success=False, error=str(e))
    
    def create_member(self, shop_domain: str, request: CreateVIPMemberRequest) -> VIPMemberResponse:
        """Create a new VIP member"""
        try:
            tier = self.get_tier(shop_domain, request.tier_level)
            if not tier:
                return VIPMemberResponse(success=False, error="Invalid tier level")
            
            member = VIPMember(
                id=f"vip_{uuid.uuid4().hex[:8]}",
                customer_id=request.customer_id,
                customer_name=request.customer_name,
                customer_email=request.customer_email,
                current_tier=request.tier_level,
                tier_started_at=datetime.utcnow(),
                tier_expires_at=datetime.utcnow() + timedelta(days=tier.retention_period_days) if tier.retention_period_days > 0 else None,
                notes=request.notes
            )
            
            # Initialize member list for shop if needed
            if shop_domain not in self.members:
                self.members[shop_domain] = []
            
            self.members[shop_domain].append(member)
            
            # Track activity
            self._track_activity(
                shop_domain,
                member.id,
                "tier_assigned",
                f"Assigned to {tier.name}",
                metadata={"manual": request.manual_assignment}
            )
            
            return VIPMemberResponse(success=True, member=member)
            
        except Exception as e:
            return VIPMemberResponse(success=False, error=str(e))
    
    def get_members(self, shop_domain: str, tier_filter: Optional[VIPTierLevel] = None) -> List[VIPMember]:
        """Get VIP members for a shop"""
        if shop_domain not in self.members:
            # Generate mock members for demo
            self._generate_mock_members(shop_domain)
        
        members = self.members.get(shop_domain, [])
        
        if tier_filter:
            members = [m for m in members if m.current_tier == tier_filter]
        
        return members
    
    def get_member(self, shop_domain: str, customer_id: str) -> Optional[VIPMember]:
        """Get a specific VIP member by customer ID"""
        members = self.get_members(shop_domain)
        for member in members:
            if member.customer_id == customer_id:
                return member
        return None
    
    def update_member_progress(self, shop_domain: str, customer_id: str, 
                             amount_spent: float = 0, points_earned: int = 0, 
                             order_placed: bool = False) -> VIPMemberResponse:
        """Update member progress and check for tier changes"""
        try:
            member = self.get_member(shop_domain, customer_id)
            if not member:
                return VIPMemberResponse(success=False, error="Member not found")
            
            # Update totals
            member.total_spent += amount_spent
            member.total_points += points_earned
            if order_placed:
                member.total_orders += 1
            
            # Update period totals
            member.spent_this_period += amount_spent
            member.points_this_period += points_earned
            if order_placed:
                member.orders_this_period += 1
            
            member.last_activity_at = datetime.utcnow()
            
            # Check for tier upgrade
            config = self.get_program_config(shop_domain)
            if config.auto_upgrade:
                self._check_tier_upgrade(shop_domain, member)
            
            # Update progress to next tier
            self._update_tier_progress(shop_domain, member)
            
            return VIPMemberResponse(success=True, member=member)
            
        except Exception as e:
            return VIPMemberResponse(success=False, error=str(e))
    
    def get_analytics(self, shop_domain: str) -> VIPAnalyticsResponse:
        """Get VIP program analytics"""
        try:
            members = self.get_members(shop_domain)
            config = self.get_program_config(shop_domain)
            
            # Calculate analytics
            analytics = VIPAnalytics()
            analytics.total_vip_members = len(members)
            
            # Members by tier
            for tier_level in VIPTierLevel:
                count = len([m for m in members if m.current_tier == tier_level])
                analytics.members_by_tier[tier_level] = count
            
            # Revenue metrics
            analytics.total_vip_revenue = sum(m.lifetime_value for m in members)
            if members:
                analytics.avg_vip_order_value = analytics.total_vip_revenue / sum(m.total_orders for m in members if m.total_orders > 0)
            
            # Retention rate (mock)
            analytics.vip_retention_rate = 0.78
            analytics.benefits_redemption_rate = 0.65
            analytics.tier_progression_rate = 0.23
            
            # Recent metrics
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            analytics.new_vip_members_30d = len([m for m in members if m.joined_vip_at >= thirty_days_ago])
            analytics.vip_revenue_30d = sum(m.spent_this_period for m in members)
            
            # Top performers
            top_members = sorted(members, key=lambda m: m.lifetime_value, reverse=True)[:5]
            analytics.top_vip_members = [
                {
                    "id": m.id,
                    "name": m.customer_name,
                    "tier": m.current_tier,
                    "lifetime_value": m.lifetime_value,
                    "orders": m.total_orders
                }
                for m in top_members
            ]
            
            # Most used benefits (mock)
            analytics.most_used_benefits = [
                {"benefit": "Points Multiplier", "usage_count": 1234, "tier": "all"},
                {"benefit": "Free Shipping", "usage_count": 567, "tier": "silver"},
                {"benefit": "VIP Discount", "usage_count": 234, "tier": "gold"}
            ]
            
            return VIPAnalyticsResponse(success=True, analytics=analytics)
            
        except Exception as e:
            return VIPAnalyticsResponse(success=False, error=str(e))
    
    def _check_tier_upgrade(self, shop_domain: str, member: VIPMember):
        """Check if member qualifies for tier upgrade"""
        tiers = self.get_tiers(shop_domain)
        current_tier_index = [t.level for t in tiers].index(member.current_tier)
        
        # Check next tier
        if current_tier_index < len(tiers) - 1:
            next_tier = tiers[current_tier_index + 1]
            
            # Check qualification based on criteria
            qualifies = False
            if next_tier.qualification_criteria == QualificationCriteria.TOTAL_SPENT:
                qualifies = member.spent_this_period >= (next_tier.min_spent or 0)
            elif next_tier.qualification_criteria == QualificationCriteria.POINTS_EARNED:
                qualifies = member.points_this_period >= (next_tier.min_points or 0)
            elif next_tier.qualification_criteria == QualificationCriteria.ORDERS_COUNT:
                qualifies = member.orders_this_period >= (next_tier.min_orders or 0)
            
            if qualifies:
                # Upgrade tier
                member.current_tier = next_tier.level
                member.tier_started_at = datetime.utcnow()
                member.tier_expires_at = datetime.utcnow() + timedelta(days=next_tier.retention_period_days) if next_tier.retention_period_days > 0 else None
                
                # Track activity
                self._track_activity(
                    shop_domain,
                    member.id,
                    "tier_upgrade",
                    f"Upgraded to {next_tier.name}",
                    metadata={"from_tier": tiers[current_tier_index].level, "to_tier": next_tier.level}
                )
    
    def _update_tier_progress(self, shop_domain: str, member: VIPMember):
        """Update member's progress to next tier"""
        tiers = self.get_tiers(shop_domain)
        current_tier_index = [t.level for t in tiers].index(member.current_tier)
        
        if current_tier_index < len(tiers) - 1:
            next_tier = tiers[current_tier_index + 1]
            member.next_tier = next_tier.level
            
            # Calculate progress based on criteria
            if next_tier.qualification_criteria == QualificationCriteria.TOTAL_SPENT and next_tier.min_spent:
                progress = (member.spent_this_period / next_tier.min_spent) * 100
                member.amount_to_next_tier = max(0, next_tier.min_spent - member.spent_this_period)
            elif next_tier.qualification_criteria == QualificationCriteria.POINTS_EARNED and next_tier.min_points:
                progress = (member.points_this_period / next_tier.min_points) * 100
                member.amount_to_next_tier = max(0, next_tier.min_points - member.points_this_period)
            else:
                progress = 0
                member.amount_to_next_tier = None
            
            member.progress_to_next_tier = min(100, progress)
        else:
            member.next_tier = None
            member.progress_to_next_tier = 100
            member.amount_to_next_tier = None
    
    def _track_activity(self, shop_domain: str, member_id: str, activity_type: str, 
                       description: str, metadata: Dict[str, Any] = None):
        """Track VIP member activity"""
        if shop_domain not in self.activities:
            self.activities[shop_domain] = []
        
        activity = VIPActivity(
            id=f"act_{uuid.uuid4().hex[:8]}",
            member_id=member_id,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {}
        )
        
        self.activities[shop_domain].append(activity)
    
    def _generate_mock_members(self, shop_domain: str):
        """Generate mock VIP members for demo"""
        mock_names = [
            ("Sarah Chen", "sarah@example.com", VIPTierLevel.GOLD, 3842.50, 38425, 23),
            ("Michael Johnson", "michael@example.com", VIPTierLevel.PLATINUM, 7234.00, 72340, 45),
            ("Emma Davis", "emma@example.com", VIPTierLevel.SILVER, 1678.90, 16789, 12),
            ("James Wilson", "james@example.com", VIPTierLevel.BRONZE, 892.30, 8923, 7),
            ("Olivia Brown", "olivia@example.com", VIPTierLevel.GOLD, 4123.60, 41236, 28),
            ("William Taylor", "william@example.com", VIPTierLevel.SILVER, 1890.40, 18904, 15),
            ("Sophia Martinez", "sophia@example.com", VIPTierLevel.BRONZE, 645.80, 6458, 5),
            ("Alexander Lee", "alex@example.com", VIPTierLevel.PLATINUM, 8901.20, 89012, 52),
        ]
        
        self.members[shop_domain] = []
        
        for name, email, tier, spent, points, orders in mock_names:
            member = VIPMember(
                id=f"vip_{uuid.uuid4().hex[:8]}",
                customer_id=f"cust_{uuid.uuid4().hex[:8]}",
                customer_name=name,
                customer_email=email,
                current_tier=tier,
                tier_started_at=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                total_spent=spent,
                total_points=points,
                total_orders=orders,
                spent_this_period=spent * 0.3,
                points_this_period=int(points * 0.3),
                orders_this_period=max(1, orders // 4),
                lifetime_value=spent * 1.2,
                joined_vip_at=datetime.utcnow() - timedelta(days=random.randint(90, 730))
            )
            
            # Update progress
            self._update_tier_progress(shop_domain, member)
            
            self.members[shop_domain].append(member) 