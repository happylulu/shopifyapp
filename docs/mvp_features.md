# MVP Features and Dependencies

This document outlines the minimal set of features for the initial release of the AI‑powered Shopify loyalty app as well as the key dependencies for each feature.

## 1. Essential Loyalty Mechanics

### 1.1 Points for Purchases
- Customers earn points for every dollar spent (configurable rate).
- Merchants can configure earning rules and view a log of points awarded.
- Customers see their balance via an embedded widget.

**Dependencies**
- **Shopify**: Order and Customer APIs, webhooks, app embeds/theme extensions.
- **FastAPI** backend: endpoints for webhooks, points calculation, data models.
- **Next.js** frontend: merchant admin configuration UI and customer widget.

### 1.2 Redeemable Rewards
- Customers redeem points for fixed discount codes.
- Merchants define redemption options and point costs.

**Dependencies**
- **Shopify**: Discount API for generating codes, theme extension UI.
- **FastAPI** backend: redemption endpoint, points deduction, reward models.
- **Next.js** frontend: reward configuration and customer redemption interface.

### 1.3 VIP Tiers
- Tiered loyalty levels (e.g., Bronze, Silver, Gold) based on accumulated points.
- Higher tiers may earn points faster.

**Dependencies**
- **Shopify**: customer data (tags or app database) and theme extensions.
- **FastAPI** backend: tier evaluation logic and data models.
- **Next.js** frontend: admin tier configuration and customer tier display.

## 2. AI‑Powered Retention

### 2.1 Churn Risk Identification
- Simple heuristics or initial model to flag at‑risk customers (e.g., long time since last purchase).
- Merchants see a list of flagged customers with basic indicators.

**Dependencies**
- **Shopify**: historical order and customer data.
- **FastAPI** backend: scheduled analysis tasks, churn risk models, database.
- **Next.js** frontend: dashboard section listing at‑risk customers.

### 2.2 Targeted Retention Offers
- Merchants create a simple offer (bonus points or discount) for at‑risk customers.
- Offer delivery via email after manual trigger.

**Dependencies**
- **Shopify**: customer emails, Discount API.
- **FastAPI** backend: endpoints to send offers, integrate with email service.
- **Next.js** frontend: UI to define and send offers.

## 3. Merchant Experience

### 3.1 App Installation & Onboarding
- OAuth installation flow and quick setup of earning rules.

### 3.2 Dashboard
- Stats on loyalty members, points issued/redeemed, and list of at‑risk customers.

## 4. Customer Experience

### 4.1 Loyalty Widget
- Embedded in the store to display points balance, VIP tier, and redeemable rewards.

**Dependencies**
- **Shopify** theme app extensions.
- **FastAPI** backend: customer-specific endpoints.
- **Next.js** frontend: embedded widget components.

This feature set provides a lean yet functional foundation that highlights the AI‑assisted retention capabilities alongside core loyalty mechanics.
