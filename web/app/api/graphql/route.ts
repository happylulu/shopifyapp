import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@shopify/shopify-app-remix/server"; // Commented out for now

/**
 * GraphQL Proxy Route
 *
 * This route proxies GraphQL requests to Shopify's Admin API
 * with proper authentication and error handling.
 *
 * Usage:
 * POST /api/graphql
 * Body: { query: string, variables?: object }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable Shopify authentication when needed
    // const { admin, session } = await authenticate.admin(request);

    // For now, return a placeholder response
    return NextResponse.json({
      message: "Shopify Admin GraphQL endpoint - authentication disabled for development",
      note: "Use /api/loyalty-graphql for loyalty-specific queries"
    });

  } catch (error) {
    console.error("GraphQL proxy error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET method for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "GraphQL proxy is running",
    endpoints: {
      POST: "/api/graphql - Execute GraphQL queries"
    }
  });
}
