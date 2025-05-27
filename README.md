# Shopify Loyalty & Rewards App

A comprehensive loyalty and rewards program for Shopify stores, built with Next.js, FastAPI, and modern web technologies. This app provides merchants with powerful tools to increase customer retention through points, tiers, referrals, VIP programs, and AI-driven insights.

## 🎯 **Core Features**

### 💎 **Loyalty Program**
- **Points System**: Customers earn points for purchases, reviews, referrals
- **Tier Management**: Bronze, Silver, Gold, Platinum tiers with escalating benefits
- **Reward Redemption**: Discount codes, free products, exclusive perks
- **Point Expiration**: Configurable point expiry to encourage engagement

### 🔗 **Referral System**
- **Custom Referral Links**: Unique URLs for each customer
- **Social Sharing**: Facebook, Twitter, Instagram, Email integration
- **UTM Tracking**: Detailed analytics on referral performance
- **Conversion Tracking**: Monitor clicks to purchases

### 👑 **VIP Tiers & Events**
- **VIP Member Management**: Exclusive tier for high-value customers
- **Special Events**: Limited-time campaigns and promotions
- **Personalized Benefits**: Custom rewards based on customer behavior
- **Event Analytics**: Track engagement and ROI

### 🤖 **AI-Powered Insights**
- **Customer Segmentation**: Automatic grouping based on behavior
- **Predictive Analytics**: Identify at-risk and high-value customers
- **Personalized Recommendations**: AI-suggested rewards and campaigns
- **Performance Optimization**: Data-driven insights for program improvement

## 🏗️ **Technical Architecture**

### **Frontend (Next.js 14)**
- **App Router**: Modern Next.js with server components
- **TypeScript**: Full type safety across the application
- **Shopify Polaris**: Native Shopify design system
- **App Bridge v4**: Seamless Shopify admin integration
- **API Routes**: Next.js API proxy for backend communication

### **Backend (FastAPI + Python)**
- **FastAPI**: High-performance async API framework
- **SQLAlchemy**: Advanced ORM with async support
- **PostgreSQL**: Robust relational database
- **Alembic**: Database migration management
- **Pydantic**: Data validation and serialization

### **Database Schema**
- **Customer Loyalty Profiles**: Points, tiers, preferences
- **Reward Definitions**: Configurable reward catalog
- **Referral Links**: Tracking and analytics
- **VIP Events**: Campaign management
- **Analytics Tables**: Pre-computed metrics

### **Shopify Integration**
- **Discount Functions**: Native Shopify discount engine
- **Webhooks**: Real-time order and customer updates
- **GraphQL API**: Product and customer data sync
- **App Bridge**: Embedded app experience

## 🛠️ **Tech Stack**

- **Next.js 14**: React framework with app router
- **FastAPI**: Python async web framework
- **SQLAlchemy**: Database ORM with async support
- **PostgreSQL**: Primary database
- **TypeScript**: Type safety across frontend and API
- **Shopify Polaris**: UI component library
- **App Bridge v4**: Shopify app integration
- **Alembic**: Database migrations

## 🚀 **Quick Start**

### **1. Clone and Install**
```bash
git clone <your-repo-url>
cd shopify-loyalty-app
npm install
```

### **2. Environment Setup**
Create `web/.env.local`:
```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders,read_discounts,write_discounts

# Backend Configuration
BACKEND_URL=http://127.0.0.1:8004

# Session Storage
SESSION_SECRET=your-session-secret-key
```

### **3. Database Setup**
```bash
# Start PostgreSQL (Docker)
docker-compose up -d postgres

# Run migrations
cd backend
alembic upgrade head
```

### **4. Start Development Servers**
```bash
# Terminal 1: Backend API
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8004 --reload

# Terminal 2: Frontend
cd web
npm run dev

# Terminal 3: Shopify CLI
shopify app dev
```

### **5. Access the App**
- **Shopify Admin**: Follow the CLI preview URL
- **API Docs**: http://127.0.0.1:8004/docs
- **Frontend**: http://localhost:3000

## 📡 **API Endpoints**

### **Loyalty Program**
- `GET /loyalty/profiles/{customer_id}/` - Get customer loyalty profile
- `POST /loyalty/profiles/` - Create new loyalty profile
- `PUT /loyalty/profiles/{customer_id}/points/` - Adjust customer points

### **Rewards & Tiers**
- `GET /rewards/` - List all rewards
- `POST /rewards/` - Create new reward
- `GET /tiers/` - List all tiers
- `POST /tiers/` - Create new tier

### **Referral System**
- `GET /referrals/link-config` - Get referral link configuration
- `POST /referrals/link-config` - Update referral settings
- `GET /referrals/social-config` - Get social sharing settings
- `GET /referrals/analytics` - Get referral analytics
- `POST /referrals/links` - Create referral link

### **VIP & Events**
- `GET /vip/config` - Get VIP program configuration
- `GET /vip/tiers` - List VIP tiers
- `GET /vip/members` - List VIP members
- `POST /vip/members` - Create VIP member

### **AI Insights**
- `GET /ai/insights` - Get AI customer insights
- `GET /ai/opportunities` - Get business opportunities
- `POST /ai/segments/create` - Create customer segment

## Next.js and Shopify Embedded Apps

The goal of this template is to provide a quick and easy way to spin up a
Shopify Embedded App that uses the Next.js app router platform.

The template uses a couple features of app bridge v4 to make your life easier,
like authentication and session management.

### Providers

- in `layout.tsx` we setup some providers that are necessary for the app to run.
  - **ApolloProvider**: (Optional) Sets up the Apollo context for running
    Graphql queries and mutations. This runs through the `/api/graphql` Next.js
    route and is handled by the Shopify API library.
  - **SessionProvider**: (Optional) This ensures that the user always has an
    active session and that the app is installed correctly. It basically
    redirects the user to authenticate when it needs to.

### App Bridge

We use direct api mode and the new install flow so app installs are handled
automatically.

```toml
[access.admin]
direct_api_mode = "offline"
embedded_app_direct_api_access = true

[access_scopes]
# Learn more at https://shopify.dev/docs/apps/tools/cli/configuration#access_scopes
scopes = ""
use_legacy_install_flow = false
```

### Token exchange

The app template uses token exchange by default. The user gets the ID Token from
the initial page load and sends it to the server where it is stored. This
happens using a server action.

Also, all server actions should have the session token sent along with them, the
server can then verify and exchange the token if needed.

### Environment Variables

There are a couple environment variables you need to set up in order for the app
to run. Create a file called `.env` in the root directory (or the root of your
Next.js app) and add the following lines;

```bash
DATABASE_URL= # database connection string - for connecting to prisma
POSTGRES_PASSWORD= # optional database password - when running postgres db locally through docker
```

The first two variables are automatically populated by the Shopify CLI.

## Tech Stack

This template combines a number of third party open-source tools:

- [Next.js](https://nextjs.org/) builds the [React](https://reactjs.org/)
  frontend.

The following Shopify tools complement these third-party tools to ease app
development:

- [Shopify API library](https://github.com/Shopify/shopify-api-js?tab=readme-ov-file)
  manages OAuth on the serverless backend. This lets users install the app and
  grant scope permissions.
- [App Bridge React](https://shopify.dev/apps/tools/app-bridge/getting-started/using-react)
  adds authentication to API requests in the frontend and renders components
  outside of the App’s iFrame.
- [Apollo](https://www.apollographql.com/) for interacting with the Shopify
  GraphQL API (Optional).
- [SQLAlchemy]( ) for managing database connections and
  migrations.
## Getting started

### Local Development

[The Shopify CLI](https://shopify.dev/apps/tools/cli) connects to an app in your
Partners dashboard. It provides environment variables, runs commands in
parallel, and updates application URLs for easier development.

You can develop locally using your preferred package manager.

Using pnpm:

```shell
pnpm run dev
```

#### Docker for local development

You can also get up and running with Docker. This will setup and initialize the
postgres database for you.

```shell
docker-compose up
pnpm run migrate
```

#### Graphql-Codegen

If you run the following command, it will generate the types for the graphql
queries and mutations.

```shell
pnpm run graphql-codegen
```

This sets up your types when using Apollo client and gives your intellisense in
your IDE.

## Deployment

You can deploy this app to a hosting service of your choice. Here is the basic
setup for deploying to Vercel:

- Create you Shopify App in the Shopify Partners Dashboard
- Create your project on Vercel and add the environment variables from your
  Shopify App
  - `SHOPIFY_API_KEY`
  - `SHOPIFY_API_SECRET`
  - `SCOPES`
  - `HOST`
  - Any database connection strings
- Setup your Shopify App to have the same `/api/auth/callback` and `/api/auth`
  routes as your Vercel deployment (with your hostname)

Vercel should be setup to build using the default Next.js build settings.

You should also be using a managed Shopify deployment. This will handle scope
changes on your app.

```shell
pnpm run deploy
```

### Application Storage

This template uses Prisma to store and manage sessions. For more information on
how to set up Prisma, see the
[Prisma documentation](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch-typescript-postgres).

## Developer resources

- [Introduction to Shopify apps](https://shopify.dev/apps/getting-started)
- [App authentication](https://shopify.dev/apps/auth)
- [Shopify CLI](https://shopify.dev/apps/tools/cli)
- [Shopify API Library documentation](https://github.com/Shopify/shopify-api-node/tree/main/docs)

## Identity Management

This template demonstrates handling both merchant staff and customer identities.

- **Merchant (Admin) context** uses the session token and the App Bridge User API.
  Use the `useAppBridgeUser` hook to retrieve staff details in React components.
- **Customer (Storefront) context** relies on the checkout `buyerIdentity` object.
  The sample discount function in `extensions/discount-function` shows how to read this information.

## FastAPI Mock Backend

A small FastAPI service with mock data is located in the `backend` directory. Run it locally with:

```bash
uvicorn backend.main:app --reload
```

It exposes `/dashboard/overview` which returns loyalty metrics calculated from `backend/mock_data.py`.



The Next.js app includes a simple dashboard page at `/dashboard` that fetches these metrics from the FastAPI server. Start both the FastAPI backend and the Next.js dev server to see the data rendered in the app.

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"Failed to fetch" in Referral Program**
- ✅ **Fixed**: Ensure backend is running on port 8004
- ✅ **Fixed**: JWT middleware allows `/referrals/*` endpoints
- ✅ **Fixed**: Frontend has graceful error handling

#### **Backend Import Errors**
- ✅ **Fixed**: All required models imported in `referral_service.py`
- ✅ **Fixed**: Dependency injection working with `get_db()`

#### **Database Connection Issues**
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && alembic upgrade head
```

#### **Port Conflicts**
```bash
# Check what's using ports
lsof -i :8004  # Backend
lsof -i :3000  # Frontend

# Kill processes if needed
kill -9 <PID>
```

### **Development Tips**
- Use `--reload` flag for auto-restart during development
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Test endpoints directly with curl or Postman

## 🎯 **Recent Fixes**
- ✅ Fixed referral system "Failed to fetch" error
- ✅ Added JWT middleware bypass for referral endpoints
- ✅ Implemented graceful error handling in frontend
- ✅ Fixed import errors in backend services
- ✅ Updated port configuration (8004)
- ✅ Added comprehensive API documentation

## 📚 **Documentation**
- **API Docs**: http://127.0.0.1:8004/docs (when backend running)
- **Database Schema**: See `backend/models_v2.py`
- **Frontend Types**: See `web/app/types/`
- **Migration Guide**: See `backend/MIGRATIONS.md`