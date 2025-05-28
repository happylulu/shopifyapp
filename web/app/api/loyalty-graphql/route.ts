import { NextRequest, NextResponse } from "next/server";

const LOYALTY_GRAPHQL_ENDPOINT = process.env.LOYALTY_GRAPHQL_ENDPOINT || "http://127.0.0.1:8005/graphql";

/**
 * Loyalty GraphQL Proxy Route
 * Proxies GraphQL requests to our loyalty backend server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get authentication headers
    const authHeader = request.headers.get('authorization');
    const shopDomain = request.headers.get('x-shopify-shop-domain') || 'demo.myshopify.com';
    
    // Forward request to loyalty GraphQL server
    const response = await fetch(LOYALTY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': shopDomain,
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Loyalty GraphQL server error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { 
          errors: [{ 
            message: `Loyalty GraphQL server error: ${errorText}`,
            extensions: { code: 'LOYALTY_GRAPHQL_SERVER_ERROR' }
          }]
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Loyalty GraphQL proxy error:", error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: "Failed to process loyalty GraphQL request",
          extensions: { 
            code: 'LOYALTY_PROXY_ERROR',
            details: error instanceof Error ? error.message : "Unknown error"
          }
        }]
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shopify-Shop-Domain',
    },
  });
}

/**
 * GET method for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "Loyalty GraphQL proxy is running",
    endpoint: LOYALTY_GRAPHQL_ENDPOINT,
    methods: {
      POST: "Execute loyalty GraphQL queries"
    }
  });
}
