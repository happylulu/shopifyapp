# FastAPI Authentication Architecture for Multi-Tenant Shopify Apps

## Overview

This document explains the corrected authentication architecture for the FastAPI backend in a multi-tenant Shopify app. The previous approach using a single `SHOPIFY_ACCESS_TOKEN` environment variable was incorrect for public Shopify apps that serve multiple merchants.

## The Problem with Single Access Tokens

**❌ Incorrect Approach (Previous):**
```env
# This is WRONG for multi-tenant apps
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
```

**Why this is wrong:**
- Each shop that installs your app gets its own unique access token
- A single token can only access one specific shop's data
- Using one token for all shops is a security violation and architectural error
- Public Shopify apps must handle multiple shops, each with their own permissions

## The Correct Multi-Tenant Architecture

**✅ Correct Approach (Current):**

### 1. OAuth Flow (Next.js Frontend)
- Next.js handles the OAuth flow using `@shopify/shopify-api-js`
- Each shop gets a unique offline access token during installation
- Tokens are stored in PostgreSQL via Prisma session storage

### 2. Session Storage (Shared Database)
- Both Next.js and FastAPI access the same PostgreSQL database
- Session data includes shop-specific access tokens
- FastAPI retrieves tokens on-demand for each request

### 3. Shop Context Extraction
- JWT middleware extracts shop domain from Shopify session tokens
- Request context includes shop information
- Each API call is scoped to a specific shop

## Architecture Components

### 1. Session Storage Service (`session_storage.py`)
```python
# Retrieves shop-specific access tokens from shared database
access_token = await session_storage.get_shop_access_token(shop_domain)
```

### 2. Shopify API Client (`shopify_client.py`)
```python
# Makes authenticated requests using shop-specific tokens
shop_info = await shopify_client.get_shop_info(shop_domain)
```

### 3. Shop Context Utilities (`shop_context.py`)
```python
# FastAPI dependencies for shop context
@app.get("/api/endpoint")
async def endpoint(shop_domain: str = Depends(verify_shop_access)):
    # shop_domain is verified and ready to use
```

### 4. JWT Middleware (`jwt_middleware.py`)
```python
# Extracts shop context from Shopify session tokens
# Sets request.state.shop_domain for use in endpoints
```

## How It Works

### 1. App Installation (Next.js)
```mermaid
sequenceDiagram
    participant Shop as Shopify Store
    participant Next as Next.js App
    participant DB as PostgreSQL
    
    Shop->>Next: Install app (OAuth)
    Next->>Shop: Request access token
    Shop->>Next: Return shop-specific token
    Next->>DB: Store token with shop domain
```

### 2. API Request (FastAPI)
```mermaid
sequenceDiagram
    participant Frontend as Next.js Frontend
    participant FastAPI as FastAPI Backend
    participant DB as Session Storage
    participant Shopify as Shopify API
    
    Frontend->>FastAPI: Request with session token
    FastAPI->>FastAPI: Extract shop domain from token
    FastAPI->>DB: Get access token for shop
    FastAPI->>Shopify: Make API call with shop token
    Shopify->>FastAPI: Return shop-specific data
    FastAPI->>Frontend: Return response
```

## Usage Examples

### Basic Endpoint with Shop Context
```python
@app.get("/shop/info")
async def get_shop_info(
    shop_domain: str = Depends(verify_shop_access),
    shopify_client = Depends(get_shopify_client)
):
    shop_info = await shopify_client.get_shop_info(shop_domain)
    return {"shop_domain": shop_domain, "shop_info": shop_info}
```

### Advanced Endpoint with Full Context
```python
@app.get("/loyalty/profile/{customer_id}")
async def get_loyalty_profile(
    customer_id: str,
    shop_context: ShopContext = Depends(get_shop_context),
    db: AsyncSession = Depends(get_db)
):
    # shop_context.shop_domain is verified
    # shop_context.get_access_token() available if needed
    
    profile = await get_customer_profile(db, shop_context.shop_domain, customer_id)
    return profile
```

## Environment Variables

### FastAPI Backend (.env)
```env
# Database connection (shared with Next.js)
DATABASE_URL=postgresql+asyncpg://user:pass@host/db

# Shopify app credentials (for token verification)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# No SHOPIFY_ACCESS_TOKEN needed!
```

### Next.js Frontend (.env.local)
```env
# Shopify app credentials
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=read_products,write_products,read_customers,write_customers

# Database for session storage
DATABASE_URL=postgresql://user:pass@host/db
```

## Security Considerations

1. **Token Storage**: Access tokens are stored securely in the database
2. **Token Verification**: Session tokens are verified using Shopify's public keys
3. **Shop Isolation**: Each request is scoped to a specific shop
4. **Access Control**: Only installed shops can access the API

## Migration from Single Token

If you previously used a single `SHOPIFY_ACCESS_TOKEN`:

1. ✅ Remove `SHOPIFY_ACCESS_TOKEN` from environment variables
2. ✅ Update endpoints to use `Depends(verify_shop_access)`
3. ✅ Replace direct Shopify API calls with `shopify_client`
4. ✅ Test with multiple shops to ensure proper isolation

## Testing

### Development Mode
```python
# For testing, you can use a development header
headers = {"X-Development-Mode": "true"}
# This will use "demo.myshopify.com" as fallback
```

### Multiple Shops
```python
# Test with different shop domains
await shopify_client.get_shop_info("shop1.myshopify.com")
await shopify_client.get_shop_info("shop2.myshopify.com")
```

## Benefits of This Architecture

1. **✅ Multi-Tenant**: Supports unlimited shops
2. **✅ Secure**: Each shop's data is isolated
3. **✅ Scalable**: No hardcoded limitations
4. **✅ Compliant**: Follows Shopify best practices
5. **✅ Maintainable**: Clear separation of concerns

## Common Pitfalls to Avoid

1. **❌ Don't** use a single access token for all shops
2. **❌ Don't** hardcode shop domains in the code
3. **❌ Don't** skip shop verification in endpoints
4. **❌ Don't** mix session tokens between different shops
5. **❌ Don't** store access tokens in environment variables
