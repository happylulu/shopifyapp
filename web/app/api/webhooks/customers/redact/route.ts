/**
 * Customers/Redact Webhook Route
 * Handles Shopify customers/redact webhook events (GDPR compliance)
 */

import { CustomersRedactHandler } from '../../../../../lib/webhooks/handlers/compliance';

const handler = new CustomersRedactHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'customers/redact',
      status: 'ready',
      description: 'Handles customer data deletion requests (GDPR compliance)',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
