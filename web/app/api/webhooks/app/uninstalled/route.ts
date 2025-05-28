/**
 * App/Uninstalled Webhook Route
 * Handles Shopify app/uninstalled webhook events
 */

import { AppUninstalledHandler } from '../../../../../lib/webhooks/handlers/compliance';

const handler = new AppUninstalledHandler();

export async function POST(request: Request) {
  return handler.handle(request);
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'app/uninstalled',
      status: 'ready',
      description: 'Handles app uninstallation cleanup',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
