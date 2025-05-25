#!/usr/bin/env python3
"""
Initialize database with migrations for the Shopify Loyalty App.

This script sets up the database using Alembic migrations instead of
the old create_all() approach. It should be run once when setting up
a new environment.

Usage:
    python init_db_with_migrations.py
"""

import asyncio
import subprocess
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


async def check_database_connection():
    """Check if we can connect to the database."""
    try:
        from database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def run_alembic_command(command: list[str]) -> bool:
    """Run an alembic command and return success status."""
    try:
        result = subprocess.run(
            ["alembic"] + command,
            cwd=backend_dir,
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running alembic command: {e}")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False
    except FileNotFoundError:
        print("Error: alembic not found. Please install alembic: pip install alembic")
        return False


async def check_migration_status():
    """Check if migrations have been applied."""
    try:
        result = subprocess.run(
            ["alembic", "current"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=True
        )
        current_revision = result.stdout.strip()

        if not current_revision or "None" in current_revision:
            print("📋 No migrations have been applied yet.")
            return False
        else:
            print(f"📋 Current migration: {current_revision}")
            return True
    except subprocess.CalledProcessError:
        print("📋 Unable to check migration status.")
        return False


async def main():
    """Main initialization function."""
    print("🚀 Initializing database with migrations...")
    print("=" * 50)

    # Step 1: Check database connection
    print("1. Checking database connection...")
    if not await check_database_connection():
        print("❌ Cannot connect to database. Please check your DATABASE_URL.")
        sys.exit(1)

    # Step 2: Check if migrations have been applied
    print("\n2. Checking migration status...")
    migrations_applied = await check_migration_status()

    # Step 3: Apply migrations if needed
    if not migrations_applied:
        print("\n3. Applying initial migrations...")
        if run_alembic_command(["upgrade", "head"]):
            print("✅ Migrations applied successfully!")
        else:
            print("❌ Failed to apply migrations.")
            sys.exit(1)
    else:
        print("\n3. Checking for pending migrations...")
        # Check if there are any pending migrations
        try:
            result = subprocess.run(
                ["alembic", "check"],
                cwd=backend_dir,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("✅ Database is up to date!")
            else:
                print("⚠️  There are pending migrations. Applying them...")
                if run_alembic_command(["upgrade", "head"]):
                    print("✅ Pending migrations applied successfully!")
                else:
                    print("❌ Failed to apply pending migrations.")
                    sys.exit(1)
        except subprocess.CalledProcessError:
            print("⚠️  Unable to check for pending migrations.")

    # Step 4: Verify final state
    print("\n4. Verifying database state...")
    final_status = await check_migration_status()

    if final_status:
        print("\n🎉 Database initialization complete!")
        print("Your database is now ready to use with the migration system.")
        print("\nUseful commands:")
        print("  python migrate.py current   # Check current migration")
        print("  python migrate.py history   # View migration history")
        print("  python migrate.py create 'message'  # Create new migration")
        print("  python migrate.py upgrade   # Apply pending migrations")
    else:
        print("\n❌ Database initialization failed.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
