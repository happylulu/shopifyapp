/**
 * Customers/Data_Request Webhook Route
 * Handles Shopify customers/data_request webhook events (GDPR compliance)
 */

import { CustomersDataRequestHandler } from '../../../../../lib/webhooks/handlers/compliance';

const handler = new CustomersDataRequestHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'customers/data_request',
      status: 'ready',
      description: 'Handles customer data export requests (GDPR compliance)',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
