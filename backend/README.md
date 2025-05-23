# FastAPI Backend

This folder contains a very small FastAPI backend used to demonstrate loyalty features.

The API stores data in memory for simplicity. It exposes endpoints for:

- Receiving order webhooks to award points
- Checking a customer's points balance
- Redeeming rewards for points
- Listing customers flagged as at risk of churn
- Sending a retention offer (placeholder)

To run locally:

```bash
uvicorn main:app --reload
```
