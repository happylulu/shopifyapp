/**
 * Orders/Paid Webhook Route
 * Forwards Shopify orders/paid webhook to backend
 */

import crypto from 'crypto';

// Verify Shopify webhook signature
function verifyWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  
  return hash === signature;
}

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signature = request.headers.get('x-shopify-hmac-sha256');
    if (!verifyWebhook(rawBody, signature)) {
      console.error('[Orders/Paid Webhook] Invalid signature');
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Parse the payload
    const payload = JSON.parse(rawBody);
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    
    console.log(`[Orders/Paid Webhook] Processing order ${payload.id} for shop ${shopDomain}`);
    
    // Forward to backend webhook endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/webhooks/orders/paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': shopDomain || '',
        // Don't forward the HMAC as backend doesn't need to re-verify
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error(`[Orders/Paid Webhook] Backend error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Orders/Paid Webhook] Backend response: ${errorText}`);
      return new Response('Backend processing failed', { status: 500 });
    }
    
    const result = await response.json();
    console.log(`[Orders/Paid Webhook] Success:`, result);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[Orders/Paid Webhook] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      webhook: 'orders/paid',
      status: 'ready',
      backend: process.env.BACKEND_URL || 'http://127.0.0.1:8000',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
