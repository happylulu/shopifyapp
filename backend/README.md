# Shopify App Backend

A FastAPI-based backend service for a comprehensive Shopify app featuring Points Program, VIP Tiers, Referrals, AI-powered Customer Insights, and VIP Events.

## 🚀 Features

### 1. **Points Program**
- Customer points tracking and management
- Configurable earning rules (purchase-based, action-based)
- Points redemption system
- Transaction history
- Analytics and reporting

### 2. **VIP Tiers Program**
- 4-tier system: Bronze, Silver, Gold, Platinum
- Automatic tier progression based on spending
- Tier-specific benefits and multipliers
- Member management and tracking
- Retention analytics

### 3. **Referral System**
- Customer referral tracking
- Reward management for referrers and referees
- Referral link generation
- Campaign analytics
- Fraud prevention measures

### 4. **AI Customer Insights**
- Customer segmentation (Champions, Loyal, At Risk, etc.)
- Purchase behavior analysis
- Churn prediction
- Personalized recommendations
- Sentiment analysis
- Revenue forecasting

### 5. **VIP Events & AI-Targeted Campaigns**
- Schedule targeted loyalty events
- Target specific VIP tiers and AI segments
- Multiple reward types (points multipliers, bonuses, discounts)
- Event timeline and calendar views
- Performance analytics and ROI tracking
- Auto-enrollment and notification options

### 6. **Dashboard & Analytics**
- Real-time metrics tracking
- Customer lifetime value analysis
- Revenue analytics
- Program performance metrics

## 📋 Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- Pydantic
- python-dateutil
- SQLAlchemy
- asyncpg

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shopifyapp/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install fastapi uvicorn pydantic python-dateutil sqlalchemy asyncpg
```

4. Create a `.env` file in the `backend` directory and add your database URL:
```env
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_nTXijxMf0yL9@ep-divine-snow-a8px2qp1-pooler.eastus2.azure.neon.tech/shopify?ssl=require
```

5. Initialize the database with migrations:
```bash
python init_db_with_migrations.py
```

## 🚀 Running the Server

### Option 1: Using the startup script (Recommended)
```bash
python start_server.py
```

This script will:
- Check all imports
- Clear port 8000 if occupied
- Start the server with auto-reload

### Option 2: Direct uvicorn command
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: Kill port and restart
```bash
python kill_port_8000.py
python start_server.py
```

## 🗃️ Database Migrations

This project uses Alembic for database schema management. The migration system provides:
- Version control for database schema changes
- Safe schema updates with rollback capability
- Automatic migration generation from model changes

### Quick Migration Commands

```bash
# Create a new migration after changing models
python migrate.py create "Add new column to users table"

# Apply all pending migrations
python migrate.py upgrade

# Rollback one migration
python migrate.py downgrade -1

# Check current migration status
python migrate.py current

# View migration history
python migrate.py history
```

For detailed migration documentation, see [MIGRATIONS.md](MIGRATIONS.md).

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Points Program
- `GET /points/balance/{customer_id}` - Get customer points balance
- `POST /points/earn` - Add points to customer
- `POST /points/redeem` - Redeem customer points
- `GET /points/transactions/{customer_id}` - Get transaction history
- `GET /points/analytics` - Points program analytics

### VIP Tiers
- `GET /vip/config` - Get VIP program configuration
- `PUT /vip/config` - Update program settings
- `GET /vip/tiers` - List all VIP tiers
- `PUT /vip/tiers/{tier_level}` - Update tier settings
- `GET /vip/members` - List VIP members with filtering
- `POST /vip/members` - Add new VIP member
- `GET /vip/members/{member_id}` - Get member details
- `PUT /vip/members/{member_id}` - Update member
- `DELETE /vip/members/{member_id}` - Remove member
- `GET /vip/analytics` - VIP program analytics

### Referrals
- `GET /referrals` - List all referrals
- `POST /referrals` - Create new referral
- `GET /referrals/{referral_id}` - Get referral details
- `PUT /referrals/{referral_id}/complete` - Mark referral as completed
- `GET /referrals/analytics` - Referral program analytics
- `GET /referrals/customer/{customer_id}` - Get customer's referrals

### AI Insights
- `GET /ai/insights/overview` - AI insights overview
- `GET /ai/insights/segments` - Customer segments analysis
- `GET /ai/insights/customer/{customer_id}` - Individual customer insights
- `GET /ai/insights/predictions` - Predictive analytics
- `GET /ai/insights/recommendations` - AI recommendations

### VIP Events
- `GET /events` - List all events with optional status filter
- `POST /events` - Create new VIP event
- `GET /events/{event_id}` - Get specific event details
- `PUT /events/{event_id}` - Update event
- `DELETE /events/{event_id}` - Delete event
- `GET /events/{event_id}/analytics` - Get event analytics
- `GET /events/calendar/view` - Get calendar view of events
- `GET /events/targets/available` - Get available VIP tiers and AI segments

### Dashboard
- `GET /dashboard/overview` - Dashboard overview metrics
- `GET /dashboard/charts/revenue` - Revenue chart data
- `GET /dashboard/charts/customers` - Customer chart data
- `GET /dashboard/recent-activities` - Recent activities

## 🏗️ Project Structure

```
backend/
├── main.py                      # Main FastAPI application
├── models_v2.py                 # Enhanced database models (v2 schema)
├── services.py                  # Core business logic
├── mock_data.py                 # Mock data generation
├── vip_models.py                # VIP tier models
├── vip_service.py               # VIP tier business logic
├── event_models.py              # VIP event models
├── event_service.py             # VIP event business logic
├── ai_models.py                 # AI insight models
├── ai_service.py                # AI insight logic
├── referral_service.py          # Referral system logic
├── migrate.py                   # Migration management script
├── migrate_to_v2.py             # Data migration utility
├── init_db_with_migrations.py   # Database initialization
├── start_server.py              # Server startup script
├── kill_port_8000.py            # Port cleanup utility
├── alembic/                     # Database migration system
├── MIGRATIONS.md                # Migration documentation
├── SCHEMA_V2_GUIDE.md           # v2 schema documentation
├── IMPLEMENTATION_SUMMARY.md    # Implementation summary
└── README.md                    # This file
```

## 🔧 Configuration

### VIP Tiers Configuration
The VIP program includes 4 default tiers:
- **Bronze**: $500+ annual spend, 1.25x points
- **Silver**: $1,500+ annual spend, 1.5x points + free shipping
- **Gold**: $3,000+ annual spend, 2x points + 15% discount
- **Platinum**: $5,000+ annual spend, 3x points + 20% discount + personal shopper

### Points Program Configuration
- Default earning rate: $1 = 10 points
- Redemption rate: 100 points = $1
- Bonus actions: Review (50 points), Social share (25 points)

## 🧪 Testing

You can test the API endpoints using curl or any API client:

```bash
# Health check
curl http://localhost:8000/health

# Get dashboard overview
curl http://localhost:8000/dashboard/overview

# Get VIP members
curl http://localhost:8000/vip/members
```

## Seeding Shopify Data

The backend includes scripts to populate your Shopify development store with test customers and orders:

### Quick Start

1. **Run the simple seeder script:**
   ```bash
   cd backend
   python seed_shopify_simple.py
   ```

2. **Follow the prompts to:**
   - Get your Shopify access token
   - Choose how many customers to create
   - The script will create customers with VIP tiers and tags

### Getting a Shopify Access Token

**Option 1: Through your Shopify App (Recommended)**
1. Go to your Shopify admin: https://petcocolulu.myshopify.com/admin
2. Navigate to: Settings → Apps and sales channels
3. Click on your "comeback" app
4. Go to the "API credentials" tab
5. Under "Admin API access token", click "Reveal token"

**Option 2: Create a Private App**
1. In Shopify admin, go to: Settings → Apps and sales channels
2. Click "Develop apps" (enable it if needed)
3. Create a new app
4. Configure Admin API scopes:
   - `read_customers`, `write_customers`
   - `read_orders`, `write_orders`
   - `read_products`
5. Install the app and get the access token

### Advanced Seeding

For more control, use the full seeder script:

```bash
# Edit the script first to add your access token
nano shopify_customer_seeder.py

# Then run it
python shopify_customer_seeder.py
```

This script will:
- Create 50 customers with realistic data
- Assign VIP tiers based on spending
- Create 1-5 orders per customer
- Add loyalty points and metafields
- Tag customers with segments

### Seeded Data Structure

Each customer will have:
- **VIP Tier**: platinum, gold, silver, bronze, or none
- **Tags**: `vip_[tier]`, `test_customer`, segment tags
- **Note**: Contains VIP status and lifetime value
- **Metafields** (if using advanced seeder):
  - `loyalty.points_balance`: Current points
  - `vip.tier`: VIP tier level
  - `vip.lifetime_value`: Total spent
  - `vip.join_date`: Member since date

## 🔒 Security Notes

**⚠️ Important**: This is a development server with mock data. For production:
1. Implement proper authentication (OAuth, JWT)
2. Add a multi-tenant database (PostgreSQL, MongoDB) with `shop_id` on every table
   and handle the `app/uninstalled` webhook to purge a shop's data
3. Implement rate limiting
4. Add input validation and sanitization
5. Use environment variables for configuration
6. Enable HTTPS
7. Add logging and monitoring

## 🤝 CORS Configuration

The backend is configured to accept requests from:
- http://localhost:3000 (Next.js development)
- Your production domain

Update CORS settings in `main.py` for your specific needs.

## 📝 API Response Format

All endpoints return JSON responses with consistent structure:

### Success Response:
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response:
```json
{
  "status": "error",
  "error": "Error message",
  "detail": "Detailed error information"
}
```

## 🚧 Development Tips

1. **Auto-reload**: The server runs with `--reload` flag for development
2. **API Documentation**: Visit http://localhost:8000/docs for interactive API docs
3. **Alternative Docs**: Visit http://localhost:8000/redoc for ReDoc documentation
4. **Mock Data**: Modify `mock_data.py` and service files to customize test data

## 📈 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Redis caching for performance
- [ ] WebSocket support for real-time updates
- [ ] Background job processing (Celery)
- [ ] Email notification system
- [ ] Webhook integration for Shopify events
- [ ] Advanced analytics with data warehousing
- [ ] Machine learning model deployment
- [ ] API versioning
- [ ] Comprehensive test suite

## 🐛 Troubleshooting

### Port 8000 already in use:
```bash
python kill_port_8000.py
# or
lsof -ti:8000 | xargs kill -9  # macOS/Linux
```

### Import errors:
```bash
python test_imports.py
pip install -r requirements.txt  # If requirements.txt exists
```

### CORS issues:
Check allowed origins in `main.py` and update as needed.

## 📄 License

This project is part of a Shopify app development example.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

For more information or support, please refer to the main project documentation.