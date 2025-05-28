/**
 * Customers/Create Webhook Route
 * Handles Shopify customers/create webhook events
 */

import { CustomersCreateHandler } from '../../../../../lib/webhooks/handlers/compliance';

const handler = new CustomersCreateHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'customers/create',
      status: 'ready',
      description: 'Creates initial loyalty profiles for new customers',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
