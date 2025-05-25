#!/usr/bin/env python3
"""
Database migration management script for the Shopify Loyalty App.

This script provides convenient commands for managing database migrations
using Alembic with async SQLAlchemy.

Usage:
    python migrate.py upgrade          # Apply all pending migrations
    python migrate.py downgrade -1     # Rollback one migration
    python migrate.py current          # Show current migration
    python migrate.py history          # Show migration history
    python migrate.py create "message" # Create new migration
    python migrate.py reset            # Reset database (WARNING: destructive)
"""

import asyncio
import os
import sys
import subprocess
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import engine, Base


def run_alembic_command(command: list[str]) -> int:
    """Run an alembic command and return the exit code."""
    try:
        result = subprocess.run(
            ["alembic"] + command,
            cwd=backend_dir,
            check=True,
            capture_output=False
        )
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error running alembic command: {e}")
        return e.returncode
    except FileNotFoundError:
        print("Error: alembic not found. Please install alembic: pip install alembic")
        return 1


async def reset_database():
    """Reset the database by dropping and recreating all tables."""
    print("⚠️  WARNING: This will drop all tables and data!")
    confirm = input("Are you sure you want to reset the database? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("Database reset cancelled.")
        return
    
    print("Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("Recreating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database reset complete!")


def main():
    """Main CLI interface for migration management."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "upgrade":
        # Apply migrations
        revision = sys.argv[2] if len(sys.argv) > 2 else "head"
        print(f"Upgrading database to {revision}...")
        exit_code = run_alembic_command(["upgrade", revision])
        if exit_code == 0:
            print("✅ Database upgrade complete!")
        sys.exit(exit_code)
    
    elif command == "downgrade":
        # Rollback migrations
        revision = sys.argv[2] if len(sys.argv) > 2 else "-1"
        print(f"Downgrading database to {revision}...")
        exit_code = run_alembic_command(["downgrade", revision])
        if exit_code == 0:
            print("✅ Database downgrade complete!")
        sys.exit(exit_code)
    
    elif command == "current":
        # Show current migration
        print("Current database revision:")
        sys.exit(run_alembic_command(["current"]))
    
    elif command == "history":
        # Show migration history
        print("Migration history:")
        sys.exit(run_alembic_command(["history"]))
    
    elif command == "create":
        # Create new migration
        if len(sys.argv) < 3:
            print("Error: Please provide a migration message")
            print("Usage: python migrate.py create 'Add new table'")
            sys.exit(1)
        
        message = sys.argv[2]
        print(f"Creating new migration: {message}")
        exit_code = run_alembic_command(["revision", "--autogenerate", "-m", message])
        if exit_code == 0:
            print("✅ Migration created successfully!")
        sys.exit(exit_code)
    
    elif command == "reset":
        # Reset database
        asyncio.run(reset_database())
    
    elif command == "check":
        # Check if database is up to date
        print("Checking database status...")
        exit_code = run_alembic_command(["check"])
        if exit_code == 0:
            print("✅ Database is up to date!")
        else:
            print("⚠️  Database needs migration!")
        sys.exit(exit_code)
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
