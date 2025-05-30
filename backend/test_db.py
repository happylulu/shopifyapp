#!/usr/bin/env python3
"""
Test database connection and session storage
"""

import os
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file."""
    env_path = Path(__file__).parent / ".env"
    print(f"Looking for .env file at: {env_path}")

    if env_path.exists():
        print("✅ .env file found")
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
                    if key == 'DATABASE_URL':
                        print(f"✅ DATABASE_URL loaded: {value[:50]}...")
    else:
        print("❌ .env file not found")

async def test_connection():
    """Test database connection and check session storage"""
    load_env()

    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment")
        return

    print(f"🔗 Testing connection to: {DATABASE_URL[:50]}...")

    try:
        engine = create_async_engine(DATABASE_URL)

        async with engine.begin() as conn:
            # Test basic connection
            result = await conn.execute(text('SELECT 1'))
            print('✅ Database connection successful!')

            # List all tables to see what's available
            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
            ))
            tables = result.fetchall()
            print(f'📋 Available tables: {[t[0] for t in tables]}')

            # Check if Session table exists (case insensitive)
            result = await conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables WHERE LOWER(table_name) = 'session'"
            ))
            table_exists = result.scalar()
            print(f'✅ Session table exists: {table_exists > 0}')

            if table_exists > 0:
                # Check sessions
                result = await conn.execute(text('SELECT COUNT(*) FROM "Session"'))
                session_count = result.scalar()
                print(f'📊 Total sessions: {session_count}')

                if session_count > 0:
                    result = await conn.execute(text(
                        'SELECT shop, "accessToken" IS NOT NULL as has_token FROM "Session" LIMIT 3'
                    ))
                    sessions = result.fetchall()
                    print('🏪 Sessions found:')
                    for session in sessions:
                        print(f'   Shop: {session[0]}, Has Token: {session[1]}')
                else:
                    print('⚠️  No sessions found - app may not be installed yet')
            else:
                print('❌ Session table does not exist')

        await engine.dispose()

    except Exception as e:
        print(f'❌ Database connection failed: {e}')

if __name__ == "__main__":
    asyncio.run(test_connection())
