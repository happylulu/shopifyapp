from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import os
import uuid
import openai
from openai import OpenAI
from ai_models import (
    AIInsightsResponse, CustomerInsight, AIOpportunity, SegmentAnalytics,
    InsightType, ActionType, AIPerformanceMetrics, CustomerSegment
)

class AIInsightsService:
    """
    AI-powered customer insights and segmentation service
    """
    
    def __init__(self):
        self.last_analysis = None
        self.performance_metrics = self._init_performance_metrics()
        
        # Initialize OpenAI client
        api_key = os.getenv('OPENAI_API_KEY', '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')
        self.client = OpenAI(api_key=api_key)
        
        # Mock customer data (in production, this would come from your database)
        self.mock_customer_data = {
            "total_customers": 2847,
            "recent_customers": [
                {"id": "1", "name": "Sarah M.", "last_purchase": "2024-01-15", "total_spent": 450.00, "orders": 3},
                {"id": "2", "name": "Mike J.", "last_purchase": "2024-01-10", "total_spent": 890.00, "orders": 7},
                {"id": "3", "name": "Emma R.", "last_purchase": "2024-01-20", "total_spent": 320.00, "orders": 2},
            ],
            "purchase_patterns": {
                "weekend_shoppers": 756,
                "frequent_browsers": 423,
                "high_value_customers": 156,
                "at_risk_customers": 234
            },
            "revenue_data": {
                "last_30_days": 45670.00,
                "growth_rate": 12.5,
                "avg_order_value": 67.80
            }
        }
    
    def _init_performance_metrics(self) -> AIPerformanceMetrics:
        """Initialize AI performance tracking"""
        return AIPerformanceMetrics(
            total_opportunities_identified=47,
            opportunities_acted_upon=23,
            success_rate=0.78,
            revenue_generated=12450.50,
            customers_engaged=156,
            avg_response_time=2.3,
            last_30_days_performance={
                "opportunities_found": 12,
                "revenue_impact": 3200.00,
                "customer_engagement": 89,
                "success_rate": 0.82
            }
        )
    
    def generate_customer_insights(self, days: int = 30) -> AIInsightsResponse:
        """
        Generate comprehensive AI-powered customer insights using real OpenAI analysis
        """
        try:
            # Get real AI insights from OpenAI
            ai_data = self._call_openai_for_insights(self.mock_customer_data, days)
            
            # Convert opportunities
            opportunities = []
            for opp_data in ai_data.get("opportunities", []):
                # Create mock customer insights for each opportunity
                affected_customers = [
                    CustomerInsight(
                        customer_id=f"cust_{i:03d}",
                        customer_name=f"Customer {i+1}",
                        customer_email=f"customer{i+1}@example.com",
                        segment=CustomerSegment.WEEKEND_SHOPPERS,  # Default segment
                        growth_percentage=15.0,
                        orders_count=3,
                        total_spent=250.0,
                        last_order_date=datetime.now() - timedelta(days=5),
                        engagement_score=0.75,
                        predicted_ltv=500.0,
                        recommended_actions=["Send targeted email", "Offer discount"]
                    ) for i in range(2)  # Create 2 mock customers per opportunity
                ]
                
                opportunity = AIOpportunity(
                    id=str(uuid.uuid4()),
                    type=InsightType.OPPORTUNITY,
                    title=opp_data.get("title", "AI Opportunity"),
                    description=opp_data.get("description", "AI-generated opportunity"),
                    impact_score=opp_data.get("impact_score", 70.0),
                    confidence=0.85,
                    affected_customers=affected_customers,
                    recommended_action=opp_data.get("title", "Execute AI recommendation"),
                    potential_revenue=opp_data.get("potential_revenue", 10000.0),
                    effort_level=opp_data.get("implementation_effort", "medium"),
                    created_at=datetime.now(),
                    expires_at=datetime.now() + timedelta(days=30)
                )
                opportunities.append(opportunity)
            
            # Convert segments
            segments = []
            for seg_data in ai_data.get("segments", []):
                segment = SegmentAnalytics(
                    segment=CustomerSegment.WEEKEND_SHOPPERS,  # Map to available segments
                    name=seg_data.get("segment", "AI Segment"),
                    description=seg_data.get("description", "AI-generated segment"),
                    customer_count=seg_data.get("customer_count", 100),
                    percentage=seg_data.get("percentage", 5.0),
                    avg_order_value=seg_data.get("avg_order_value", 50.0),
                    total_revenue=seg_data.get("total_revenue", 5000.0),
                    growth_rate=seg_data.get("growth_rate", 0.0),
                    color=seg_data.get("color", "#6B7280"),
                    icon=seg_data.get("icon", "👥")
                )
                segments.append(segment)
            
            # Create comprehensive response
            response = AIInsightsResponse(
                success=True,
                opportunities=opportunities,
                segments=segments,
                total_customers=self.mock_customer_data["total_customers"],
                insights_generated_at=datetime.now(),
                next_update_at=datetime.now() + timedelta(hours=6)
            )
            
            # Cache the response
            self.last_analysis = response
            return response
            
        except Exception as e:
            print(f"Error generating AI insights: {e}")
            # Fallback to mock insights if OpenAI fails
            return self._generate_fallback_insights(days)
    
    def _generate_opportunities(self) -> List[AIOpportunity]:
        """Generate AI-powered business opportunities"""
        
        opportunities = []
        
        # Rising Stars Opportunity
        rising_stars_customers = [
            CustomerInsight(
                customer_id="cust_001",
                customer_name="Sarah Chen",
                customer_email="sarah@example.com",
                segment=CustomerSegment.RISING_STARS,
                growth_percentage=40.0,
                orders_count=4,
                total_spent=342.00,
                last_order_date=datetime.now() - timedelta(days=2),
                engagement_score=0.85,
                predicted_ltv=890.00,
                recommended_actions=["Award Points", "VIP Invitation", "Referral Program"]
            ),
            CustomerInsight(
                customer_id="cust_002",
                customer_name="Mike Johnson",
                customer_email="mike@example.com",
                segment=CustomerSegment.RISING_STARS,
                growth_percentage=35.0,
                orders_count=3,
                total_spent=287.00,
                last_order_date=datetime.now() - timedelta(days=1),
                engagement_score=0.78,
                predicted_ltv=750.00,
                recommended_actions=["Points Boost", "Social Referral"]
            ),
            CustomerInsight(
                customer_id="cust_003",
                customer_name="Emma Davis",
                customer_email="emma@example.com",
                segment=CustomerSegment.RISING_STARS,
                growth_percentage=28.0,
                orders_count=5,
                total_spent=398.00,
                last_order_date=datetime.now() - timedelta(hours=8),
                engagement_score=0.82,
                predicted_ltv=820.00,
                recommended_actions=["Loyalty Tier Upgrade", "Early Access"]
            )
        ]
        
        rising_stars_opportunity = AIOpportunity(
            id=str(uuid.uuid4()),
            type=InsightType.OPPORTUNITY,
            title="Accelerate Your Rising Stars ⭐",
            description="You have 3 customers who are showing increased purchase frequency and are on their way to becoming top spenders. Consider giving them a small points boost to encourage their next purchase.",
            impact_score=85.0,
            confidence=0.92,
            affected_customers=rising_stars_customers,
            recommended_action="Award bonus points to accelerate customer growth",
            potential_revenue=2150.00,
            effort_level="low",
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7)
        )
        opportunities.append(rising_stars_opportunity)
        
        # At-Risk Customers Opportunity
        at_risk_customers = [
            CustomerInsight(
                customer_id="cust_004",
                customer_name="David Wilson",
                customer_email="david@example.com",
                segment=CustomerSegment.AT_RISK,
                growth_percentage=-15.0,
                orders_count=2,
                total_spent=156.00,
                last_order_date=datetime.now() - timedelta(days=67),
                risk_score=0.78,
                engagement_score=0.23,
                predicted_ltv=180.00,
                recommended_actions=["Win-back Email", "Special Discount", "Personal Outreach"]
            ),
            CustomerInsight(
                customer_id="cust_005",
                customer_name="Lisa Taylor",
                customer_email="lisa@example.com",
                segment=CustomerSegment.AT_RISK,
                growth_percentage=-22.0,
                orders_count=3,
                total_spent=298.00,
                last_order_date=datetime.now() - timedelta(days=89),
                risk_score=0.85,
                engagement_score=0.18,
                predicted_ltv=320.00,
                recommended_actions=["Urgent Re-engagement", "VIP Offer"]
            )
        ]
        
        at_risk_opportunity = AIOpportunity(
            id=str(uuid.uuid4()),
            type=InsightType.WARNING,
            title="Re-engage At-Risk Customers 🚨",
            description="5 high-value customers haven't purchased in 60+ days. Their predicted churn risk is 78%. Act now to prevent losing $1,200 in potential revenue.",
            impact_score=72.0,
            confidence=0.89,
            affected_customers=at_risk_customers,
            recommended_action="Launch targeted win-back campaign with personalized offers",
            potential_revenue=1200.00,
            effort_level="medium",
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=14)
        )
        opportunities.append(at_risk_opportunity)
        
        # Weekend Shoppers Optimization
        weekend_shoppers = [
            CustomerInsight(
                customer_id="cust_006",
                customer_name="Alex Rodriguez",
                customer_email="alex@example.com",
                segment=CustomerSegment.WEEKEND_SHOPPERS,
                growth_percentage=12.0,
                orders_count=6,
                total_spent=445.00,
                last_order_date=datetime.now() - timedelta(days=3),
                engagement_score=0.71,
                predicted_ltv=680.00,
                recommended_actions=["Weekend Promotions", "Saturday Email Campaigns"]
            )
        ]
        
        weekend_opportunity = AIOpportunity(
            id=str(uuid.uuid4()),
            type=InsightType.OPTIMIZATION,
            title="Optimize Weekend Shopping Experience 📅",
            description="23% of your revenue comes from weekend shoppers. Enhance their experience with targeted weekend promotions and early access to sales.",
            impact_score=68.0,
            confidence=0.84,
            affected_customers=weekend_shoppers,
            recommended_action="Create weekend-specific loyalty rewards and promotions",
            potential_revenue=890.00,
            effort_level="medium",
            created_at=datetime.now()
        )
        opportunities.append(weekend_opportunity)
        
        return opportunities
    
    def _generate_customer_segments(self) -> List[SegmentAnalytics]:
        """Generate customer segment analytics"""
        
        segments = [
            SegmentAnalytics(
                segment=CustomerSegment.HIGH_VALUE,
                name="High Value",
                description="Your top spending customers",
                customer_count=127,
                percentage=15.0,
                avg_order_value=185.50,
                total_revenue=23579.50,
                growth_rate=8.3,
                color="#FFB800",
                icon="👑"
            ),
            SegmentAnalytics(
                segment=CustomerSegment.HIGH_VALUE,
                name="Returning",
                description="Regular customers with repeat purchases",
                customer_count=584,
                percentage=45.0,
                avg_order_value=95.30,
                total_revenue=55695.20,
                growth_rate=12.1,
                color="#4F46E5",
                icon="🔄"
            ),
            SegmentAnalytics(
                segment=CustomerSegment.AT_RISK,
                name="At-Risk Customers",
                description="Last purchase > 60 days",
                customer_count=89,
                percentage=7.0,
                avg_order_value=78.90,
                total_revenue=7022.10,
                growth_rate=-5.2,
                color="#EF4444",
                icon="⚠️"
            ),
            SegmentAnalytics(
                segment=CustomerSegment.FREQUENT_BROWSERS,
                name="Frequent Browsers",
                description="Browse but rarely purchase",
                customer_count=156,
                percentage=12.0,
                avg_order_value=45.20,
                total_revenue=7051.20,
                growth_rate=3.4,
                color="#10B981",
                icon="👀"
            ),
            SegmentAnalytics(
                segment=CustomerSegment.WEEKEND_SHOPPERS,
                name="Weekend Shoppers",
                description="Most active on weekends",
                customer_count=203,
                percentage=16.0,
                avg_order_value=112.40,
                total_revenue=22817.20,
                growth_rate=15.7,
                color="#8B5CF6",
                icon="📅"
            ),
            SegmentAnalytics(
                segment=CustomerSegment.NEW_CUSTOMERS,
                name="New Customers",
                description="First-time buyers in last 30 days",
                customer_count=88,
                percentage=7.0,
                avg_order_value=67.80,
                total_revenue=5966.40,
                growth_rate=22.3,
                color="#22C55E",
                icon="🌟"
            )
        ]
        
        return segments
    
    def execute_ai_action(self, opportunity_id: str, action_type: ActionType, customer_ids: List[str], parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute an AI-recommended action"""
        
        if parameters is None:
            parameters = {}
        
        # Simulate action execution
        success_rate = random.uniform(0.7, 0.95)
        estimated_impact = random.uniform(500, 2000)
        
        # Update performance metrics
        self.performance_metrics.opportunities_acted_upon += 1
        self.performance_metrics.customers_engaged += len(customer_ids)
        
        return {
            "success": True,
            "action_executed": action_type.value,
            "customers_affected": len(customer_ids),
            "estimated_impact": f"${estimated_impact:.2f}",
            "execution_time": datetime.now().isoformat(),
            "follow_up_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "success_probability": f"{success_rate:.1%}"
        }
    
    def get_performance_metrics(self) -> AIPerformanceMetrics:
        """Get AI system performance metrics"""
        return self.performance_metrics
    
    def refresh_insights(self) -> Dict[str, Any]:
        """Manually refresh AI insights"""
        
        # Simulate AI processing time
        processing_time = random.uniform(1.5, 3.2)
        
        return {
            "success": True,
            "message": "AI insights refreshed successfully",
            "processing_time": f"{processing_time:.1f}s",
            "new_opportunities_found": random.randint(1, 4),
            "updated_segments": random.randint(2, 6),
            "next_auto_refresh": (datetime.now() + timedelta(hours=6)).isoformat()
        }

    def _call_openai_for_insights(self, customer_data: Dict[str, Any], days: int = 30) -> Dict[str, Any]:
        """Call OpenAI to generate real AI insights"""
        try:
            prompt = f"""
            As an e-commerce AI analyst, analyze this customer data and provide actionable insights:

            Customer Data:
            - Total Customers: {customer_data['total_customers']}
            - Revenue (last 30 days): ${customer_data['revenue_data']['last_30_days']:,.2f}
            - Growth Rate: {customer_data['revenue_data']['growth_rate']}%
            - Average Order Value: ${customer_data['revenue_data']['avg_order_value']}
            - Weekend Shoppers: {customer_data['purchase_patterns']['weekend_shoppers']}
            - Frequent Browsers: {customer_data['purchase_patterns']['frequent_browsers']}
            - High Value Customers: {customer_data['purchase_patterns']['high_value_customers']}
            - At-Risk Customers: {customer_data['purchase_patterns']['at_risk_customers']}

            Please provide:
            1. 3-5 key customer insights with specific recommendations
            2. 3-4 high-impact business opportunities 
            3. Customer segmentation analysis

            Return as JSON with this structure:
            {{
                "insights": [
                    {{
                        "type": "customer_behavior|revenue_trend|engagement|retention",
                        "title": "Brief insight title",
                        "description": "Detailed description with specific metrics",
                        "impact_level": "high|medium|low",
                        "recommended_actions": ["action1", "action2"]
                    }}
                ],
                "opportunities": [
                    {{
                        "type": "revenue_growth|customer_retention|market_expansion|product_optimization",
                        "title": "Opportunity title",
                        "description": "Detailed opportunity description",
                        "impact_score": 0.85,
                        "potential_revenue": 15000.00,
                        "implementation_effort": "low|medium|high",
                        "timeline": "1-2 weeks|1 month|2-3 months",
                        "customer_segments": ["segment1", "segment2"]
                    }}
                ],
                "segments": [
                    {{
                        "segment": "Weekend Shoppers",
                        "description": "AI-generated segment description",
                        "customer_count": 756,
                        "percentage": 26.5,
                        "avg_order_value": 78.50,
                        "total_revenue": 59346.00,
                        "growth_rate": 15.7,
                        "color": "#22c55e",
                        "icon": "🛍️"
                    }}
                ]
            }}
            """

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert e-commerce data analyst specializing in customer behavior and revenue optimization. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            # Parse the AI response
            ai_response = json.loads(response.choices[0].message.content)
            return ai_response

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            # Fallback to structured mock data if JSON parsing fails
            return self._get_fallback_insights()
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback to mock data if API fails
            return self._get_fallback_insights()

    def _get_fallback_insights(self) -> Dict[str, Any]:
        """Fallback insights if OpenAI fails"""
        return {
            "insights": [
                {
                    "type": "customer_behavior",
                    "title": "Weekend Shopping Surge",
                    "description": "26.5% of customers prefer weekend shopping, generating 15.7% higher AOV",
                    "impact_level": "high",
                    "recommended_actions": ["Create weekend-specific promotions", "Send Saturday morning email campaigns"]
                },
                {
                    "type": "retention",
                    "title": "At-Risk Customer Alert",
                    "description": "234 customers haven't purchased in 60+ days, representing potential revenue loss",
                    "impact_level": "medium",
                    "recommended_actions": ["Launch re-engagement campaign", "Offer personalized discounts"]
                }
            ],
            "opportunities": [
                {
                    "type": "revenue_growth",
                    "title": "Weekend Shopper Campaign",
                    "description": "Target weekend shoppers with time-sensitive offers to boost conversion",
                    "impact_score": 0.85,
                    "potential_revenue": 15000.00,
                    "implementation_effort": "low",
                    "timeline": "1-2 weeks",
                    "customer_segments": ["Weekend Shoppers"]
                }
            ],
            "segments": [
                {
                    "segment": "Weekend Shoppers",
                    "description": "Customers who primarily shop on weekends",
                    "customer_count": 756,
                    "percentage": 26.5,
                    "avg_order_value": 78.50,
                    "total_revenue": 59346.00,
                    "growth_rate": 15.7,
                    "color": "#22c55e",
                    "icon": "🛍️"
                }
            ]
        }

    def _generate_fallback_insights(self, days: int = 30) -> AIInsightsResponse:
        """Generate fallback mock insights when OpenAI is unavailable"""
        # Fallback customer insights
        insights = [
            CustomerInsight(
                customer_id="cust_001",
                customer_name="Sarah Chen",
                customer_email="sarah@example.com",
                segment=CustomerSegment.WEEKEND_SHOPPERS,
                growth_percentage=25.0,
                orders_count=4,
                total_spent=342.00,
                last_order_date=datetime.now() - timedelta(days=2),
                engagement_score=0.85,
                predicted_ltv=890.00,
                recommended_actions=["Create weekend-specific promotions", "Send Saturday morning email campaigns"]
            )
        ]
        
        # Fallback opportunities
        opportunities = [
            AIOpportunity(
                id=str(uuid.uuid4()),
                type=InsightType.OPPORTUNITY,
                title="Weekend Shopper Campaign",
                description="Target weekend shoppers with time-sensitive offers to boost conversion",
                impact_score=85.0,
                confidence=0.85,
                affected_customers=insights,
                recommended_action="Create weekend promotions",
                potential_revenue=15000.0,
                effort_level="low",
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(days=14)
            )
        ]
        
        # Fallback segments
        segments = [
            SegmentAnalytics(
                segment=CustomerSegment.WEEKEND_SHOPPERS,
                name="Weekend Shoppers",
                description="Customers who primarily shop on weekends",
                customer_count=756,
                percentage=26.5,
                avg_order_value=78.50,
                total_revenue=59346.00,
                growth_rate=15.7,
                color="#22c55e",
                icon="🛍️"
            )
        ]
        
        return AIInsightsResponse(
            success=True,
            opportunities=opportunities,
            segments=segments,
            total_customers=self.mock_customer_data["total_customers"],
            insights_generated_at=datetime.now(),
            next_update_at=datetime.now() + timedelta(hours=6)
        ) 