import { storeSession } from "@/lib/db/session-storage";
import { AppInstallations } from "@/lib/db/app-installations";
import shopify from "@/lib/shopify/initialize-context";
import { registerWebhooks } from "@/lib/shopify/register-webhooks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: NextResponse,
    });

    const { session } = callbackResponse;

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 400 });
    }

    // Store the session in the database
    await storeSession(session);

    // Register webhooks for this app installation
    await registerWebhooks(session);

    // Construct the app URL with proper parameters
    const { shop } = session;
    const host = Buffer.from(`${shop}/admin`).toString('base64');
    
    // Redirect to the app with the shop and host parameters
    const appUrl = `/?shop=${shop}&host=${host}`;
    
    return NextResponse.redirect(new URL(appUrl, request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    
    // If there's an error, redirect to an error page or back to Shopify
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get("shop");
    
    if (shop) {
      return NextResponse.redirect(`https://${shop}/admin`);
    }
    
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
  }
} 