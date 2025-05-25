# Shopify App Backend

A FastAPI-based backend service for a comprehensive Shopify app featuring Points Program, VIP Tiers, Referrals, and AI-powered Customer Insights.

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

### 5. **Dashboard & Analytics**
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
pip install fastapi uvicorn pydantic python-dateutil
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

### Dashboard
- `GET /dashboard/overview` - Dashboard overview metrics
- `GET /dashboard/charts/revenue` - Revenue chart data
- `GET /dashboard/charts/customers` - Customer chart data
- `GET /dashboard/recent-activities` - Recent activities

## 🏗️ Project Structure

```
backend/
├── main.py                 # Main FastAPI application
├── models.py              # Core data models
├── services.py            # Core business logic
├── mock_data.py           # Mock data generation
├── vip_models.py          # VIP tier models
├── vip_service.py         # VIP tier business logic
├── ai_models.py           # AI insight models
├── ai_service.py          # AI insight logic
├── referral_service.py    # Referral system logic
├── start_server.py        # Server startup script
├── kill_port_8000.py      # Port cleanup utility
├── test_imports.py        # Import testing utility
└── README.md              # This file
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

### Test imports:
```bash
python test_imports.py
```

### Test endpoints:
```bash
# Health check
curl http://localhost:8000/health

# Get VIP config
curl http://localhost:8000/vip/config

# Get points balance
curl http://localhost:8000/points/balance/cust_001
```

## 📊 Mock Data

The backend includes mock data generators for testing:
- 8 VIP members across all tiers
- Sample transactions and activities
- Customer segments and insights
- Referral campaigns

## 🔒 Security Notes

**⚠️ Important**: This is a development server with mock data. For production:
1. Implement proper authentication (OAuth, JWT)
2. Add database integration (PostgreSQL, MongoDB)
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