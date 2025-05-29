#!/usr/bin/env node
/**
 * Webhook Testing Script
 * Tests all webhook endpoints with sample data
 */

const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:3001';
const WEBHOOK_SECRET = 'test-webhook-secret';
const SHOP_DOMAIN = 'test-shop.myshopify.com';

// Generate webhook signature
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
}

// Send webhook request
async function sendWebhook(topic, payload) {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, WEBHOOK_SECRET);
  
  const endpointMap = {
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

  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Topic': topic,
        'X-Shopify-Hmac-Sha256': signature,
        'X-Shopify-Shop-Domain': SHOP_DOMAIN,
        'X-Shopify-Webhook-Id': `test-${Date.now()}`,
        'X-Shopify-Api-Version': '2025-04',
      },
      body: payloadString,
    });

    const result = await response.json();
    
    return {
      topic,
      status: response.status,
      success: response.ok,
      message: result.message,
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return {
      topic,
      status: 0,
      success: false,
      message: 'Network error',
      error: error.message,
    };
  }
}

// Test payloads
const testPayloads = {
  'orders/paid': {
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

  'refunds/create': {
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

  'customers/create': {
    id: 67890,
    email: "newcustomer@example.com",
    first_name: "Jane",
    last_name: "Smith",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: "",
    phone: "+1234567890"
  },

  'customers/redact': {
    customer: {
      id: 67890,
      email: "customer@example.com"
    },
    orders_to_redact: [12345, 12346]
  },

  'customers/data_request': {
    customer: {
      id: 67890,
      email: "customer@example.com"
    }
  },

  'shop/redact': {
    shop_id: 98765,
    shop_domain: "test-shop.myshopify.com"
  },

  'app/uninstalled': {
    id: 98765,
    domain: "test-shop.myshopify.com",
    name: "Test Shop"
  }
};

// Main test function
async function runTests() {
  console.log('🧪 Testing Shopify Webhook Handlers');
  console.log('=====================================\n');

  const results = [];

  for (const [topic, payload] of Object.entries(testPayloads)) {
    console.log(`Testing ${topic}...`);
    
    const result = await sendWebhook(topic, payload);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${topic}: ${result.message}`);
    } else {
      console.log(`❌ ${topic}: ${result.message || result.error}`);
    }
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Test Summary');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Successful: ${successful}/${total}`);
  console.log(`Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All webhook tests passed!');
  } else {
    console.log('\n⚠️  Some webhook tests failed. Check the logs above.');
  }

  return results;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, sendWebhook, testPayloads };
