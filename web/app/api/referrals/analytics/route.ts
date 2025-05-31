import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * GET /api/referrals/analytics
 * Get referral analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';

    const response = await fetch(`${BACKEND_URL}/referrals/analytics?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      // If backend fails, return mock data
      console.warn(`Backend failed (${response.status}), returning mock data`);
      return NextResponse.json({
        success: true,
        data: {
          total_links: 5,
          total_clicks: 127,
          total_conversions: 23,
          conversion_rate: 18.1,
          total_revenue: 2450.00,
          total_points_awarded: 1150,
          recent_activity: [
            {
              date: new Date().toISOString().split('T')[0],
              clicks: 12,
              conversions: 3,
              revenue: 185.50
            }
          ]
        },
        mock: true
      });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching referral analytics:", error);

    // Return mock data on error
    return NextResponse.json({
      success: true,
      data: {
        total_links: 0,
        total_clicks: 0,
        total_conversions: 0,
        conversion_rate: 0,
        total_revenue: 0,
        total_points_awarded: 0,
        recent_activity: []
      },
      mock: true,
      error: "Backend unavailable, showing mock data"
    });
  }
}
