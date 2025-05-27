import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8002";

/**
 * GET /api/test-backend
 * Test backend connectivity
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`Testing backend connection to: ${BACKEND_URL}`);
    
    // Test basic connectivity
    const response = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Backend not responding: ${response.status}`,
          backend_url: BACKEND_URL,
          status: response.status
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      backend_url: BACKEND_URL,
      backend_response: data,
      message: "Backend connection successful"
    });

  } catch (error) {
    console.error("Backend connection test failed:", error);
    
    return NextResponse.json(
      { 
        error: "Backend connection failed",
        backend_url: BACKEND_URL,
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Make sure the backend server is running on the correct port"
      },
      { status: 503 }
    );
  }
}
