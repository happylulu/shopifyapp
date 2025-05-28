/**
 * Webhook Signature Verification
 * Implements secure HMAC-SHA256 verification for Shopify webhooks
 */

import crypto from 'crypto';

/**
 * Verify Shopify webhook signature
 * @param rawBody - Raw request body as string
 * @param signature - X-Shopify-Hmac-Sha256 header value
 * @param secret - Webhook secret from environment
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Extract and validate webhook headers
 * @param headers - Request headers
 * @returns Validated webhook headers or null if invalid
 */
export function extractWebhookHeaders(headers: Headers) {
  const topic = headers.get('x-shopify-topic');
  const signature = headers.get('x-shopify-hmac-sha256');
  const shop = headers.get('x-shopify-shop-domain');
  const webhookId = headers.get('x-shopify-webhook-id');
  const apiVersion = headers.get('x-shopify-api-version');

  if (!topic || !signature || !shop) {
    return null;
  }

  return {
    topic,
    signature,
    shop,
    webhookId,
    apiVersion,
  };
}

/**
 * Webhook verification middleware
 * @param rawBody - Raw request body
 * @param headers - Request headers
 * @returns Verification result with extracted data
 */
export function verifyWebhook(rawBody: string, headers: Headers) {
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('SHOPIFY_WEBHOOK_SECRET environment variable is required');
  }

  const webhookHeaders = extractWebhookHeaders(headers);
  
  if (!webhookHeaders) {
    return {
      isValid: false,
      error: 'Missing required webhook headers',
      headers: null,
    };
  }

  const isValid = verifyWebhookSignature(
    rawBody,
    webhookHeaders.signature,
    webhookSecret
  );

  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid webhook signature',
      headers: webhookHeaders,
    };
  }

  return {
    isValid: true,
    error: null,
    headers: webhookHeaders,
  };
}

/**
 * Webhook processing result interface
 */
export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Create standardized webhook response
 */
export function createWebhookResponse(
  result: WebhookProcessingResult,
  statusCode: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Idempotency key generator for webhook processing
 * @param webhookId - Shopify webhook ID
 * @param topic - Webhook topic
 * @param shop - Shop domain
 * @returns Unique idempotency key
 */
export function generateIdempotencyKey(
  webhookId: string,
  topic: string,
  shop: string
): string {
  return `webhook_${topic}_${shop}_${webhookId}`;
}

/**
 * Simple in-memory idempotency cache
 * In production, use Redis or database
 */
const processedWebhooks = new Set<string>();

/**
 * Check if webhook has already been processed
 * @param idempotencyKey - Unique key for this webhook
 * @returns true if already processed
 */
export function isWebhookProcessed(idempotencyKey: string): boolean {
  return processedWebhooks.has(idempotencyKey);
}

/**
 * Mark webhook as processed
 * @param idempotencyKey - Unique key for this webhook
 */
export function markWebhookProcessed(idempotencyKey: string): void {
  processedWebhooks.add(idempotencyKey);
  
  // Clean up old entries (keep last 1000)
  if (processedWebhooks.size > 1000) {
    const entries = Array.from(processedWebhooks);
    processedWebhooks.clear();
    entries.slice(-500).forEach(key => processedWebhooks.add(key));
  }
}
