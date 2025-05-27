#!/bin/bash

echo "🚀 Setting up Shopify Loyalty App for Development"
echo "================================================"

# Check if Shopify CLI is installed
if ! command -v shopify &> /dev/null; then
    echo "📦 Installing Shopify CLI..."
    npm install -g @shopify/cli @shopify/theme
fi

# Check if Python dependencies are installed
echo "🐍 Checking Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Check if Node dependencies are installed
echo "📦 Checking Node.js dependencies..."
cd ../web
npm install

# Generate secrets if not set
echo "🔐 Checking environment configuration..."

# Check backend .env
if ! grep -q "JWT_SECRET=your-super-secret" ../backend/.env; then
    echo "✅ JWT_SECRET already configured"
else
    echo "⚠️  Please update JWT_SECRET in backend/.env"
fi

# Check frontend .env.local
if ! grep -q "SHOPIFY_API_KEY=your_api_key_here" .env.local; then
    echo "✅ Shopify API keys already configured"
else
    echo "⚠️  Please update SHOPIFY_API_KEY and SHOPIFY_API_SECRET in web/.env.local"
    echo "   Get these from: https://partners.shopify.com"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update your environment variables:"
echo "   - backend/.env: Set DATABASE_URL and JWT_SECRET"
echo "   - web/.env.local: Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "3. Start the frontend with Shopify CLI:"
echo "   cd web && shopify app dev"
echo ""
echo "4. Follow the CLI prompts to:"
echo "   - Connect to your Partner account"
echo "   - Create or select a development store"
echo "   - Install the app"
echo ""
echo "🎉 Your loyalty app will be ready for testing!"
