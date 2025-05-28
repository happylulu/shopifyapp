from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from contextlib import asynccontextmanager
from jwt_middleware import JWTMiddleware
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import datetime
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

# Database helpers for multi-tenancy
from models_v2 import init_db
from models_v2 import (
    Shop,
    CustomerLoyaltyProfile,
    RewardDefinition,
    TierDefinition,
    get_db,
)
from sqlalchemy import select, delete

# Import existing models and services
from mock_data import get_dashboard_data, get_points_program_data
from services import PointsService

# Import new referral components
from api_models import (
    CreateReferralLinkRequest,
    UpdateSocialConfigRequest,
    UpdateLinkConfigRequest,
    ReferralLinkResponse,
    AnalyticsResponse,
    SocialPlatform,
    ReferralLinkConfig,
    SocialSharingConfig,
    TrackClickRequest,
    TrackConversionRequest,
    LoyaltyProfileCreate,
    LoyaltyProfileResponse,
    AdjustPointsRequest,
    RewardCreate,
    RewardResponse,
    TierCreate,
    TierResponse,
)
from referral_service import ReferralService
from rule_api import router as rule_router
from monitoring import monitoring_router
from event_streaming import publish_loyalty_event

# Import new AI services
from ai_service import AIInsightsService
from ai_models import ExecuteActionRequest, CreateSegmentRequest, ActionType

# Import VIP models and service
from vip_models import (
    VIPTierLevel, CreateVIPMemberRequest, UpdateVIPTierRequest,
    VIPMemberResponse, VIPTierResponse, VIPAnalyticsResponse
)
from vip_service import VIPService
from loyalty_service import loyalty_service

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (if needed)

app = FastAPI(title="Shopify Loyalty App API", version="1.0.0", lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(JWTMiddleware)

# Initialize services
points_service = PointsService()
referral_service = ReferralService()
ai_service = AIInsightsService()  # New AI service
vip_service = VIPService()  # New VIP service

# Include rule engine router
app.include_router(rule_router)

# Include monitoring router
app.include_router(monitoring_router)

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


# ---------------------------------------------------------------------------
# Loyalty Program CRUD Endpoints
# ---------------------------------------------------------------------------

@app.post("/loyalty/profiles/", response_model=LoyaltyProfileResponse)
async def create_loyalty_profile(
    profile: LoyaltyProfileCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    shop_domain = get_shop_domain(request)
    result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
    shop_id = result.scalar_one()
    new_profile = await loyalty_service.create_profile(
        session,
        shop_id,
        profile.shopify_customer_id,
        email=profile.email,
        first_name=profile.first_name,
        last_name=profile.last_name,
    )
    return LoyaltyProfileResponse(
        id=new_profile.id,
        shopify_customer_id=new_profile.shopify_customer_id,
        email=new_profile.email,
        first_name=new_profile.first_name,
        last_name=new_profile.last_name,
        points_balance=new_profile.points_balance,
        current_tier_name=new_profile.current_tier_name,
    )


@app.get("/loyalty/profiles/{shopify_customer_id}/", response_model=LoyaltyProfileResponse)
async def get_loyalty_profile(
    shopify_customer_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    shop_domain = get_shop_domain(request)
    result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
    shop_id = result.scalar_one()
    profile = await loyalty_service.get_profile(session, shop_id, shopify_customer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return LoyaltyProfileResponse(
        id=profile.id,
        shopify_customer_id=profile.shopify_customer_id,
        email=profile.email,
        first_name=profile.first_name,
        last_name=profile.last_name,
        points_balance=profile.points_balance,
        current_tier_name=profile.current_tier_name,
    )


@app.put("/loyalty/profiles/{shopify_customer_id}/points/", response_model=LoyaltyProfileResponse)
async def adjust_points_endpoint(
    shopify_customer_id: str,
    adjustments: AdjustPointsRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    shop_domain = get_shop_domain(request)
    result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
    shop_id = result.scalar_one()
    profile = await loyalty_service.get_profile(session, shop_id, shopify_customer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    try:
        updated = await loyalty_service.adjust_points(
            session, profile, adjustments.amount, adjustments.reason or "adjustment"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return LoyaltyProfileResponse(
        id=updated.id,
        shopify_customer_id=updated.shopify_customer_id,
        email=updated.email,
        first_name=updated.first_name,
        last_name=updated.last_name,
        points_balance=updated.points_balance,
        current_tier_name=updated.current_tier_name,
    )


@app.get("/rewards/", response_model=List[RewardResponse])
async def list_rewards(session: AsyncSession = Depends(get_db), request: Request = None):
    shop_domain = get_shop_domain(request) if request else "demo.myshopify.com"
    result = await session.execute(
        select(RewardDefinition).join(Shop).where(Shop.shop_domain == shop_domain)
    )
    rewards = result.scalars().all()
    return [
        RewardResponse(
            id=r.id,
            name=r.name,
            points_cost=r.points_cost,
            reward_type=r.reward_type,
            description=r.description,
        )
        for r in rewards
    ]


@app.post("/rewards/", response_model=RewardResponse)
async def create_reward(
    reward: RewardCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    shop_domain = get_shop_domain(request)
    result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
    shop_id = result.scalar_one()
    new_reward = RewardDefinition(
        shop_id=shop_id,
        name=reward.name,
        description=reward.description,
        reward_type=reward.reward_type,
        points_cost=reward.points_cost,
    )
    session.add(new_reward)
    await session.commit()
    await session.refresh(new_reward)
    return RewardResponse(
        id=new_reward.id,
        name=new_reward.name,
        points_cost=new_reward.points_cost,
        reward_type=new_reward.reward_type,
        description=new_reward.description,
    )


@app.get("/tiers/", response_model=List[TierResponse])
async def list_tiers(session: AsyncSession = Depends(get_db), request: Request = None):
    shop_domain = get_shop_domain(request) if request else "demo.myshopify.com"
    result = await session.execute(
        select(TierDefinition).join(Shop).where(Shop.shop_domain == shop_domain)
    )
    tiers = result.scalars().all()
    return [
        TierResponse(
            id=t.id,
            name=t.name,
            tier_level=t.tier_level,
            min_points_required=t.min_points_required,
        )
        for t in tiers
    ]


@app.post("/tiers/", response_model=TierResponse)
async def create_tier(
    tier: TierCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    shop_domain = get_shop_domain(request)
    result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
    shop_id = result.scalar_one()
    new_tier = TierDefinition(
        shop_id=shop_id,
        name=tier.name,
        tier_level=tier.tier_level,
        min_points_required=tier.min_points_required,
        description=tier.description,
    )
    session.add(new_tier)
    await session.commit()
    await session.refresh(new_tier)
    return TierResponse(
        id=new_tier.id,
        name=new_tier.name,
        tier_level=new_tier.tier_level,
        min_points_required=new_tier.min_points_required,
    )

# ============================================================================
# REFERRAL SYSTEM API ENDPOINTS
# ============================================================================

@app.get("/referrals/link-config")
async def get_referral_link_config(request: Request):
    """Return the referral link configuration for the current shop."""
    shop_domain = get_shop_domain(request)
    config = referral_service.get_link_config(shop_domain)
    return {"success": True, "config": config.model_dump()}

@app.put("/referrals/link-config")
async def update_referral_link_config(update: UpdateLinkConfigRequest, request: Request):
    """Update and return the referral link configuration."""
    shop_domain = get_shop_domain(request)
    config = referral_service.update_link_config(shop_domain, update)
    return {"success": True, "config": config.model_dump()}

@app.get("/referrals/social-config")
async def get_social_config(request: Request):
    """Return social sharing configuration for the current shop."""
    shop_domain = get_shop_domain(request)
    config = referral_service.get_social_config(shop_domain)
    # Convert enum keys to their value for JSON serialisation
    cfg = config.model_dump()
    cfg["platforms"] = [p.value for p in config.platforms]
    cfg["platform_messages"] = {k.value: v for k, v in config.platform_messages.items()}
    return {"success": True, "config": cfg}

@app.put("/referrals/social-config")
async def update_social_config(update: UpdateSocialConfigRequest, request: Request):
    """Update and return the social sharing configuration."""
    shop_domain = get_shop_domain(request)
    config = referral_service.update_social_config(shop_domain, update)
    cfg = config.model_dump()
    cfg["platforms"] = [p.value for p in config.platforms]
    cfg["platform_messages"] = {k.value: v for k, v in config.platform_messages.items()}
    return {"success": True, "config": cfg}

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
    link = referral_service.get_referral_link(shop_domain, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return link

@app.delete("/referrals/links/{link_id}")
async def delete_referral_link(link_id: str, request: Request):
    shop_domain = get_shop_domain(request)
    success = referral_service.delete_referral_link(shop_domain, link_id)
    if not success:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"success": True}

@app.post("/referrals/clicks")
async def track_referral_click(request_data: TrackClickRequest, request: Request):
    shop_domain = get_shop_domain(request)
    click = referral_service.track_click(shop_domain, request_data)
    if not click:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    return {"success": True, "click_id": click.id}

@app.post("/referrals/conversions")
async def track_referral_conversion(request_data: TrackConversionRequest, request: Request):
    shop_domain = get_shop_domain(request)
    success = referral_service.track_conversion(shop_domain, request_data)
    if not success:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    return {"success": True}

@app.get("/referrals/analytics")
async def get_referral_analytics(request: Request, days: int = 30):
    shop_domain = get_shop_domain(request)
    analytics = referral_service.get_analytics(shop_domain, days)
    return {
        "success": True,
        "analytics": {
            "total_links": analytics.total_links,
            "total_clicks": analytics.total_clicks,
            "total_conversions": analytics.total_conversions,
            "conversion_rate": analytics.conversion_rate,
            "revenue_today": float(analytics.revenue_today),
            "top_referrers": analytics.top_referrers
        }
    }

@app.get("/referrals/analytics/{link_id}")
async def get_link_analytics(link_id: str, request: Request, days: int = 30):
    shop_domain = get_shop_domain(request)
    analytics = referral_service.get_link_analytics(shop_domain, link_id, days)
    if not analytics:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"success": True, "analytics": analytics.model_dump()}

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
