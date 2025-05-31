import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * GET /api/rules
 * List all rules
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const event_type = searchParams.get('event_type');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (event_type) params.append('event_type', event_type);
    params.append('limit', limit);
    params.append('offset', offset);

    const response = await fetch(`${BACKEND_URL}/rules/?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { 
          success: false,
          error: `Backend error: ${errorText}`,
          data: { rules: [], total: 0 }
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch rules",
        details: error instanceof Error ? error.message : "Unknown error",
        data: { rules: [], total: 0 }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules
 * Create a new rule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/rules/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com',
        'X-User-ID': 'admin',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          success: false,
          error: `Backend error: ${errorText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create rule",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
