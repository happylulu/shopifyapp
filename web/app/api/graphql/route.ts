import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@shopify/shopify-app-remix/server";

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
    // Authenticate the request
    const { admin, session } = await authenticate.admin(request);
    
    if (!admin || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: "GraphQL query is required" },
        { status: 400 }
      );
    }

    // Execute the GraphQL query
    const response = await admin.graphql(query, { variables });
    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors && data.errors.length > 0) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { 
          error: "GraphQL query failed",
          details: data.errors 
        },
        { status: 400 }
      );
    }

    // Return successful response
    return NextResponse.json(data);

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
