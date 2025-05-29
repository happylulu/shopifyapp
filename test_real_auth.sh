#!/bin/bash

# Test Real Authentication with Shopify Session Tokens
# This script helps you test the multi-tenant authentication system

echo "🚀 Testing Real Shopify Authentication"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "shopify.app.comeback.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Starting Development Servers"
echo "--------------------------------------"

# Start FastAPI backend in background
echo "🔧 Starting FastAPI backend..."
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8004 --reload &
FASTAPI_PID=$!
cd ..

# Wait a moment for FastAPI to start
sleep 3

echo "✅ FastAPI backend started on http://127.0.0.1:8004"
echo "✅ Your Cloudflare tunnel: https://minolta-wanted-extraction-simply.trycloudflare.com"

echo ""
echo "📋 Step 2: Install App on Test Shop"
echo "-----------------------------------"
echo "1. Open your test shop admin: https://[your-test-shop].myshopify.com/admin"
echo "2. Go to Apps section"
echo "3. Install your 'comeback' app using the tunnel URL"
echo "4. Complete the OAuth flow"
echo ""

echo "📋 Step 3: Test Authentication"
echo "------------------------------"
echo "After installing the app, run these tests:"
echo ""
echo "# Test 1: Check session storage"
echo "cd backend && python -c \"
import asyncio
from test_auth import test_session_storage
asyncio.run(test_session_storage())
\""
echo ""
echo "# Test 2: Test shop info endpoint"
echo "curl -H 'X-Development-Mode: true' http://127.0.0.1:8004/shop/info"
echo ""

echo "📋 Step 4: Get Real Session Token"
echo "---------------------------------"
echo "1. Open browser dev tools on your app"
echo "2. Go to Network tab"
echo "3. Look for requests with 'Authorization: Bearer' headers"
echo "4. Copy the token after 'Bearer '"
echo ""

echo "📋 Step 5: Test with Real Token"
echo "-------------------------------"
echo "Replace YOUR_TOKEN_HERE with the actual token:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN_HERE' http://127.0.0.1:8004/shop/info"
echo ""

echo "🎯 Ready to test! Press Ctrl+C to stop the backend when done."

# Wait for user to stop
wait $FASTAPI_PID
