/**
 * Webhook Testing Utility
 * Provides functions to test webhook handlers locally
 */

import crypto from 'crypto';

export interface TestWebhookOptions {
  topic: string;
  payload: any;
  shop: string;
  webhookSecret?: string;
  baseUrl?: string;
}

/**
 * Generate test webhook signature
 */
function generateTestSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
}

/**
 * Send test webhook to local endpoint
 */
export async function sendTestWebhook({
  topic,
  payload,
  shop,
  webhookSecret = 'test-webhook-secret',
  baseUrl = 'http://localhost:3000'
}: TestWebhookOptions): Promise<Response> {
  const payloadString = JSON.stringify(payload);
  const signature = generateTestSignature(payloadString, webhookSecret);
  
  // Map topic to endpoint
  const endpointMap: Record<string, string> = {
    'orders/paid': '/api/webhooks/orders/paid',
    'refunds/create': '/api/webhooks/refunds/create',
    'customers/create': '/api/webhooks/customers/create',
    'customers/redact': '/api/webhooks/customers/redact',
    'customers/data_request': '/api/webhooks/customers/data_request',
    'shop/redact': '/api/webhooks/shop/redact',
    'app/uninstalled': '/api/webhooks/app/uninstalled',
  };

  const endpoint = endpointMap[topic];
  if (!endpoint) {
    throw new Error(`Unknown webhook topic: ${topic}`);
  }

  const url = `${baseUrl}${endpoint}`;
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Topic': topic,
      'X-Shopify-Hmac-Sha256': signature,
      'X-Shopify-Shop-Domain': shop,
      'X-Shopify-Webhook-Id': `test-${Date.now()}`,
      'X-Shopify-Api-Version': '2025-04',
    },
    body: payloadString,
  });
}

/**
 * Test webhook payloads
 */
export const testPayloads = {
  ordersPaid: {
    id: 12345,
    order_number: 1001,
    name: "#1001",
    total_price: "150.00",
    currency: "USD",
    customer: {
      id: 67890,
      email: "customer@example.com",
      first_name: "John",
      last_name: "Doe"
    },
    line_items: [
      {
        id: 1,
        product_id: 123,
        variant_id: 456,
        title: "Test Product",
        quantity: 2,
        price: "75.00",
        product: {
          product_type: "electronics"
        }
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  refundsCreate: {
    id: 54321,
    order_id: 12345,
    total_refunded_amount: "50.00",
    currency: "USD",
    refund_line_items: [
      {
        id: 1,
        line_item_id: 1,
        quantity: 1,
        line_item: {
          id: 1,
          price: "75.00",
          title: "Test Product"
        }
      }
    ],
    created_at: new Date().toISOString()
  },

  customersCreate: {
    id: 67890,
    email: "newcustomer@example.com",
    first_name: "Jane",
    last_name: "Smith",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: "",
    phone: "+1234567890"
  },

  customersRedact: {
    customer: {
      id: 67890,
      email: "customer@example.com"
    },
    orders_to_redact: [12345, 12346]
  },

  customersDataRequest: {
    customer: {
      id: 67890,
      email: "customer@example.com"
    }
  },

  shopRedact: {
    shop_id: 98765,
    shop_domain: "test-shop.myshopify.com"
  },

  appUninstalled: {
    id: 98765,
    domain: "test-shop.myshopify.com",
    name: "Test Shop"
  }
};

/**
 * Run all webhook tests
 */
export async function runWebhookTests(options: {
  shop?: string;
  webhookSecret?: string;
  baseUrl?: string;
} = {}): Promise<void> {
  const {
    shop = 'test-shop.myshopify.com',
    webhookSecret = 'test-webhook-secret',
    baseUrl = 'http://localhost:3000'
  } = options;

  console.log('🧪 Running webhook tests...\n');

  const tests = [
    { topic: 'orders/paid', payload: testPayloads.ordersPaid },
    { topic: 'refunds/create', payload: testPayloads.refundsCreate },
    { topic: 'customers/create', payload: testPayloads.customersCreate },
    { topic: 'customers/redact', payload: testPayloads.customersRedact },
    { topic: 'customers/data_request', payload: testPayloads.customersDataRequest },
    { topic: 'shop/redact', payload: testPayloads.shopRedact },
    { topic: 'app/uninstalled', payload: testPayloads.appUninstalled },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.topic}...`);
      
      const response = await sendTestWebhook({
        topic: test.topic,
        payload: test.payload,
        shop,
        webhookSecret,
        baseUrl,
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${test.topic}: ${result.message}`);
      } else {
        console.log(`❌ ${test.topic}: ${result.message || 'Failed'}`);
      }
    } catch (error) {
      console.log(`❌ ${test.topic}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n🏁 Webhook tests completed!');
}

/**
 * Test individual webhook
 */
export async function testWebhook(
  topic: keyof typeof testPayloads,
  options: Partial<TestWebhookOptions> = {}
): Promise<void> {
  const payload = testPayloads[topic];
  
  if (!payload) {
    throw new Error(`No test payload available for topic: ${topic}`);
  }

  const response = await sendTestWebhook({
    topic,
    payload,
    shop: 'test-shop.myshopify.com',
    webhookSecret: 'test-webhook-secret',
    baseUrl: 'http://localhost:3000',
    ...options,
  });

  const result = await response.json();
  
  console.log(`Webhook ${topic} test result:`, {
    status: response.status,
    success: response.ok,
    message: result.message,
    data: result.data,
  });
}

// CLI interface for testing
if (typeof window === 'undefined' && require.main === module) {
  const topic = process.argv[2] as keyof typeof testPayloads;
  
  if (topic && testPayloads[topic]) {
    testWebhook(topic).catch(console.error);
  } else {
    runWebhookTests().catch(console.error);
  }
}
