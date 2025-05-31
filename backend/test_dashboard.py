#!/usr/bin/env python3
"""
Simple test script to debug the dashboard endpoint and database connection
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from models_v2 import get_db, init_db, CustomerLoyaltyProfile
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

async def test_database_connection():
    """Test basic database connectivity"""
    print("Testing database connection...")
    
    try:
        # Test database initialization
        await init_db()
        print("✅ Database initialization successful")
        
        # Test session creation
        async for session in get_db():
            try:
                # Test basic SQL query
                result = await session.execute(text('SELECT 1'))
                test_value = result.scalar()
                print(f"✅ Basic SQL query successful: {test_value}")
                
                # Test table existence
                try:
                    result = await session.execute(text(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                    ))
                    tables = [row[0] for row in result.fetchall()]
                    print(f"✅ Found tables: {tables}")
                    
                    # Test customer_loyalty_profiles table specifically
                    if 'customer_loyalty_profiles' in tables:
                        result = await session.execute(text(
                            'SELECT COUNT(*) FROM customer_loyalty_profiles'
                        ))
                        count = result.scalar()
                        print(f"✅ customer_loyalty_profiles table has {count} records")
                        
                        # Test the exact query from dashboard endpoint
                        result = await session.execute(
                            text('SELECT SUM(points_balance) FROM customer_loyalty_profiles')
                        )
                        total_points = result.scalar() or 0
                        print(f"✅ Total points from profiles: {total_points}")
                        
                    else:
                        print("❌ customer_loyalty_profiles table not found")
                        
                except Exception as table_error:
                    print(f"❌ Error querying tables: {str(table_error)}")
                    
            except Exception as session_error:
                print(f"❌ Error in session operations: {str(session_error)}")
            finally:
                await session.close()
                break
                
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False
        
    return True

async def test_dashboard_logic():
    """Test the dashboard endpoint logic directly"""
    print("\nTesting dashboard logic...")
    
    try:
        async for session in get_db():
            try:
                # Mirror the exact logic from dashboard endpoint
                result = await session.execute(
                    select(func.count()).select_from(CustomerLoyaltyProfile)
                )
                profile_count = result.scalar()
                print(f"✅ Profile count (SQLAlchemy): {profile_count}")
                
                # Test raw SQL version
                result = await session.execute(
                    text('SELECT COUNT(*) FROM customer_loyalty_profiles')
                )
                profile_count_raw = result.scalar()
                print(f"✅ Profile count (Raw SQL): {profile_count_raw}")
                
                # Test sum query
                result = await session.execute(
                    text('SELECT SUM(points_balance) FROM customer_loyalty_profiles')
                )
                total_points = result.scalar() or 0
                print(f"✅ Total points: {total_points}")
                
                # Create dashboard response
                dashboard_data = {
                    "total_points_issued": {
                        "value": int(total_points),
                        "percent_change": 15.2 if total_points > 0 else 0,
                    },
                    "active_members": {
                        "value": int(profile_count),
                        "percent_change": 8.7 if profile_count > 0 else 0,
                    },
                    "points_redeemed": {
                        "value": 0,
                        "percent_change": 0,
                    },
                    "revenue_impact": {
                        "value": float(total_points * 0.01),
                        "percent_change": 10.0 if total_points > 0 else 0,
                    },
                    "debug_info": {
                        "source": "TEST_SCRIPT",
                        "profile_count": profile_count,
                        "total_points": total_points,
                    }
                }
                
                print(f"✅ Dashboard data created successfully: {dashboard_data}")
                
            except Exception as logic_error:
                print(f"❌ Error in dashboard logic: {str(logic_error)}")
                import traceback
                traceback.print_exc()
            finally:
                await session.close()
                break
                
    except Exception as e:
        print(f"❌ Dashboard logic test failed: {str(e)}")
        import traceback
        traceback.print_exc()

async def main():
    """Main test function"""
    print("🔍 Starting database and dashboard diagnostics...\n")
    
    # Test database connection
    db_ok = await test_database_connection()
    
    if db_ok:
        # Test dashboard logic
        await test_dashboard_logic()
    else:
        print("❌ Skipping dashboard tests due to database connection issues")
    
    print("\n🔍 Diagnostics completed!")

if __name__ == "__main__":
    asyncio.run(main()) 