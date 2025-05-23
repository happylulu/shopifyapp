import shopify from "@/lib/shopify/initialize-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  try {
    // Start the OAuth flow
    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: "/api/auth/callback",
      isOnline: false,
      rawRequest: request,
      rawResponse: NextResponse,
    });

    return NextResponse.redirect(authRoute);
  } catch (error) {
    console.error("OAuth begin error:", error);
    return NextResponse.json({ error: "Failed to begin OAuth" }, { status: 500 });
  }
} 