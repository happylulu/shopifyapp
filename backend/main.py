from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import datetime
import asyncio

# Database helpers for multi-tenancy
from models_v2 import init_db
from models_v2 import Shop, CustomerLoyaltyProfile, get_db
from sqlalchemy import select, delete

# Import existing models and services
from mock_data import get_dashboard_data, get_points_program_data
from services import PointsService

# Import new referral components
from api_models import (
    CreateReferralLinkRequest, UpdateSocialConfigRequest, UpdateLinkConfigRequest,
    ReferralLinkResponse, AnalyticsResponse, SocialPlatform, ReferralLinkConfig, SocialSharingConfig,
    TrackClickRequest, TrackConversionRequest
)
from referral_service import ReferralService

# Import new AI services
from ai_service import AIInsightsService
from ai_models import ExecuteActionRequest, CreateSegmentRequest, ActionType

# Import VIP models and service
from vip_models import (
    VIPTierLevel, CreateVIPMemberRequest, UpdateVIPTierRequest,
    VIPMemberResponse, VIPTierResponse, VIPAnalyticsResponse
)
from vip_service import VIPService

app = FastAPI(title="Shopify Loyalty App API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize services
points_service = PointsService()
referral_service = ReferralService()
ai_service = AIInsightsService()  # New AI service
vip_service = VIPService()  # New VIP service

# Initialize database tables for multi-tenant storage
asyncio.run(init_db())

# Helper function to extract shop domain from headers (Shopify app pattern)
def get_shop_domain(request: Request) -> str:
    """Extract shop domain from request headers or query params"""
    # In a real Shopify app, this would come from the session token
    shop = request.headers.get("X-Shopify-Shop-Domain") or "demo.myshopify.com"
    return shop

# Existing endpoints
@app.get("/")
async def root():
    return {"message": "Shopify Loyalty App API", "version": "1.0.0"}

@app.get("/dashboard/overview")
async def get_dashboard():
    try:
        data = get_dashboard_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/points-program/config")
async def get_points_config():
    try:
        data = get_points_program_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# REFERRAL SYSTEM API ENDPOINTS
# ============================================================================

@app.get("/referrals/link-config")
async def get_referral_link_config(request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.get_link_config(shop_domain)

@app.post("/referrals/link-config")
async def update_referral_link_config(config: ReferralLinkConfig, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.update_link_config(shop_domain, config)

@app.get("/referrals/social-config")
async def get_social_config(request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.get_social_config(shop_domain)

@app.post("/referrals/social-config")
async def update_social_config(config: SocialSharingConfig, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.update_social_config(shop_domain, config)

@app.post("/referrals/links")
async def create_referral_link(request_data: CreateReferralLinkRequest, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.create_referral_link(shop_domain, request_data)

@app.get("/referrals/links")
async def get_referral_links(
    request: Request,
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    shop_domain = get_shop_domain(request)
    return referral_service.get_referral_links(shop_domain, customer_id, status, limit, offset)

@app.get("/referrals/links/{link_id}")
async def get_referral_link(link_id: str, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.get_referral_link(shop_domain, link_id)

@app.delete("/referrals/links/{link_id}")
async def delete_referral_link(link_id: str, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.delete_referral_link(shop_domain, link_id)

@app.post("/referrals/clicks")
async def track_referral_click(request_data: TrackClickRequest, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.track_click(shop_domain, request_data)

@app.post("/referrals/conversions")
async def track_referral_conversion(request_data: TrackConversionRequest, request: Request):
    shop_domain = get_shop_domain(request)
    return referral_service.track_conversion(shop_domain, request_data)

@app.get("/referrals/analytics")
async def get_referral_analytics(request: Request, days: int = 30):
    shop_domain = get_shop_domain(request)
    return referral_service.get_analytics(shop_domain, days)

@app.get("/referrals/analytics/{link_id}")
async def get_link_analytics(link_id: str, request: Request, days: int = 30):
    shop_domain = get_shop_domain(request)
    return referral_service.get_link_analytics(shop_domain, link_id, days)

# =================== NEW AI INSIGHTS ENDPOINTS ===================

@app.get("/ai/insights")
async def get_ai_insights(days: int = 30):
    """Get comprehensive AI customer insights and segmentation"""
    try:
        insights = ai_service.generate_customer_insights(days)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI insights: {str(e)}")

@app.post("/ai/insights/refresh")
async def refresh_ai_insights(background_tasks: BackgroundTasks):
    """Manually refresh AI insights"""
    try:
        result = ai_service.refresh_insights()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh insights: {str(e)}")

@app.post("/ai/actions/execute")
async def execute_ai_action(request: ExecuteActionRequest):
    """Execute an AI-recommended action"""
    try:
        result = ai_service.execute_ai_action(
            request.opportunity_id,
            request.action_type,
            request.customer_ids,
            request.parameters
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute action: {str(e)}")

@app.get("/ai/performance")
async def get_ai_performance():
    """Get AI system performance metrics"""
    try:
        metrics = ai_service.get_performance_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")

@app.post("/ai/segments/create")
async def create_custom_segment(request: CreateSegmentRequest):
    """Create a custom customer segment"""
    try:
        # This would integrate with your customer segmentation system
        segment_id = f"segment_{len(request.name.replace(' ', '_').lower())}"

        return {
            "success": True,
            "segment_id": segment_id,
            "name": request.name,
            "description": request.description,
            "criteria": request.criteria,
            "auto_update": request.auto_update,
            "created_at": datetime.now().isoformat(),
            "estimated_customers": 45  # Mock data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create segment: {str(e)}")

@app.get("/ai/segments")
async def get_customer_segments():
    """Get all customer segments with analytics"""
    try:
        insights = ai_service.generate_customer_insights()
        return {
            "success": True,
            "segments": insights.segments,
            "total_customers": insights.total_customers,
            "last_updated": insights.insights_generated_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get segments: {str(e)}")

@app.get("/ai/opportunities")
async def get_ai_opportunities(
    type_filter: Optional[str] = None,
    impact_threshold: float = 0.0,
    limit: int = 10
):
    """Get AI-identified business opportunities"""
    try:
        insights = ai_service.generate_customer_insights()
        opportunities = insights.opportunities

        # Apply filters
        if type_filter:
            opportunities = [opp for opp in opportunities if opp.type == type_filter]

        if impact_threshold > 0:
            opportunities = [opp for opp in opportunities if opp.impact_score >= impact_threshold]

        # Sort by impact score
        opportunities.sort(key=lambda x: x.impact_score, reverse=True)

        return {
            "success": True,
            "opportunities": opportunities[:limit],
            "total_count": len(opportunities),
            "filters_applied": {
                "type": type_filter,
                "impact_threshold": impact_threshold
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get opportunities: {str(e)}")

# ============================================================================
# VIP TIERS API ENDPOINTS
# ============================================================================

@app.get("/vip/config")
async def get_vip_config(request: Request):
    """Get VIP program configuration"""
    shop_domain = get_shop_domain(request)
    config = vip_service.get_program_config(shop_domain)
    return config

@app.put("/vip/config")
async def update_vip_config(updates: Dict[str, Any], request: Request):
    """Update VIP program configuration"""
    shop_domain = get_shop_domain(request)
    config = vip_service.update_program_config(shop_domain, updates)
    return {"success": True, "config": config}

@app.get("/vip/tiers")
async def get_vip_tiers(request: Request):
    """Get all VIP tiers"""
    shop_domain = get_shop_domain(request)
    tiers = vip_service.get_tiers(shop_domain)
    return {"success": True, "tiers": tiers}

@app.get("/vip/tiers/{tier_level}")
async def get_vip_tier(tier_level: VIPTierLevel, request: Request):
    """Get a specific VIP tier"""
    shop_domain = get_shop_domain(request)
    tier = vip_service.get_tier(shop_domain, tier_level)
    if tier:
        return {"success": True, "tier": tier}
    else:
        raise HTTPException(status_code=404, detail="Tier not found")

@app.put("/vip/tiers/{tier_level}")
async def update_vip_tier(tier_level: VIPTierLevel, updates: UpdateVIPTierRequest, request: Request):
    """Update a VIP tier configuration"""
    shop_domain = get_shop_domain(request)
    response = vip_service.update_tier(shop_domain, tier_level, updates)
    if response.success:
        return response
    else:
        raise HTTPException(status_code=400, detail=response.error)

@app.get("/vip/members")
async def get_vip_members(
    request: Request,
    tier_filter: Optional[VIPTierLevel] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get VIP members"""
    shop_domain = get_shop_domain(request)
    members = vip_service.get_members(shop_domain, tier_filter)

    # Apply pagination
    paginated_members = members[offset:offset + limit]

    return {
        "success": True,
        "members": paginated_members,
        "total": len(members),
        "limit": limit,
        "offset": offset
    }

@app.get("/vip/members/{customer_id}")
async def get_vip_member(customer_id: str, request: Request):
    """Get a specific VIP member"""
    shop_domain = get_shop_domain(request)
    member = vip_service.get_member(shop_domain, customer_id)
    if member:
        return {"success": True, "member": member}
    else:
        raise HTTPException(status_code=404, detail="Member not found")

@app.post("/vip/members")
async def create_vip_member(member_request: CreateVIPMemberRequest, request: Request):
    """Create a new VIP member"""
    shop_domain = get_shop_domain(request)
    response = vip_service.create_member(shop_domain, member_request)
    if response.success:
        return response
    else:
        raise HTTPException(status_code=400, detail=response.error)

@app.put("/vip/members/{customer_id}/progress")
async def update_member_progress(
    customer_id: str,
    request: Request,
    amount_spent: float = 0,
    points_earned: int = 0,
    order_placed: bool = False
):
    """Update VIP member progress"""
    shop_domain = get_shop_domain(request)
    response = vip_service.update_member_progress(
        shop_domain, customer_id, amount_spent, points_earned, order_placed
    )
    if response.success:
        return response
    else:
        raise HTTPException(status_code=400, detail=response.error)

@app.get("/vip/analytics")
async def get_vip_analytics(request: Request):
    """Get VIP program analytics"""
    shop_domain = get_shop_domain(request)
    response = vip_service.get_analytics(shop_domain)
    if response.success:
        return response
    else:
        raise HTTPException(status_code=500, detail=response.error)

# ---------------------------------------------------------------------------
# Webhook: app/uninstalled
# ---------------------------------------------------------------------------

async def purge_shop_data(shop_domain: str) -> None:
    """Remove all records associated with a shop when the app is uninstalled."""
    async with get_db() as session:
        # Find the shop
        result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
        shop_id = result.scalar_one_or_none()
        if shop_id is None:
            return

        # Delete the shop (CASCADE will handle related records)
        await session.execute(delete(Shop).where(Shop.id == shop_id))
        await session.commit()

@app.post("/webhooks/app_uninstalled")
async def app_uninstalled(request: Request):
    """Handle Shopify APP_UNINSTALLED webhook and purge merchant data."""
    shop_domain = get_shop_domain(request)
    await purge_shop_data(shop_domain)
    return {"success": True}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
