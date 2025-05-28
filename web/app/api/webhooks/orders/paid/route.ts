/**
 * Orders/Paid Webhook Route
 * Handles Shopify orders/paid webhook events
 */

import { OrdersPaidHandler } from '../../../../../lib/webhooks/handlers/orders-paid';

const handler = new OrdersPaidHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'orders/paid',
      status: 'ready',
      description: 'Processes paid orders to award loyalty points',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
