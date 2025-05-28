/**
 * Shop/Redact Webhook Route
 * Handles Shopify shop/redact webhook events (GDPR compliance)
 */

import { ShopRedactHandler } from '../../../../../lib/webhooks/handlers/compliance';

const handler = new ShopRedactHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'shop/redact',
      status: 'ready',
      description: 'Handles shop data deletion requests (GDPR compliance)',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
