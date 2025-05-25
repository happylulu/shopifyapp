import os
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ai_models import (
    AIInsightsResponse, AIOpportunity, SegmentAnalytics, CustomerInsight,
    CustomerSegment, InsightType, ActionType, AIPerformanceMetrics
)

class AIInsightsService:
    """Service for AI-powered customer insights and recommendations"""
    
    def __init__(self):
        # In production, this would connect to OpenAI API
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.use_mock_data = not self.openai_api_key
        
        # Mock performance tracking
        self.performance_data = {
            "total_opportunities_identified": 127,
            "opportunities_acted_upon": 43,
            "success_rate": 0.78,
            "revenue_generated": 15420.50,
            "customers_engaged": 234,
            "avg_response_time": 0.85
        }
    
    def generate_customer_insights(self, days: int = 30) -> AIInsightsResponse:
        """Generate comprehensive AI customer insights and segmentation"""
        if self.use_mock_data:
            return self._generate_mock_insights(days)
        else:
            # In production, this would use OpenAI API to analyze customer data
            return self._generate_ai_insights(days)
    
    def _generate_mock_insights(self, days: int) -> AIInsightsResponse:
        """Generate mock AI insights for development"""
        
        # Mock customer insights
        customers = self._generate_mock_customers()
        
        # Mock opportunities
        opportunities = self._generate_mock_opportunities(customers)
        
        # Mock segment analytics
        segments = self._generate_mock_segments()
        
        return AIInsightsResponse(
            success=True,
            opportunities=opportunities,
            segments=segments,
            total_customers=len(customers),
            insights_generated_at=datetime.utcnow(),
            next_update_at=datetime.utcnow() + timedelta(hours=6)
        )
    
    def _generate_ai_insights(self, days: int) -> AIInsightsResponse:
        """Generate real AI insights using OpenAI API"""
        # TODO: Implement OpenAI integration
        # This would analyze customer data and generate insights
        return self._generate_mock_insights(days)
    
    def _generate_mock_customers(self) -> List[CustomerInsight]:
        """Generate mock customer data"""
        customers = []
        names = [
            ("Alice Johnson", "alice@example.com"),
            ("Bob Smith", "bob@example.com"),
            ("Carol Davis", "carol@example.com"),
            ("David Wilson", "david@example.com"),
            ("Emma Brown", "emma@example.com"),
            ("Frank Miller", "frank@example.com"),
            ("Grace Lee", "grace@example.com"),
            ("Henry Taylor", "henry@example.com")
        ]
        
        segments = list(CustomerSegment)
        
        for i, (name, email) in enumerate(names):
            customer = CustomerInsight(
                customer_id=f"cust_{i+1}",
                customer_name=name,
                customer_email=email,
                segment=random.choice(segments),
                growth_percentage=random.uniform(-20, 50),
                orders_count=random.randint(1, 25),
                total_spent=random.uniform(50, 2500),
                last_order_date=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                risk_score=random.uniform(0, 1) if random.random() > 0.5 else None,
                engagement_score=random.uniform(0.2, 1.0),
                predicted_ltv=random.uniform(100, 5000),
                recommended_actions=[
                    "Send personalized email",
                    "Offer loyalty points bonus",
                    "Recommend similar products"
                ]
            )
            customers.append(customer)
        
        return customers
    
    def _generate_mock_opportunities(self, customers: List[CustomerInsight]) -> List[AIOpportunity]:
        """Generate mock business opportunities"""
        opportunities = []
        
        opportunity_templates = [
            {
                "type": InsightType.OPPORTUNITY,
                "title": "High-Value Customer Retention",
                "description": "Identify customers at risk of churning and implement retention strategies",
                "recommended_action": "Send personalized retention email with 15% discount"
            },
            {
                "type": InsightType.WARNING,
                "title": "Declining Engagement Alert",
                "description": "Several customers showing decreased engagement patterns",
                "recommended_action": "Launch re-engagement campaign with exclusive offers"
            },
            {
                "type": InsightType.OPTIMIZATION,
                "title": "Cross-sell Opportunity",
                "description": "Customers who bought product A are likely to buy product B",
                "recommended_action": "Create targeted product recommendation campaign"
            }
        ]
        
        for i, template in enumerate(opportunity_templates):
            affected_customers = random.sample(customers, random.randint(2, 5))
            
            opportunity = AIOpportunity(
                id=f"opp_{uuid.uuid4().hex[:8]}",
                type=template["type"],
                title=template["title"],
                description=template["description"],
                impact_score=random.uniform(60, 95),
                confidence=random.uniform(0.7, 0.95),
                affected_customers=affected_customers,
                recommended_action=template["recommended_action"],
                potential_revenue=random.uniform(500, 5000),
                effort_level=random.choice(["low", "medium", "high"]),
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=random.randint(7, 30))
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    def _generate_mock_segments(self) -> List[SegmentAnalytics]:
        """Generate mock segment analytics"""
        segments = []
        
        segment_data = [
            {
                "segment": CustomerSegment.HIGH_VALUE,
                "name": "High Value Customers",
                "description": "Top 20% of customers by lifetime value",
                "color": "#22c55e",
                "icon": "💎"
            },
            {
                "segment": CustomerSegment.AT_RISK,
                "name": "At-Risk Customers", 
                "description": "Customers showing signs of potential churn",
                "color": "#ef4444",
                "icon": "⚠️"
            },
            {
                "segment": CustomerSegment.NEW_CUSTOMERS,
                "name": "New Customers",
                "description": "Recently acquired customers (last 30 days)",
                "color": "#3b82f6",
                "icon": "🆕"
            },
            {
                "segment": CustomerSegment.FREQUENT_BROWSERS,
                "name": "Frequent Browsers",
                "description": "High website engagement, low purchase frequency",
                "color": "#8b5cf6",
                "icon": "👀"
            }
        ]
        
        total_customers = 324
        
        for data in segment_data:
            customer_count = random.randint(15, 80)
            segment = SegmentAnalytics(
                segment=data["segment"],
                name=data["name"],
                description=data["description"],
                customer_count=customer_count,
                percentage=(customer_count / total_customers) * 100,
                avg_order_value=random.uniform(45, 150),
                total_revenue=random.uniform(2000, 15000),
                growth_rate=random.uniform(-10, 25),
                color=data["color"],
                icon=data["icon"]
            )
            segments.append(segment)
        
        return segments
    
    def refresh_insights(self) -> Dict[str, Any]:
        """Manually refresh AI insights"""
        # Simulate processing time
        processing_time = random.uniform(2, 8)
        
        return {
            "success": True,
            "message": "AI insights refreshed successfully",
            "processing_time": f"{processing_time:.1f}s",
            "new_opportunities_found": random.randint(1, 5),
            "updated_segments": random.randint(2, 6),
            "next_auto_refresh": (datetime.utcnow() + timedelta(hours=6)).isoformat()
        }
    
    def execute_ai_action(self, opportunity_id: str, action_type: ActionType, 
                         customer_ids: List[str], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an AI-recommended action"""
        
        # Simulate action execution
        customers_affected = len(customer_ids)
        
        action_results = {
            ActionType.AWARD_POINTS: "Loyalty points awarded",
            ActionType.SEND_EMAIL: "Personalized emails sent",
            ActionType.CREATE_SEGMENT: "Customer segment created",
            ActionType.OFFER_DISCOUNT: "Discount codes generated",
            ActionType.REFERRAL_INVITE: "Referral invitations sent"
        }
        
        return {
            "success": True,
            "action_executed": action_results.get(action_type, "Action completed"),
            "customers_affected": customers_affected,
            "estimated_impact": f"${random.uniform(500, 2000):.2f} potential revenue",
            "execution_time": f"{random.uniform(0.5, 3.0):.1f}s",
            "follow_up_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "success_probability": f"{random.uniform(70, 95):.1f}%"
        }
    
    def get_performance_metrics(self) -> AIPerformanceMetrics:
        """Get AI system performance metrics"""
        
        # Generate mock 30-day performance data
        last_30_days = {}
        for i in range(30):
            date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            last_30_days[date] = random.uniform(0.6, 0.9)
        
        return AIPerformanceMetrics(
            total_opportunities_identified=self.performance_data["total_opportunities_identified"],
            opportunities_acted_upon=self.performance_data["opportunities_acted_upon"],
            success_rate=self.performance_data["success_rate"],
            revenue_generated=self.performance_data["revenue_generated"],
            customers_engaged=self.performance_data["customers_engaged"],
            avg_response_time=self.performance_data["avg_response_time"],
            last_30_days_performance=last_30_days
        )
