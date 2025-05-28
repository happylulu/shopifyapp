/**
 * Base Webhook Handler
 * Provides common functionality for all webhook handlers
 */

import {
  verifyWebhook,
  createWebhookResponse,
  generateIdempotencyKey,
  isWebhookProcessed,
  markWebhookProcessed,
  type WebhookProcessingResult,
} from './verify-signature';

export interface WebhookPayload {
  [key: string]: any;
}

export interface WebhookContext {
  topic: string;
  shop: string;
  webhookId: string;
  apiVersion: string;
  payload: WebhookPayload;
  idempotencyKey: string;
}

export abstract class BaseWebhookHandler {
  protected topic: string;

  constructor(topic: string) {
    this.topic = topic;
  }

  /**
   * Abstract method that each webhook handler must implement
   */
  abstract processWebhook(context: WebhookContext): Promise<WebhookProcessingResult>;

  /**
   * Handle incoming webhook request
   */
  async handle(request: Request): Promise<Response> {
    try {
      // Get raw body for signature verification
      const rawBody = await request.text();
      
      // Verify webhook signature and extract headers
      const verification = verifyWebhook(rawBody, request.headers);
      
      if (!verification.isValid) {
        console.error(`Webhook verification failed: ${verification.error}`);
        return createWebhookResponse(
          {
            success: false,
            message: 'Webhook verification failed',
            error: verification.error || 'Invalid signature',
          },
          401
        );
      }

      const { headers } = verification;
      if (!headers) {
        return createWebhookResponse(
          {
            success: false,
            message: 'Missing webhook headers',
          },
          400
        );
      }

      // Verify topic matches handler
      if (headers.topic !== this.topic) {
        return createWebhookResponse(
          {
            success: false,
            message: `Topic mismatch. Expected ${this.topic}, got ${headers.topic}`,
          },
          400
        );
      }

      // Parse payload
      let payload: WebhookPayload;
      try {
        payload = JSON.parse(rawBody);
      } catch (error) {
        return createWebhookResponse(
          {
            success: false,
            message: 'Invalid JSON payload',
            error: error instanceof Error ? error.message : 'Unknown parsing error',
          },
          400
        );
      }

      // Generate idempotency key
      const idempotencyKey = generateIdempotencyKey(
        headers.webhookId || 'unknown',
        headers.topic,
        headers.shop
      );

      // Check for duplicate processing
      if (isWebhookProcessed(idempotencyKey)) {
        console.log(`Webhook already processed: ${idempotencyKey}`);
        return createWebhookResponse({
          success: true,
          message: 'Webhook already processed (idempotent)',
        });
      }

      // Create webhook context
      const context: WebhookContext = {
        topic: headers.topic,
        shop: headers.shop,
        webhookId: headers.webhookId || 'unknown',
        apiVersion: headers.apiVersion || 'unknown',
        payload,
        idempotencyKey,
      };

      // Process webhook
      const result = await this.processWebhook(context);

      // Mark as processed if successful
      if (result.success) {
        markWebhookProcessed(idempotencyKey);
      }

      // Log processing result
      console.log(`Webhook ${this.topic} processed:`, {
        shop: context.shop,
        success: result.success,
        message: result.message,
      });

      return createWebhookResponse(result);

    } catch (error) {
      console.error(`Webhook ${this.topic} processing error:`, error);
      
      return createWebhookResponse(
        {
          success: false,
          message: 'Internal webhook processing error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }

  /**
   * Helper method to call loyalty service API
   */
  protected async callLoyaltyAPI(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    data?: any
  ): Promise<any> {
    const loyaltyApiUrl = process.env.LOYALTY_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${loyaltyApiUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.LOYALTY_API_KEY || 'dev-key',
        },
        ...(data && { body: JSON.stringify(data) }),
      });

      if (!response.ok) {
        throw new Error(`Loyalty API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Loyalty API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to extract customer information from payload
   */
  protected extractCustomerInfo(payload: WebhookPayload): {
    customerId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } {
    // Handle different payload structures
    const customer = payload.customer || payload;
    
    return {
      customerId: customer.id?.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
    };
  }

  /**
   * Helper method to extract order information from payload
   */
  protected extractOrderInfo(payload: WebhookPayload): {
    orderId?: string;
    orderNumber?: string;
    totalPrice?: number;
    currency?: string;
    customerId?: string;
    lineItems?: any[];
  } {
    return {
      orderId: payload.id?.toString(),
      orderNumber: payload.order_number?.toString() || payload.name,
      totalPrice: parseFloat(payload.total_price || '0'),
      currency: payload.currency || 'USD',
      customerId: payload.customer?.id?.toString(),
      lineItems: payload.line_items || [],
    };
  }

  /**
   * Helper method to validate required fields
   */
  protected validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(field => !data[field]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }
}
