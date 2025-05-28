# 🏗️ **Loyalty App - Scalable Architecture**

## 📋 **Overview**

This loyalty application features a **production-ready, scalable architecture** with:

- **🔄 Event-Driven Processing**: Redis Streams + Celery for resilient event handling
- **📊 GraphQL API**: Public API for storefront UI extensions
- **🎯 Rule Engine**: Flexible JSONB-based automation system
- **📈 Monitoring**: Comprehensive metrics and alerting
- **🚀 Microservices**: Distributed, containerized services

## 🏛️ **Architecture Components**

### **Core Services**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI App   │    │  GraphQL API    │    │ Event Processor │
│   (Main API)    │    │  (Storefront)   │    │   (Workers)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │  Redis Streams  │    │   PostgreSQL    │    │ Celery Workers  │
         │ (Event Queue)   │    │   (Database)    │    │ (Background)    │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**

```
1. Event Trigger → 2. Redis Stream → 3. Event Processor → 4. Rule Engine → 5. Actions
     ↓                    ↓                 ↓                ↓              ↓
Shopify Webhook    Event Queuing    Async Processing   Condition Check   Points/Webhooks
```

## 🔧 **Technology Stack**

### **Backend**
- **FastAPI**: Main API server with async support
- **PostgreSQL**: Primary database with JSONB for flexible schemas
- **Redis**: Event streaming, caching, and Celery broker
- **Celery**: Distributed task processing
- **SQLAlchemy**: Async ORM with connection pooling
- **Strawberry GraphQL**: Type-safe GraphQL API

### **Event Processing**
- **Redis Streams**: Event sourcing and replay capabilities
- **Consumer Groups**: Scalable event processing
- **Dead Letter Queues**: Failed event handling
- **Exponential Backoff**: Resilient retry logic

### **Monitoring**
- **Prometheus**: Metrics collection
- **Flower**: Celery monitoring
- **Custom Dashboards**: Real-time system health
- **Alerting**: Threshold-based notifications

### **Frontend**
- **Next.js**: Admin dashboard
- **Shopify Polaris**: UI components
- **Shopify UI Extensions**: Storefront integration
- **GraphQL Client**: Type-safe API consumption

## 📊 **Database Schema**

### **Core Tables**
```sql
-- Loyalty profiles and transactions
customer_loyalty_profiles
points_transactions
redemption_logs

-- Rule engine
rules (JSONB conditions/actions)
rule_executions
rule_versions
event_queue

-- Rewards and tiers
reward_definitions
tier_definitions

-- Referral system
referral_links
referral_clicks
referral_conversions
```

### **Event Sourcing**
```sql
-- Redis Streams store events as:
{
  "event_id": "uuid",
  "event_type": "order_created",
  "shop_domain": "store.myshopify.com",
  "customer_id": "123",
  "event_data": {...},
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## 🚀 **Deployment**

### **Docker Compose Services**

```yaml
services:
  # Core application
  fastapi-app:        # Main API server
  graphql-api:        # Public GraphQL API
  
  # Event processing
  redis:              # Event streaming & caching
  celery-worker:      # Background task processing
  celery-beat:        # Periodic task scheduling
  event-processor:    # Stream event processing
  
  # Monitoring
  flower:             # Celery monitoring UI
  prometheus:         # Metrics collection
  grafana:            # Metrics visualization
  
  # Database
  postgres:           # Primary database
```

### **Scaling Strategy**

```bash
# Scale event processors
docker-compose up --scale event-processor=4

# Scale Celery workers
docker-compose up --scale celery-worker=8

# Scale GraphQL API
docker-compose up --scale graphql-api=3
```

## 🔄 **Event Processing Flow**

### **1. Event Publishing**
```python
# Publish loyalty event
await publish_loyalty_event(
    event_type="order_created",
    shop_domain="store.myshopify.com",
    event_data={
        "order_id": "123",
        "total": 150.00,
        "customer_id": "456"
    }
)
```

### **2. Stream Processing**
```python
# Event processor consumes from Redis Stream
async for events in streamer.consume_events():
    for event in events:
        # Process through rule engine
        results = await rule_engine.process_event(event)
        
        # Execute actions (points, webhooks, etc.)
        await execute_actions(results)
```

### **3. Rule Evaluation**
```json
{
  "name": "First Order Bonus",
  "conditions": {
    "operator": "and",
    "conditions": [
      {"type": "order_total", "operator": ">=", "value": 100},
      {"type": "frequency", "event_type": "order_created", "value": 1}
    ]
  },
  "actions": [
    {"type": "points", "amount": 500, "reason": "First order bonus"}
  ]
}
```

## 📈 **Monitoring & Observability**

### **Key Metrics**
- **Event Processing Rate**: Events/second
- **Rule Execution Time**: Average/P95/P99
- **Error Rates**: Failed events/rules
- **Stream Lag**: Messages behind
- **Webhook Success Rate**: Delivery success %

### **Health Checks**
```bash
# System health
GET /monitoring/health

# Stream metrics
GET /monitoring/stream-info

# Performance metrics
GET /monitoring/system-metrics
```

### **Alerting Thresholds**
- Error rate > 5%
- Processing time > 1 second
- Stream lag > 1000 messages
- Webhook failure rate > 10%

## 🎯 **GraphQL API**

### **Public Storefront API**
```graphql
# Customer loyalty profile
query GetLoyaltyProfile($customerId: String!) {
  loyaltyProfile(customerId: $customerId) {
    points_balance
    current_tier { name level }
    next_tier { name min_points_required }
    tier_progress_percentage
  }
}

# Redeem reward
mutation RedeemReward($input: RedeemRewardInput!) {
  redeemReward(input: $input) {
    success
    message
    points_deducted
    new_balance
  }
}
```

### **Shopify UI Extensions**
```tsx
// Checkout loyalty widget
<LoyaltyWidget 
  customerId={customer.id}
  showPoints={true}
  showTier={true}
  showRewards={true}
/>
```

## 🔒 **Security**

### **API Security**
- **JWT Authentication**: Secure admin access
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Controlled origins
- **Input Validation**: Pydantic schemas

### **Data Protection**
- **Encrypted Connections**: TLS everywhere
- **Database Encryption**: At-rest encryption
- **PII Handling**: GDPR compliance
- **Audit Logging**: All data changes

## 🧪 **Testing Strategy**

### **Test Coverage**
- **Unit Tests**: Individual components
- **Integration Tests**: Service interactions
- **Performance Tests**: Load and stress testing
- **E2E Tests**: Complete user flows

### **Test Categories**
```python
# Unit tests
test_rule_engine.py
test_event_streaming.py
test_graphql_api.py

# Integration tests
test_end_to_end_flow.py
test_webhook_delivery.py

# Performance tests
test_event_throughput.py
test_rule_performance.py
```

## 📦 **Development Setup**

### **Quick Start**
```bash
# Clone repository
git clone <repo-url>
cd loyalty-app

# Start services
docker-compose -f docker-compose.streaming.yml up

# Run migrations
cd backend && alembic upgrade head

# Install dependencies
pip install -r requirements.txt -r requirements-streaming.txt

# Start development
uvicorn main:app --reload
```

### **Environment Variables**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/loyalty_db
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
```

## 🚀 **Production Deployment**

### **Infrastructure Requirements**
- **CPU**: 4+ cores per service
- **Memory**: 8GB+ total
- **Storage**: SSD with 100GB+
- **Network**: Load balancer with SSL

### **Scaling Recommendations**
- **Event Processors**: 1 per CPU core
- **Celery Workers**: 2-4 per CPU core
- **Database**: Connection pooling (20-50 connections)
- **Redis**: Cluster mode for high availability

### **Monitoring Setup**
```bash
# Prometheus metrics
http://localhost:9090

# Grafana dashboards
http://localhost:3000

# Celery monitoring
http://localhost:5555
```

## 🔮 **Future Enhancements**

### **Planned Features**
- **Machine Learning**: Predictive customer insights
- **Real-time Analytics**: Live dashboards
- **Multi-tenant Architecture**: SaaS deployment
- **Advanced Segmentation**: Behavioral targeting
- **A/B Testing**: Rule performance comparison

### **Technical Improvements**
- **Kubernetes Deployment**: Container orchestration
- **Service Mesh**: Inter-service communication
- **Event Sourcing**: Complete audit trail
- **CQRS Pattern**: Read/write separation
- **Distributed Tracing**: Request flow tracking

---

## 📞 **Support**

For questions or issues:
- **Documentation**: `/docs` endpoint
- **GraphQL Playground**: `/graphql`
- **Monitoring**: `/monitoring/health`
- **Metrics**: `/monitoring/metrics`
