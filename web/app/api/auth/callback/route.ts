import { storeSession } from "@/lib/db/session-storage";
import { AppInstallations } from "@/lib/db/app-installations";
import shopify from "@/lib/shopify/initialize-context";
import { registerWebhooks } from "@/lib/shopify/register-webhooks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [OAuth Callback] Starting OAuth callback process');
    console.log('🔍 [OAuth Callback] Request URL:', request.url);

    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: NextResponse,
    });

    const { session } = callbackResponse;
    console.log('🔍 [OAuth Callback] Received session from Shopify:', {
      id: session?.id,
      shop: session?.shop,
      isOnline: session?.isOnline,
      hasAccessToken: !!session?.accessToken,
      scope: session?.scope,
      expires: session?.expires
    });

    if (!session) {
      console.log('❌ [OAuth Callback] No session found in callback response');
      return NextResponse.json({ error: "No session found" }, { status: 400 });
    }

    if (!session.accessToken) {
      console.log('❌ [OAuth Callback] Session has no access token');
      return NextResponse.json({ error: "No access token in session" }, { status: 400 });
    }

    // Store the session in the database
    console.log('🔍 [OAuth Callback] Attempting to store session in database...');
    try {
      await storeSession(session);
      console.log('✅ [OAuth Callback] Session stored successfully');
    } catch (storeError) {
      console.error('❌ [OAuth Callback] Failed to store session:', storeError);
      throw storeError;
    }

    // Register webhooks for this app installation
    console.log('🔍 [OAuth Callback] Attempting to register webhooks...');
    try {
      await registerWebhooks(session);
      console.log('✅ [OAuth Callback] Webhooks registered successfully');
    } catch (webhookError) {
      console.error('❌ [OAuth Callback] Failed to register webhooks:', webhookError);
      // Don't throw here - webhook registration failure shouldn't break the OAuth flow
    }

    // Construct the app URL with proper parameters
    const { shop } = session;
    const host = Buffer.from(`${shop}/admin`).toString('base64');

    // Redirect to the app with the shop and host parameters
    const appUrl = `/?shop=${shop}&host=${host}`;

    console.log('✅ [OAuth Callback] OAuth flow completed successfully, redirecting to:', appUrl);
    return NextResponse.redirect(new URL(appUrl, request.url));
  } catch (error) {
    console.error("❌ [OAuth Callback] OAuth callback error:", error);
    console.error("❌ [OAuth Callback] Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    // If there's an error, redirect to an error page or back to Shopify
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get("shop");

    if (shop) {
      console.log(`❌ [OAuth Callback] Redirecting back to Shopify admin for shop: ${shop}`);
      return NextResponse.redirect(`https://${shop}/admin`);
    }

    console.log('❌ [OAuth Callback] No shop found, returning error response');
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}