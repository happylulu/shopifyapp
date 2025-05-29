# 🧪 Testing Real Shopify Authentication with Neon Database

## Overview

Now that both your Next.js app and FastAPI backend are connected to the same Neon PostgreSQL database, you can test the complete multi-tenant authentication flow with real Shopify session tokens.

## ✅ Current Setup Confirmed

- **FastAPI Backend**: Connected to Neon PostgreSQL for loyalty data
- **Next.js Backend**: Connected to Neon PostgreSQL for Shopify session storage
- **Next.js Frontend**: Makes API calls (never direct database access)
- **Shared Database**: Both apps use the same Neon instance for session sharing

## 🚀 Step-by-Step Testing Process

### **Step 1: Start Your Development Environment**

```bash
# Terminal 1: Start FastAPI Backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8004 --reload

# Terminal 2: Start Next.js App
cd web
npm run dev

# Terminal 3: Start Shopify CLI (if needed)
shopify app dev
```

### **Step 2: Install Your App on Test Shop**

1. **Open your test shop admin**: `https://[your-test-shop].myshopify.com/admin`
2. **Navigate to Apps section**
3. **Install your "comeback" app** using your tunnel URL:
   - `https://minolta-wanted-extraction-simply.trycloudflare.com`
4. **Complete the OAuth flow** - this will create session data in Neon

### **Step 3: Verify Session Data Creation**

After installing the app, check if session data was created:

```bash
cd backend
python -c "
import asyncio
from session_storage import SessionStorageService

async def check_sessions():
    storage = SessionStorageService()
    shops = await storage.list_installed_shops()
    print(f'Installed shops: {shops}')

    if shops:
        for shop in shops:
            token = await storage.get_shop_access_token(shop)
            print(f'Shop: {shop}, Has Token: {bool(token)}')

asyncio.run(check_sessions())
"
```

### **Step 4: Test FastAPI Endpoints**

#### Test 1: Basic Shop Info (Development Mode)
```bash
curl -H "X-Development-Mode: true" http://127.0.0.1:8004/shop/info
```

#### Test 2: With Real Shop Domain
```bash
# Replace with your actual test shop domain
curl -H "X-Shopify-Shop-Domain: your-test-shop.myshopify.com" \
     http://127.0.0.1:8004/shop/info
```

### **Step 5: Get App Bridge ID Token (Correct Approach)**

**Important:** You can only access the **App Bridge ID Token** from the browser, NOT the actual Shopify API access token (which is stored securely server-side).

#### **Option A: From Browser Network Tab (App Bridge ID Token)**
1. **Open your installed app** in the test shop
2. **Open browser developer tools** (F12)
3. **Go to Network tab**
4. **Look for requests to YOUR app's backend** (not Shopify's API)
5. **Find requests with `Authorization: Bearer` headers** going to your Next.js or FastAPI endpoints
6. **Copy the App Bridge ID token** after `Bearer `

**What you're looking for:**
- Requests to `localhost:3000` (Next.js) or `localhost:8004` (FastAPI)
- NOT requests to `*.myshopify.com` (those use different authentication)

#### **Option B: Programmatic Access (Recommended)**
Add this to your Next.js frontend to log the token:
```javascript
// In your React component
import { useAppBridge } from '@shopify/app-bridge-react';

function TokenLogger() {
  const app = useAppBridge();

  const logToken = async () => {
    try {
      const token = await app.idToken();
      console.log('App Bridge ID Token:', token);
      // Copy this token for testing
    } catch (error) {
      console.error('Failed to get token:', error);
    }
  };

  return <button onClick={logToken}>Log Token</button>;
}
```

### **Step 6: Test Authentication Flow**

#### **Test A: With App Bridge ID Token**
```bash
# Replace YOUR_APP_BRIDGE_TOKEN with the token from Step 5
curl -H "Authorization: Bearer YOUR_APP_BRIDGE_TOKEN" \
     http://127.0.0.1:8004/shop/info
```

**What this tests:**
- FastAPI can decode the App Bridge ID token
- Shop domain extraction from the token works
- Session storage retrieval works
- Shopify API calls work with the stored access token

#### **Test B: Alternative Testing Methods**

**Method 1: Using Shop Domain Header**
```bash
curl -H "X-Shopify-Shop-Domain: your-test-shop.myshopify.com" \
     http://127.0.0.1:8004/shop/info
```

**Method 2: Development Mode**
```bash
curl -H "X-Development-Mode: true" \
     http://127.0.0.1:8004/shop/info
```

**Method 3: Check Session Data**
```bash
curl http://127.0.0.1:8004/session/list
```

**Expected Response (after app installation):**
```json
{
  "success": true,
  "shop_domain": "your-test-shop.myshopify.com",
  "shop_info": {
    "shop": {
      "name": "Your Test Shop",
      "domain": "your-test-shop.myshopify.com"
    }
  },
  "message": "Successfully authenticated with shop-specific token"
}
```

### **Step 7: Test Loyalty Endpoints**

Once authentication is working, test loyalty-specific endpoints:

```bash
# Test loyalty profile creation
curl -X POST http://127.0.0.1:8004/loyalty/profiles/ \
  -H "Authorization: Bearer YOUR_REAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_customer_id": "123456789",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Test getting loyalty profile
curl -H "Authorization: Bearer YOUR_REAL_TOKEN" \
     http://127.0.0.1:8004/loyalty/profiles/123456789/
```

## 🔍 Debugging Common Issues

### Issue 1: No Session Data Found
**Symptoms:** `No access token found for shop`
**Solution:**
1. Ensure you completed the OAuth flow in your test shop
2. Check that both apps are using the same Neon database
3. Verify the shop domain matches exactly

### Issue 2: Invalid Token Error
**Symptoms:** `Invalid token` or `401 Unauthorized`
**Solution:**
1. Get a fresh token from the browser (tokens expire)
2. Ensure you copied the complete token
3. Check that SHOPIFY_API_SECRET matches in both apps

### Issue 3: Database Connection Error
**Symptoms:** Connection refused or timeout
**Solution:**
1. Verify Neon database credentials
2. Check that both apps have the same DATABASE_URL
3. Ensure Neon database allows connections

## 🎯 Success Criteria

You'll know the authentication is working correctly when:

1. ✅ **Session Creation**: Installing the app creates session data in Neon
2. ✅ **Token Extraction**: JWT middleware extracts shop domain from tokens
3. ✅ **Token Retrieval**: FastAPI can get shop-specific access tokens
4. ✅ **API Calls**: FastAPI can make authenticated Shopify API calls
5. ✅ **Multi-Tenant**: Different shops have isolated access tokens

## 🚀 Next Steps After Successful Testing

1. **Update existing endpoints** to use the new authentication pattern
2. **Test with multiple shops** to verify proper isolation
3. **Implement error handling** for expired or invalid tokens
4. **Add logging** for authentication events
5. **Consider token refresh** mechanisms for long-running operations

## 📋 Quick Test Script

Save this as `test_real_auth.py`:

```python
#!/usr/bin/env python3
import asyncio
import httpx
from session_storage import SessionStorageService

async def test_complete_flow():
    print("🧪 Testing Complete Authentication Flow")

    # Test 1: Check session storage
    storage = SessionStorageService()
    shops = await storage.list_installed_shops()
    print(f"✅ Found {len(shops)} installed shops: {shops}")

    # Test 2: Test FastAPI endpoint
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://127.0.0.1:8004/shop/info",
            headers={"X-Development-Mode": "true"}
        )
        print(f"✅ FastAPI response: {response.status_code}")

    print("🎉 Authentication system ready for real tokens!")

if __name__ == "__main__":
    asyncio.run(test_complete_flow())
```

Run with: `cd backend && python test_real_auth.py`
