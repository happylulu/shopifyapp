from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import random
import uuid
from event_models import (
    VIPEvent, EventStatus, EventType, TargetType,
    EventTarget, EventReward, CreateEventRequest,
    UpdateEventRequest, EventParticipant, EventAnalytics,
    EventListResponse, EventCalendarItem
)
from vip_models import VIPTierLevel
from ai_models import CustomerSegment

class EventService:
    def __init__(self):
        self.events: Dict[str, VIPEvent] = {}
        self.participants: Dict[str, List[EventParticipant]] = {}
        self._initialize_mock_events()
    
    def _initialize_mock_events(self):
        """Initialize with sample events"""
        # Active event - Summer VIP Boost
        summer_event = VIPEvent(
            id="evt_001",
            name="Summer VIP Boost",
            description="Double points for high-value Gold and Platinum members",
            event_type=EventType.POINTS_MULTIPLIER,
            status=EventStatus.ACTIVE,
            targets=[
                EventTarget(
                    type=TargetType.VIP_TIER,
                    values=[VIPTierLevel.GOLD, VIPTierLevel.PLATINUM],
                    estimated_reach=45
                ),
                EventTarget(
                    type=TargetType.AI_SEGMENT,
                    values=["High Value Customers"],
                    estimated_reach=30
                )
            ],
            rewards=[
                EventReward(
                    type="points_multiplier",
                    value=2.0,
                    description="2x Points on all purchases"
                )
            ],
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now() + timedelta(days=23),
            total_participants=28,
            total_rewards_claimed=156,
            total_revenue_generated=45680.50,
            icon="🔥",
            color="#FF6B6B"
        )
        
        # Scheduled event - Diamond Member Appreciation
        diamond_event = VIPEvent(
            id="evt_002",
            name="Diamond Member Appreciation",
            description="Exclusive rewards for Diamond tier and frequent buyers",
            event_type=EventType.VIP_APPRECIATION,
            status=EventStatus.SCHEDULED,
            targets=[
                EventTarget(
                    type=TargetType.VIP_TIER,
                    values=["Diamond"],
                    estimated_reach=12
                ),
                EventTarget(
                    type=TargetType.AI_SEGMENT,
                    values=["Frequent Buyers"],
                    estimated_reach=25
                )
            ],
            rewards=[
                EventReward(
                    type="bonus_points",
                    value=1000,
                    description="+1000 Bonus Points",
                    max_uses_per_customer=1
                ),
                EventReward(
                    type="exclusive_discount",
                    value=25,
                    description="25% off exclusive items"
                )
            ],
            start_date=datetime.now() + timedelta(days=7),
            end_date=datetime.now() + timedelta(days=14),
            icon="💎",
            color="#7C3AED"
        )
        
        # Draft event - At-Risk Customer Recovery
        recovery_event = VIPEvent(
            id="evt_003",
            name="At-Risk Customer Recovery",
            description="Triple points to re-engage at-risk Silver and Gold members",
            event_type=EventType.RECOVERY_CAMPAIGN,
            status=EventStatus.DRAFT,
            targets=[
                EventTarget(
                    type=TargetType.VIP_TIER,
                    values=[VIPTierLevel.SILVER, VIPTierLevel.GOLD],
                    estimated_reach=67
                ),
                EventTarget(
                    type=TargetType.AI_SEGMENT,
                    values=["At-Risk Customers"],
                    estimated_reach=45
                )
            ],
            rewards=[
                EventReward(
                    type="points_multiplier",
                    value=3.0,
                    description="3x Points for 30 days"
                ),
                EventReward(
                    type="bonus_points",
                    value=500,
                    description="500 Welcome Back Points",
                    max_uses_per_customer=1
                )
            ],
            start_date=datetime.now() + timedelta(days=30),
            end_date=datetime.now() + timedelta(days=60),
            icon="🔥",
            color="#F59E0B"
        )
        
        self.events = {
            summer_event.id: summer_event,
            diamond_event.id: diamond_event,
            recovery_event.id: recovery_event
        }
        
        # Add some participants to active event
        self._add_mock_participants(summer_event.id, 28)
    
    def _add_mock_participants(self, event_id: str, count: int):
        """Add mock participants to an event"""
        participants = []
        for i in range(count):
            participant = EventParticipant(
                event_id=event_id,
                customer_id=f"cust_{i+100}",
                customer_name=f"Customer {i+100}",
                customer_email=f"customer{i+100}@example.com",
                enrolled_at=datetime.now() - timedelta(days=random.randint(1, 7)),
                rewards_claimed=[
                    {
                        "type": "points_multiplier",
                        "value": 2.0,
                        "claimed_at": datetime.now() - timedelta(days=random.randint(0, 6))
                    }
                ],
                total_value_claimed=random.uniform(50, 500),
                last_activity=datetime.now() - timedelta(hours=random.randint(1, 48))
            )
            participants.append(participant)
        
        self.participants[event_id] = participants
    
    def create_event(self, request: CreateEventRequest) -> VIPEvent:
        """Create a new event"""
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        
        # Calculate estimated reach
        for target in request.targets:
            if target.type == TargetType.VIP_TIER:
                # Mock calculation based on tier
                tier_reach = {
                    VIPTierLevel.BRONZE: 150,
                    VIPTierLevel.SILVER: 80,
                    VIPTierLevel.GOLD: 45,
                    VIPTierLevel.PLATINUM: 20,
                    "Diamond": 12
                }
                target.estimated_reach = sum(tier_reach.get(tier, 10) for tier in target.values)
            elif target.type == TargetType.AI_SEGMENT:
                # Mock calculation based on segment
                segment_reach = {
                    "High Value Customers": 30,
                    "Frequent Buyers": 25,
                    "At-Risk Customers": 45,
                    "New Customer Onboarding": 60,
                    "Champions": 15,
                    "Loyal Customers": 40
                }
                target.estimated_reach = sum(segment_reach.get(seg, 20) for seg in target.values)
        
        event = VIPEvent(
            id=event_id,
            name=request.name,
            description=request.description,
            event_type=request.event_type,
            status=EventStatus.DRAFT,
            targets=request.targets,
            rewards=request.rewards,
            start_date=request.start_date,
            end_date=request.end_date,
            auto_enroll=request.auto_enroll,
            send_notifications=request.send_notifications,
            require_opt_in=request.require_opt_in,
            max_participants=request.max_participants,
            budget_limit=request.budget_limit,
            icon=request.icon
        )
        
        self.events[event_id] = event
        return event
    
    def update_event(self, event_id: str, request: UpdateEventRequest) -> Optional[VIPEvent]:
        """Update an existing event"""
        if event_id not in self.events:
            return None
        
        event = self.events[event_id]
        
        # Update fields if provided
        if request.name is not None:
            event.name = request.name
        if request.description is not None:
            event.description = request.description
        if request.targets is not None:
            event.targets = request.targets
        if request.rewards is not None:
            event.rewards = request.rewards
        if request.start_date is not None:
            event.start_date = request.start_date
        if request.end_date is not None:
            event.end_date = request.end_date
        if request.status is not None:
            event.status = request.status
            # Update status automatically based on dates
            self._update_event_status(event)
        if request.auto_enroll is not None:
            event.auto_enroll = request.auto_enroll
        if request.send_notifications is not None:
            event.send_notifications = request.send_notifications
        
        event.updated_at = datetime.now()
        return event
    
    def _update_event_status(self, event: VIPEvent):
        """Update event status based on dates"""
        now = datetime.now()
        
        if event.status != EventStatus.CANCELLED:
            if now < event.start_date:
                if event.status == EventStatus.DRAFT:
                    pass  # Keep as draft
                else:
                    event.status = EventStatus.SCHEDULED
            elif event.start_date <= now <= event.end_date:
                event.status = EventStatus.ACTIVE
            else:
                event.status = EventStatus.COMPLETED
    
    def get_event(self, event_id: str) -> Optional[VIPEvent]:
        """Get a single event"""
        event = self.events.get(event_id)
        if event:
            self._update_event_status(event)
        return event
    
    def list_events(self, status: Optional[EventStatus] = None) -> EventListResponse:
        """List all events with optional status filter"""
        # Update all event statuses
        for event in self.events.values():
            self._update_event_status(event)
        
        events = list(self.events.values())
        
        if status:
            events = [e for e in events if e.status == status]
        
        # Sort by start date
        events.sort(key=lambda x: x.start_date, reverse=True)
        
        # Count by status
        active_count = sum(1 for e in self.events.values() if e.status == EventStatus.ACTIVE)
        scheduled_count = sum(1 for e in self.events.values() if e.status == EventStatus.SCHEDULED)
        draft_count = sum(1 for e in self.events.values() if e.status == EventStatus.DRAFT)
        
        return EventListResponse(
            events=events,
            total=len(events),
            active_count=active_count,
            scheduled_count=scheduled_count,
            draft_count=draft_count
        )
    
    def get_calendar_view(self, start_date: datetime, end_date: datetime) -> List[EventCalendarItem]:
        """Get events for calendar view"""
        calendar_items = []
        
        for event in self.events.values():
            # Check if event overlaps with date range
            if event.end_date >= start_date and event.start_date <= end_date:
                # Create summary strings
                targets_summary = []
                for target in event.targets:
                    if target.type == TargetType.VIP_TIER:
                        targets_summary.extend(target.values)
                    elif target.type == TargetType.AI_SEGMENT:
                        targets_summary.extend(target.values)
                
                rewards_summary = []
                for reward in event.rewards:
                    if reward.type == "points_multiplier":
                        rewards_summary.append(f"{reward.value}x Points")
                    elif reward.type == "bonus_points":
                        rewards_summary.append(f"+{int(reward.value)} Points")
                    elif reward.type == "exclusive_discount":
                        rewards_summary.append(f"{int(reward.value)}% Off")
                    else:
                        rewards_summary.append(reward.description)
                
                calendar_item = EventCalendarItem(
                    id=event.id,
                    name=event.name,
                    event_type=event.event_type,
                    status=event.status,
                    start_date=event.start_date,
                    end_date=event.end_date,
                    targets_summary=targets_summary[:3],  # Limit to 3
                    rewards_summary=rewards_summary[:2],  # Limit to 2
                    estimated_reach=sum(t.estimated_reach for t in event.targets),
                    icon=event.icon,
                    color=event.color
                )
                calendar_items.append(calendar_item)
        
        # Sort by start date
        calendar_items.sort(key=lambda x: x.start_date)
        return calendar_items
    
    def get_event_analytics(self, event_id: str) -> Optional[EventAnalytics]:
        """Get analytics for an event"""
        event = self.events.get(event_id)
        if not event:
            return None
        
        participants = self.participants.get(event_id, [])
        
        # Calculate metrics
        participants_count = len(participants)
        conversion_rate = 0.65 if participants_count > 0 else 0
        avg_order_value = 163.50
        total_revenue = event.total_revenue_generated
        roi = (total_revenue / 5000) * 100 if total_revenue > 0 else 0  # Assume $5000 cost
        engagement_rate = 0.78 if participants_count > 0 else 0
        
        # Performance by target
        performance_by_target = {}
        for target in event.targets:
            target_key = f"{target.type}:{','.join(target.values)}"
            performance_by_target[target_key] = {
                "participants": int(participants_count * 0.4),
                "conversion_rate": 0.72,
                "revenue": total_revenue * 0.4,
                "avg_order_value": avg_order_value * 1.1
            }
        
        # Daily metrics (mock data)
        daily_metrics = []
        if event.status in [EventStatus.ACTIVE, EventStatus.COMPLETED]:
            days = min(7, (datetime.now() - event.start_date).days + 1)
            for i in range(days):
                date = event.start_date + timedelta(days=i)
                daily_metrics.append({
                    "date": date.isoformat(),
                    "participants": random.randint(3, 8),
                    "revenue": random.uniform(2000, 8000),
                    "orders": random.randint(5, 15)
                })
        
        return EventAnalytics(
            event_id=event_id,
            status=event.status,
            participants_count=participants_count,
            conversion_rate=conversion_rate,
            avg_order_value=avg_order_value,
            total_revenue=total_revenue,
            roi=roi,
            engagement_rate=engagement_rate,
            performance_by_target=performance_by_target,
            daily_metrics=daily_metrics
        )
    
    def delete_event(self, event_id: str) -> bool:
        """Delete an event"""
        if event_id in self.events:
            del self.events[event_id]
            if event_id in self.participants:
                del self.participants[event_id]
            return True
        return False
    
    def get_available_targets(self) -> Dict[str, List[str]]:
        """Get available VIP tiers and AI segments for targeting"""
        return {
            "vip_tiers": [
                VIPTierLevel.BRONZE,
                VIPTierLevel.SILVER,
                VIPTierLevel.GOLD,
                VIPTierLevel.PLATINUM,
                "Diamond"  # Custom tier
            ],
            "ai_segments": [
                "Champions",
                "Loyal Customers",
                "Potential Loyalists",
                "New Customers",
                "At-Risk Customers",
                "Can't Lose Them",
                "High Value Customers",
                "Frequent Buyers",
                "New Customer Onboarding"
            ]
        } 