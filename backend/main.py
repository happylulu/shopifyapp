from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime, timedelta

app = FastAPI()

# --- In-memory storage for demonstration purposes ---
customers: Dict[int, Dict] = {}
rewards: Dict[str, int] = {"5_OFF": 100}
customer_risk_flags: Dict[int, bool] = {}

# --- Pydantic models ---
class Order(BaseModel):
    customer_id: int
    total_price: float

class RedeemRequest(BaseModel):
    customer_id: int
    reward_code: str

class OfferRequest(BaseModel):
    customer_id: int
    message: str

# --- Helper functions ---
def get_points(customer_id: int) -> int:
    return customers.get(customer_id, {}).get("points", 0)

def add_points(customer_id: int, points: int):
    data = customers.setdefault(customer_id, {"points": 0, "last_order": datetime.utcnow()})
    data["points"] += points
    data["last_order"] = datetime.utcnow()

# --- Endpoints ---
@app.post("/webhook/order")
async def webhook_order(order: Order):
    points = int(order.total_price)
    add_points(order.customer_id, points)
    return {"status": "points_added", "points": get_points(order.customer_id)}

@app.get("/customers/{customer_id}")
async def get_customer(customer_id: int):
    if customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")
    data = customers[customer_id]
    return {"points": data["points"], "last_order": data["last_order"]}

@app.post("/redeem")
async def redeem(redeem: RedeemRequest):
    if redeem.reward_code not in rewards:
        raise HTTPException(status_code=400, detail="Invalid reward code")
    cost = rewards[redeem.reward_code]
    if get_points(redeem.customer_id) < cost:
        raise HTTPException(status_code=400, detail="Not enough points")
    customers[redeem.customer_id]["points"] -= cost
    return {"status": "redeemed", "remaining": get_points(redeem.customer_id)}

@app.get("/risk")
async def list_risk_customers() -> List[int]:
    # Extremely naive risk flag: no orders in last 60 days
    at_risk = []
    for cid, data in customers.items():
        if datetime.utcnow() - data.get("last_order", datetime.utcnow()) > timedelta(days=60):
            at_risk.append(cid)
    return at_risk

@app.post("/offers")
async def send_offer(req: OfferRequest):
    # This would normally send an email via provider
    if req.customer_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"status": "offer_sent"}
