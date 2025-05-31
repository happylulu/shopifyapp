import { DeliveryMethod, Session } from "@shopify/shopify-api";
import { setupGDPRWebHooks } from "./gdpr";
import shopify from "./initialize-context";
import { AppInstallations } from "../db/app-installations";

let webhooksInitialized = false;

export function addHandlers() {
  if (!webhooksInitialized) {
    setupGDPRWebHooks("/api/webhooks");
    shopify.webhooks.addHandlers({
      ["APP_UNINSTALLED"]: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (_topic, shop, _body) => {
          console.log("Uninstalled app from shop: " + shop);
          await AppInstallations.delete(shop);
        },
      },
    });
    console.log("Added handlers");
    webhooksInitialized = true;
  } else {
    console.log("Handlers already added");
  }
}

export async function registerWebhooks(session: Session) {
  try {
    console.log('🔍 [Webhook Registration] Starting webhook registration for shop:', session.shop);
    console.log('🔍 [Webhook Registration] Session scopes:', session.scope);

    addHandlers();

    console.log('🔍 [Webhook Registration] Attempting to register webhooks...');
    const responses = await shopify.webhooks.register({ session });

    console.log('✅ [Webhook Registration] Webhook registration responses:', JSON.stringify(responses, null, 2));

    // Check for any failed registrations
    const failedWebhooks = Object.entries(responses).filter(([_, response]) => !response.success);
    if (failedWebhooks.length > 0) {
      console.log('⚠️ [Webhook Registration] Some webhooks failed to register:', failedWebhooks);
    } else {
      console.log('✅ [Webhook Registration] All webhooks registered successfully');
    }

    return responses;
  } catch (error) {
    console.error('❌ [Webhook Registration] Failed to register webhooks:', error);

    // Log more details about the error
    if (error && typeof error === 'object' && 'response' in error) {
      const shopifyError = error as any;
      console.error('❌ [Webhook Registration] Shopify API error details:', {
        status: shopifyError.response?.code || shopifyError.response?.status,
        statusText: shopifyError.response?.statusText,
        body: shopifyError.response?.body,
        headers: shopifyError.response?.headers
      });
    }

    // Don't throw the error - webhook registration failure shouldn't break the OAuth flow
    console.log('⚠️ [Webhook Registration] Continuing OAuth flow despite webhook registration failure');
    return {};
  }
}
