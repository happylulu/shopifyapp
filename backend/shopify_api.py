import os
from datetime import datetime
from typing import List, Dict

from mock_data import ORDERS


def get_orders(start: datetime, end: datetime) -> List[Dict]:
    """Return orders between start and end with discount codes and totals.

    If SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN environment variables are set,
    this function queries the Shopify GraphQL API for orders including
    discount applications and totals. Otherwise, it falls back to the
    mocked orders in ``mock_data``.
    """
    shop = os.getenv("SHOPIFY_SHOP")
    token = os.getenv("SHOPIFY_ADMIN_TOKEN")

    if not shop or not token:
        # Use mock data when credentials are not available
        return [o for o in ORDERS if start <= o["created_at"] <= end]

    import requests

    query = """
    query ($first: Int!, $query: String!) {
      orders(first: $first, query: $query) {
        edges {
          node {
            id
            createdAt
            currentTotalPriceSet { shopMoney { amount } }
            discountApplications(first: 10) {
              edges {
                node {
                  ... on DiscountCodeApplication { code }
                }
              }
            }
          }
        }
      }
    }
    """
    query_string = f"processed_at:>={start.isoformat()} processed_at:<={end.isoformat()}"
    variables = {"first": 250, "query": query_string}

    response = requests.post(
        f"https://{shop}/admin/api/2023-07/graphql.json",
        headers={
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        },
        json={"query": query, "variables": variables},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json().get("data", {}).get("orders", {}).get("edges", [])

    orders: List[Dict] = []
    for edge in data:
        node = edge.get("node", {})
        discount_codes = []
        for app in node.get("discountApplications", {}).get("edges", []):
            discount_node = app.get("node", {})
            code = discount_node.get("code")
            if code:
                discount_codes.append(code)

        amount = float(
            node.get("currentTotalPriceSet", {})
            .get("shopMoney", {})
            .get("amount", 0.0)
        )
        created_at = datetime.fromisoformat(node.get("createdAt").replace("Z", "+00:00"))
        orders.append(
            {
                "id": node.get("id"),
                "discount_codes_used": discount_codes,
                "total_amount": amount,
                "created_at": created_at,
            }
        )
    return orders
