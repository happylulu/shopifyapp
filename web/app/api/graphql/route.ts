import { NextRequest, NextResponse } from "next/server";
import shopify from "../../../lib/shopify/initialize-context";
import { findSessionsByShop } from "../../../lib/db/session-storage";

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
  console.log('🔍 [GraphQL API] Request received');

  try {
    // Log request headers
    console.log('🔍 [GraphQL API] Request headers:', {
      'content-type': request.headers.get('content-type'),
      'authorization': request.headers.get('authorization') ? 'Bearer [TOKEN_PRESENT]' : 'NO_AUTH_HEADER',
      'user-agent': request.headers.get('user-agent'),
    });

    const body = await request.json();
    const { query, variables } = body;

    console.log('🔍 [GraphQL API] Parsed request body:');
    console.log('  - Query:', query?.substring(0, 100) + (query?.length > 100 ? '...' : ''));
    console.log('  - Variables:', variables);

    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!sessionToken) {
      console.log('❌ [GraphQL API] No session token provided, falling back to mock data');

      // For development without authentication, return mock data for shop queries
      if (query && (query.includes('shop') || query.includes('getShop'))) {
        const response = {
          data: {
            shop: {
              name: "Development Store (Mock Data)"
            }
          }
        };
        console.log('✅ [GraphQL API] Returning mock shop response:', response);
        return NextResponse.json(response);
      }

      return NextResponse.json({
        errors: [{
          message: "Authentication required for non-shop queries",
          extensions: { code: "UNAUTHENTICATED" }
        }]
      }, { status: 401 });
    }

    console.log('🔍 [GraphQL API] Session token found:', sessionToken.substring(0, 20) + '...');

    // Check if this is a mock token (for development)
    if (sessionToken.includes('mock-signature') || sessionToken.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXNob3AiLCJpYXQiOjE2MzQ1Njc4OTB9')) {
      console.log('🔍 [GraphQL API] Mock token detected, returning mock data');

      // For development with mock token, return mock data
      if (query && (query.includes('shop') || query.includes('getShop'))) {
        const response = {
          data: {
            shop: {
              name: "Development Store (Mock Data)"
            }
          }
        };
        console.log('✅ [GraphQL API] Returning mock shop response for mock token:', response);
        return NextResponse.json(response);
      }

      // For other queries with mock token, return mock data or error
      return NextResponse.json({
        errors: [{
          message: "Mock environment: Only shop queries are supported",
          extensions: { code: "MOCK_ENVIRONMENT" }
        }]
      }, { status: 400 });
    }

    // Handle real Shopify session tokens
    console.log('🔍 [GraphQL API] Real session token detected, attempting to get Shopify session');

    // Get Shopify session using the token
    let shopifySession;
    try {
      // Decode the session token to get shop information
      const payload = await shopify.session.decodeSessionToken(sessionToken);
      const shop = payload.dest.replace("https://", "");

      console.log('🔍 [GraphQL API] Decoded shop:', shop);

      // Find an offline session for this shop (offline sessions have long-lived access tokens)
      const sessions = await findSessionsByShop(shop);
      shopifySession = sessions.find((s: any) => !s.isOnline && s.accessToken);

      if (!shopifySession || !shopifySession.accessToken) {
        console.log('❌ [GraphQL API] No valid offline session found for shop:', shop);
        return NextResponse.json({
          errors: [{
            message: "No valid session found for shop",
            extensions: { code: "SESSION_NOT_FOUND", shop }
          }]
        }, { status: 401 });
      }

      console.log('✅ [GraphQL API] Found valid Shopify session for shop:', shop);

    } catch (error) {
      console.error('❌ [GraphQL API] Session validation error:', error);
      return NextResponse.json({
        errors: [{
          message: "Invalid session token",
          extensions: { code: "INVALID_SESSION_TOKEN" }
        }]
      }, { status: 401 });
    }

    // Create Shopify GraphQL client and make the request
    console.log('🔍 [GraphQL API] Creating Shopify GraphQL client');
    const client = new shopify.clients.Graphql({ session: shopifySession });

    console.log('🔍 [GraphQL API] Making request to Shopify GraphQL API');
    const response = await client.request(query, { variables });

    console.log('✅ [GraphQL API] Received response from Shopify:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ [GraphQL API] Exception occurred:", error);

    // Handle Shopify API errors specifically
    if (error && typeof error === 'object' && 'response' in error) {
      const shopifyError = error as any;
      if (shopifyError.response && shopifyError.response.errors) {
        console.log('❌ [GraphQL API] Shopify API error:', shopifyError.response.errors);
        return NextResponse.json({
          errors: shopifyError.response.errors
        }, { status: shopifyError.response.status || 400 });
      }
    }

    return NextResponse.json(
      {
        data: null,
        errors: [{
          message: error instanceof Error ? error.message : "Unknown error",
          extensions: {
            code: "INTERNAL_ERROR"
          }
        }]
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
