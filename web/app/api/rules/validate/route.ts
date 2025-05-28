import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8004";

/**
 * POST /api/rules/validate
 * Validate a rule without saving it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/rules/validate`, {
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
        { 
          success: false,
          error: `Backend error: ${errorText}`,
          data: {
            valid: false,
            errors: [`Backend validation failed: ${errorText}`],
            warnings: []
          }
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error validating rule:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to validate rule",
        data: {
          valid: false,
          errors: [error instanceof Error ? error.message : "Unknown validation error"],
          warnings: []
        }
      },
      { status: 500 }
    );
  }
}
