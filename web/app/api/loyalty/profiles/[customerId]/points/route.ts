import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * PUT /api/loyalty/profiles/[customerId]/points
 * Adjust customer points
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/loyalty/profiles/${customerId}/points/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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
    console.error("Error adjusting points:", error);
    return NextResponse.json(
      { error: "Failed to adjust points" },
      { status: 500 }
    );
  }
}
