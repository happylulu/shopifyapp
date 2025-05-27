import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8002";

/**
 * GET /api/referrals/social-config
 * Get social sharing configuration
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/referrals/social-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      // If backend fails, return mock data
      console.warn(`Backend failed (${response.status}), returning mock social config`);
      return NextResponse.json({
        success: true,
        config: {
          facebook_enabled: true,
          twitter_enabled: true,
          instagram_enabled: false,
          email_enabled: true,
          sms_enabled: false,
          custom_message: "Check out this amazing store! Use my referral link to get 15% off your first order.",
          facebook_message: "🛍️ Found an amazing store! Get 15% off with my referral link:",
          twitter_message: "Just discovered this great store! Get 15% off your first order:",
          email_subject: "Get 15% off at this amazing store!",
          email_message: "Hi! I wanted to share this great store I found. Use my referral link to get 15% off your first order!"
        },
        mock: true
      });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching social config:", error);
    
    // Return mock data on error
    return NextResponse.json({
      success: true,
      config: {
        facebook_enabled: true,
        twitter_enabled: true,
        instagram_enabled: false,
        email_enabled: true,
        sms_enabled: false,
        custom_message: "Check out this amazing store!",
        facebook_message: "🛍️ Found an amazing store!",
        twitter_message: "Just discovered this great store!",
        email_subject: "Get 15% off at this amazing store!",
        email_message: "Hi! I wanted to share this great store I found."
      },
      mock: true,
      error: "Backend unavailable, showing mock data"
    });
  }
}

/**
 * POST /api/referrals/social-config
 * Update social sharing configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/referrals/social-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error updating social config:", error);
    return NextResponse.json(
      { error: "Failed to update social configuration" },
      { status: 500 }
    );
  }
}
