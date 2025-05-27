import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8004";

/**
 * GET /api/referrals/link-config
 * Proxy to backend referral link config endpoint
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`Proxying to: ${BACKEND_URL}/referrals/link-config`);

    const response = await fetch(`${BACKEND_URL}/referrals/link-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com', // Add shop domain header
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error proxying to backend:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to backend",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals/link-config
 * Update referral link configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/referrals/link-config`, {
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
    console.error("Error updating referral config:", error);
    return NextResponse.json(
      { error: "Failed to update referral configuration" },
      { status: 500 }
    );
  }
}
