import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * GET /api/loyalty/profiles/[customerId]
 * Fetch customer loyalty profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;
    
    const response = await fetch(`${BACKEND_URL}/loyalty/profiles/${customerId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error("Error fetching loyalty profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty profile" },
      { status: 500 }
    );
  }
}
