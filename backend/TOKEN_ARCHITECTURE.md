# 🔐 Token Architecture in Multi-Tenant Shopify Apps

## Overview

Understanding the different types of tokens in a Shopify app is crucial for proper authentication and security. This document clarifies the token flow and what each token is used for.

## 🎯 Token Types

### 1. **App Bridge ID Token (JWT)**
- **Location**: Frontend (browser accessible)
- **Lifetime**: Short-lived (minutes)
- **Purpose**: Proves the request comes from an authenticated Shopify session
- **Accessible**: ✅ Yes, via browser Network tab or JavaScript
- **Security**: Safe to expose to frontend (limited scope)

### 2. **Shopify API Access Token**
- **Location**: Backend only (server-side storage)
- **Lifetime**: Long-lived (until app uninstalled)
- **Purpose**: Makes actual API calls to Shopify Admin API
- **Accessible**: ❌ No, never exposed to frontend
- **Security**: Highly sensitive, full shop access

## 🔄 Token Flow Architecture

```mermaid
sequenceDiagram
    participant Browser as Browser/Frontend
    participant AppBridge as App Bridge
    participant NextJS as Next.js Backend
    participant FastAPI as FastAPI Backend
    participant Shopify as Shopify API
    participant DB as Neon Database

    Note over Browser,DB: 1. App Installation (OAuth)
    Browser->>NextJS: Install app
    NextJS->>Shopify: OAuth request
    Shopify->>NextJS: Return API Access Token
    NextJS->>DB: Store API Access Token

    Note over Browser,DB: 2. Runtime Authentication
    AppBridge->>Browser: Provide ID Token (JWT)
    Browser->>NextJS: Request with ID Token
    NextJS->>NextJS: Validate ID Token
    
    Note over Browser,DB: 3. Backend Communication
    Browser->>FastAPI: Request with ID Token
    FastAPI->>FastAPI: Decode ID Token → Extract Shop
    FastAPI->>DB: Get API Access Token for Shop
    FastAPI->>Shopify: API Call with Access Token
    Shopify->>FastAPI: Return Data
    FastAPI->>Browser: Return Response
```

## 🧪 Testing Scenarios

### **Scenario 1: Direct FastAPI Testing**
```bash
# Using App Bridge ID Token (from browser)
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..." \
     http://127.0.0.1:8004/shop/info
```

**What happens:**
1. FastAPI receives App Bridge ID Token
2. JWT middleware decodes token → extracts shop domain
3. Session storage retrieves Shopify API Access Token for that shop
4. FastAPI makes authenticated call to Shopify API
5. Returns shop information

### **Scenario 2: Shop Domain Header Testing**
```bash
# Using shop domain directly (for testing)
curl -H "X-Shopify-Shop-Domain: mystore.myshopify.com" \
     http://127.0.0.1:8004/shop/info
```

**What happens:**
1. FastAPI gets shop domain from header
2. Session storage retrieves Shopify API Access Token for that shop
3. FastAPI makes authenticated call to Shopify API
4. Returns shop information

### **Scenario 3: Development Mode Testing**
```bash
# Using development fallback
curl -H "X-Development-Mode: true" \
     http://127.0.0.1:8004/shop/info
```

**What happens:**
1. FastAPI uses "demo.myshopify.com" as fallback
2. Attempts to retrieve token (likely fails in development)
3. Returns appropriate error or mock data

## 🔍 How to Get Tokens for Testing

### **Method 1: Browser Network Tab**
1. Open your app in Shopify Admin
2. Open Developer Tools → Network tab
3. Look for requests to **your app's endpoints** (not Shopify's)
4. Find `Authorization: Bearer` headers in requests to:
   - `localhost:3000` (Next.js)
   - `localhost:8004` (FastAPI)
   - Your tunnel URL

**Example Network Request:**
```
Request URL: http://localhost:3000/api/some-endpoint
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Method 2: Programmatic Access**
Add to your React component:
```javascript
import { useAppBridge } from '@shopify/app-bridge-react';

function TokenDebugger() {
  const app = useAppBridge();
  
  const getToken = async () => {
    try {
      const token = await app.idToken();
      console.log('App Bridge ID Token:', token);
      
      // Test FastAPI endpoint
      const response = await fetch('http://localhost:8004/shop/info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('FastAPI Response:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <button onClick={getToken}>Test Authentication</button>;
}
```

### **Method 3: Server Action Logging**
In your Next.js server action:
```javascript
// web/app/actions.ts
export async function debugToken(token: string) {
  console.log('Received App Bridge Token:', token);
  
  // Test FastAPI endpoint from server-side
  const response = await fetch('http://localhost:8004/shop/info', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

## ⚠️ Security Considerations

### **What's Safe to Log/Expose:**
- ✅ App Bridge ID Tokens (short-lived, limited scope)
- ✅ Shop domains
- ✅ Token expiration times
- ✅ Error messages (without sensitive data)

### **What's NEVER Safe to Expose:**
- ❌ Shopify API Access Tokens
- ❌ API secrets
- ❌ Database credentials
- ❌ Full session data

### **Best Practices:**
1. **Never log full API access tokens** in production
2. **Use token previews** (`token.substring(0, 20) + "..."`)
3. **Validate tokens server-side** before using them
4. **Use HTTPS** for all token transmission
5. **Implement token refresh** for expired tokens

## 🎯 Testing Checklist

- [ ] **App Installation**: OAuth flow creates session data in database
- [ ] **Token Generation**: App Bridge provides ID tokens to frontend
- [ ] **Token Validation**: FastAPI can decode and validate ID tokens
- [ ] **Shop Extraction**: Shop domain correctly extracted from tokens
- [ ] **Session Retrieval**: API access tokens retrieved from database
- [ ] **API Calls**: Shopify API calls work with retrieved tokens
- [ ] **Multi-Tenant**: Different shops have isolated tokens
- [ ] **Error Handling**: Proper errors for invalid/expired tokens

## 🚀 Production Considerations

1. **Token Refresh**: Implement automatic token refresh for expired tokens
2. **Rate Limiting**: Respect Shopify API rate limits per shop
3. **Error Handling**: Graceful handling of token validation failures
4. **Monitoring**: Log authentication events for debugging
5. **Security**: Regular security audits of token handling

This architecture ensures that your FastAPI backend can securely authenticate requests while maintaining proper separation between frontend-accessible tokens and sensitive API credentials.
