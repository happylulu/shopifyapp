/**
 * Refunds/Create Webhook Route
 * Handles Shopify refunds/create webhook events
 */

import { RefundsCreateHandler } from '../../../../../lib/webhooks/handlers/refunds-create';

const handler = new RefundsCreateHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'refunds/create',
      status: 'ready',
      description: 'Processes refunds to deduct loyalty points',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
