import shopify from "@/lib/shopify/initialize-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  console.log('🔍 [OAuth Begin] Starting OAuth begin process');
  console.log('🔍 [OAuth Begin] Request URL:', request.url);
  console.log('🔍 [OAuth Begin] Shop parameter:', shop);

  if (!shop) {
    console.log('❌ [OAuth Begin] Missing shop parameter');
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  try {
    console.log('🔍 [OAuth Begin] Attempting to start OAuth flow for shop:', shop);

    // Start the OAuth flow
    const authResponse = await shopify.auth.begin({
      shop,
      callbackPath: "/api/auth/callback",
      isOnline: false,
      rawRequest: request,
      rawResponse: NextResponse,
    });

    console.log('✅ [OAuth Begin] OAuth flow started, auth response:', authResponse);

    // The auth.begin() method returns a Response object, not a URL string
    return authResponse;
  } catch (error) {
    console.error("❌ [OAuth Begin] OAuth begin error:", error);
    console.error("❌ [OAuth Begin] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json({
      error: "Failed to begin OAuth",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 