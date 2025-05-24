from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn

# Import existing models and services
from mock_data import get_dashboard_data, get_points_program_data
from services import PointsService

# Import new referral components
from models import (
    CreateReferralLinkRequest, UpdateSocialConfigRequest, UpdateLinkConfigRequest,
    ReferralLinkResponse, AnalyticsResponse, SocialPlatform
)
from referral_service import ReferralService

app = FastAPI(title="Shopify Loyalty App", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize services
points_service = PointsService()
referral_service = ReferralService()

# Helper function to extract shop domain from headers (Shopify app pattern)
def get_shop_domain(request: Request) -> str:
    """Extract shop domain from request headers or query params"""
    # In a real Shopify app, this would come from the session token
    shop = request.headers.get("X-Shopify-Shop-Domain") or "demo.myshopify.com"
    return shop

# Existing endpoints
@app.get("/dashboard/overview")
async def dashboard_overview():
    """Get dashboard overview data"""
    return get_dashboard_data()

@app.get("/points-program/settings")
async def points_program_settings():
    """Get points program settings"""
    return get_points_program_data()

# ============================================================================
# REFERRAL SYSTEM API ENDPOINTS
# ============================================================================

@app.get("/referrals/link-config")
async def get_link_configuration(request: Request):
    """Get referral link configuration for the shop"""
    try:
        shop_domain = get_shop_domain(request)
        config = referral_service.get_link_config(shop_domain)
        return {"success": True, "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/referrals/link-config")
async def update_link_configuration(
    update_data: UpdateLinkConfigRequest,
    request: Request
):
    """Update referral link configuration"""
    try:
        shop_domain = get_shop_domain(request)
        config = referral_service.update_link_config(shop_domain, update_data)
        return {"success": True, "config": config}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/referrals/social-config")
async def get_social_configuration(request: Request):
    """Get social sharing configuration for the shop"""
    try:
        shop_domain = get_shop_domain(request)
        config = referral_service.get_social_config(shop_domain)
        return {"success": True, "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/referrals/social-config")
async def update_social_configuration(
    update_data: UpdateSocialConfigRequest,
    request: Request
):
    """Update social sharing configuration"""
    try:
        shop_domain = get_shop_domain(request)
        config = referral_service.update_social_config(shop_domain, update_data)
        return {"success": True, "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/referrals/create-link")
async def create_referral_link(
    link_request: CreateReferralLinkRequest,
    request: Request
) -> ReferralLinkResponse:
    """Create a new referral link for a customer"""
    try:
        shop_domain = get_shop_domain(request)
        referral_link = referral_service.create_referral_link(shop_domain, link_request)
        return ReferralLinkResponse(success=True, referral_link=referral_link)
    except Exception as e:
        return ReferralLinkResponse(success=False, error=str(e))

@app.get("/referrals/customer/{customer_id}")
async def get_customer_referral_links(
    customer_id: str,
    request: Request
):
    """Get all referral links for a specific customer"""
    try:
        shop_domain = get_shop_domain(request)
        links = referral_service.get_referral_links_by_customer(shop_domain, customer_id)
        return {"success": True, "links": links}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/referrals/sharing-message/{link_id}")
async def get_sharing_message(
    link_id: str,
    platform: SocialPlatform,
    request: Request
):
    """Get platform-specific sharing message for a referral link"""
    try:
        shop_domain = get_shop_domain(request)
        
        # Find the referral link
        if link_id not in referral_service.referral_links:
            raise HTTPException(status_code=404, detail="Referral link not found")
        
        referral_link = referral_service.referral_links[link_id]
        message = referral_service.get_sharing_message(shop_domain, platform, referral_link)
        
        return {"success": True, "message": message, "platform": platform}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/referrals/track-click")
async def track_referral_click(
    referral_code: str,
    request: Request,
    utm_source: Optional[str] = None,
    utm_medium: Optional[str] = None,
    utm_campaign: Optional[str] = None
):
    """Track a referral link click"""
    try:
        # Get client info
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        click = referral_service.track_referral_click(
            referral_code, ip_address, user_agent, utm_source, utm_medium, utm_campaign
        )
        
        if not click:
            raise HTTPException(status_code=404, detail="Invalid referral code")
        
        return {"success": True, "click_id": click.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/referrals/mark-conversion")
async def mark_referral_conversion(
    referral_code: str,
    order_id: str,
    order_value: float,
    request: Request
):
    """Mark a referral as converted (purchase made)"""
    try:
        success = referral_service.mark_conversion(referral_code, order_id, order_value)
        
        if not success:
            raise HTTPException(status_code=404, detail="Referral code not found")
        
        return {"success": True, "message": "Conversion tracked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/referrals/analytics")
async def get_referral_analytics(
    request: Request,
    days: int = 30
) -> AnalyticsResponse:
    """Get referral analytics for the past N days"""
    try:
        shop_domain = get_shop_domain(request)
        analytics = referral_service.get_analytics(shop_domain, days)
        return AnalyticsResponse(success=True, analytics=analytics)
    except Exception as e:
        return AnalyticsResponse(success=False, error=str(e))

@app.delete("/referrals/link/{link_id}")
async def deactivate_referral_link(
    link_id: str,
    request: Request
):
    """Deactivate a referral link"""
    try:
        success = referral_service.deactivate_referral_link(link_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Referral link not found")
        
        return {"success": True, "message": "Referral link deactivated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/referrals/validate/{referral_code}")
async def validate_referral_code(referral_code: str):
    """Validate if a referral code is valid and active"""
    try:
        is_valid = referral_service.validate_referral_code(referral_code)
        return {"success": True, "valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
