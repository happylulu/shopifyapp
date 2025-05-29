# 🧪 Complete System Test Guide

## Current Status

✅ **Database**: Neon PostgreSQL connected and migrated
✅ **FastAPI Backend**: Running on port 8005 with live database integration
✅ **Admin Router**: Created with live database endpoints
✅ **Next.js Frontend**: Updated to call port 8005 instead of mock port 8002
✅ **Authentication**: Multi-tenant token system implemented

## 🚀 **How to Test the Complete System**

### **Step 1: Start Both Servers**

**Terminal 1 - FastAPI Backend:**
```bash
cd backend
# Kill any existing processes
lsof -ti:8005 | xargs kill -9 2>/dev/null
# Start FastAPI with live database
python -m uvicorn main:app --host 127.0.0.1 --port 8005 --reload
```

**Terminal 2 - Next.js Frontend:**
```bash
cd web
npm run dev
```

### **Step 2: Test Admin Interface with Live Data**

**Open in browser:**
- http://localhost:3000/admin

**What to test:**
1. **Dashboard Overview**: Should show live data from PostgreSQL
2. **Create Tier**: Should save to database
3. **Create Reward**: Should save to database
4. **View Analytics**: Should show real metrics

### **Step 3: Test API Endpoints Directly**

**Test admin endpoints:**
```bash
# Dashboard with live data
curl -H "X-Development-Mode: true" http://127.0.0.1:8005/admin/dashboard/overview

# List tiers from database
curl -H "X-Development-Mode: true" http://127.0.0.1:8005/admin/tiers

# List rewards from database
curl -H "X-Development-Mode: true" http://127.0.0.1:8005/admin/rewards
```

**Test loyalty endpoints:**
```bash
# List tiers
curl -H "X-Development-Mode: true" http://127.0.0.1:8005/tiers/

# List rewards
curl -H "X-Development-Mode: true" http://127.0.0.1:8005/rewards/
```

### **Step 4: Test with Shopify App Dev**

**Start Shopify development:**
```bash
cd web
shopify app dev
```

**Install on test store:**
1. Follow the tunnel URL provided by Shopify CLI
2. Install the app on your test store
3. Test the admin interface within Shopify

### **Step 5: Test Core Loyalty Features**

**Create a tier:**
```bash
curl -X POST http://127.0.0.1:8005/admin/tiers \
  -H "Content-Type: application/json" \
  -H "X-Development-Mode: true" \
  -d '{
    "name": "Bronze",
    "tier_level": 1,
    "min_points_required": 0,
    "description": "Entry level tier"
  }'
```

**Create a reward:**
```bash
curl -X POST http://127.0.0.1:8005/admin/rewards \
  -H "Content-Type: application/json" \
  -H "X-Development-Mode: true" \
  -d '{
    "name": "10% Discount",
    "description": "Get 10% off your next order",
    "reward_type": "discount_percentage",
    "points_cost": 500
  }'
```

**Create a customer profile:**
```bash
curl -X POST http://127.0.0.1:8005/loyalty/profiles/ \
  -H "Content-Type: application/json" \
  -H "X-Development-Mode: true" \
  -d '{
    "shopify_customer_id": "test_customer_123",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "Customer"
  }'
```

## 🎯 **Expected Results**

### **Admin Interface Should Show:**
- ✅ Real member count from database (likely 0 initially)
- ✅ Real points issued from database
- ✅ Real tier distribution
- ✅ Ability to create/edit tiers and rewards
- ✅ Data persists in PostgreSQL

### **API Endpoints Should Return:**
- ✅ Live data from Neon PostgreSQL
- ✅ Shop-specific data isolation
- ✅ Proper authentication handling
- ✅ CRUD operations work correctly

### **Database Should Contain:**
- ✅ Shop records
- ✅ Tier definitions
- ✅ Reward definitions
- ✅ Customer loyalty profiles
- ✅ Transaction logs

## 🔍 **Troubleshooting**

### **If Admin Interface Shows No Data:**
1. Check FastAPI server is running on port 8005
2. Check database connection in FastAPI logs
3. Verify admin router is included in main.py
4. Test API endpoints directly with curl

### **If API Returns Errors:**
1. Check authentication headers
2. Verify shop context is being set
3. Check database migration status
4. Review FastAPI logs for errors

### **If Database Operations Fail:**
1. Verify Neon connection string in .env
2. Check Alembic migration status
3. Ensure database tables exist
4. Test database connection directly

## 🎉 **Success Criteria**

The system is working correctly when:

1. **Admin Interface**: Shows live data and allows CRUD operations
2. **Database Persistence**: Changes are saved and retrieved from PostgreSQL
3. **Multi-tenant**: Different shops have isolated data
4. **Authentication**: Requests are properly authenticated
5. **Core Features**: Tiers, rewards, and customer profiles work end-to-end

## 🚀 **Next Steps After Testing**

Once the core system is working:

1. **Install on Test Shop**: Use `shopify app dev` to install on a real test store
2. **Test Webhooks**: Trigger order events to test points earning
3. **Test Customer Flow**: Verify customer-facing features work
4. **Test Redemptions**: Ensure reward redemption works correctly
5. **Performance Testing**: Verify system handles multiple shops

This comprehensive test ensures your loyalty app works with **real data** instead of mock data, which is exactly what you need for a production-ready system!
