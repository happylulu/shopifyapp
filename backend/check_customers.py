#!/usr/bin/env python3
import asyncio
from models_v2 import get_db
from sqlalchemy import text

async def check_customers():
    """Check current loyalty customers"""
    async for session in get_db():
        try:
            # Get all customers
            result = await session.execute(text('SELECT email, points_balance, shopify_customer_id FROM customer_loyalty_profiles'))
            customers = result.fetchall()
            
            print("🔍 Current loyalty customers:")
            if customers:
                for customer in customers:
                    print(f"  - {customer[0]} (ID: {customer[2]}): {customer[1]} points")
            else:
                print("  No loyalty customers found")
            
            # Check specifically for Linda Adams
            result = await session.execute(text("SELECT email, points_balance FROM customer_loyalty_profiles WHERE email LIKE '%linda.adams%'"))
            linda = result.fetchone()
            
            print(f"\n🔍 Linda Adams status:")
            if linda:
                print(f"  ✅ Found: {linda[0]} with {linda[1]} points")
            else:
                print("  ❌ Not found in loyalty program")
                
        finally:
            await session.close()
            break

if __name__ == "__main__":
    asyncio.run(check_customers()) 