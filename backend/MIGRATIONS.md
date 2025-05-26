# Database Migrations Guide

This guide explains how to use the Alembic migration system for managing database schema changes in the Shopify Loyalty App backend.

## Overview

We use [Alembic](https://alembic.sqlalchemy.org/) for database migrations, which provides:
- Version control for database schema
- Safe schema changes with rollback capability
- Automatic migration generation from model changes
- Support for async SQLAlchemy

## Quick Start

### Initial Setup (New Environment)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Initialize database with migrations
python init_db_with_migrations.py
```

### Daily Development Workflow

```bash
# 1. Create a new migration after changing models
python migrate.py create "Add new column to users table"

# 2. Apply pending migrations
python migrate.py upgrade

# 3. Check current migration status
python migrate.py current
```

## Migration Commands

### Using the migrate.py script (Recommended)

```bash
# Apply all pending migrations
python migrate.py upgrade

# Apply migrations up to a specific revision
python migrate.py upgrade abc123

# Rollback one migration
python migrate.py downgrade -1

# Rollback to a specific revision
python migrate.py downgrade abc123

# Create a new migration
python migrate.py create "Description of changes"

# Show current migration
python migrate.py current

# Show migration history
python migrate.py history

# Check if database is up to date
python migrate.py check

# Reset database (WARNING: destructive)
python migrate.py reset
```

### Using Alembic directly

```bash
# Apply migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Add new table"

# Show current revision
alembic current

# Show history
alembic history

# Downgrade
alembic downgrade -1
```

## File Structure

```
backend/
├── alembic/                    # Alembic configuration
│   ├── env.py                 # Alembic environment config (async setup)
│   ├── script.py.mako         # Migration template
│   └── versions/              # Migration files
│       └── xxx_initial_migration.py
├── alembic.ini                # Alembic configuration file
├── models_v2.py               # Enhanced database models and connection
├── migrate.py                 # Migration management script
├── init_db_with_migrations.py # Database initialization script
└── MIGRATIONS.md              # This file
```

## Creating Migrations

### Automatic Generation (Recommended)

When you modify models in `models_v2.py`, create a migration:

```bash
python migrate.py create "Add email verification to users"
```

This will:
1. Compare current models with database schema
2. Generate migration with necessary changes
3. Create a new file in `alembic/versions/`

### Manual Migration

For complex changes, you can create an empty migration:

```bash
alembic revision -m "Custom data migration"
```

Then edit the generated file to add custom logic.

## Best Practices

### 1. Always Review Generated Migrations

Before applying, check the generated migration file:
- Verify the changes are correct
- Add any necessary data migrations
- Test on a copy of production data

### 2. Naming Conventions

Use descriptive migration messages:
- ✅ "Add email verification to users table"
- ✅ "Create loyalty points tracking table"
- ❌ "Update database"
- ❌ "Fix stuff"

### 3. Testing Migrations

```bash
# Test upgrade
python migrate.py upgrade

# Test downgrade
python migrate.py downgrade -1

# Test upgrade again
python migrate.py upgrade
```

### 4. Production Deployment

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Apply migrations
python migrate.py upgrade

# 3. Verify application works
# 4. If issues, rollback:
python migrate.py downgrade -1
```

## Common Scenarios

### Adding a New Table

1. Add model to `models_v2.py`:
```python
class NewTable(Base):
    __tablename__ = "new_table"
    id = Column(Integer, primary_key=True)
    name = Column(String)
```

2. Create migration:
```bash
python migrate.py create "Add new_table"
```

3. Apply migration:
```bash
python migrate.py upgrade
```

### Adding a Column

1. Add column to existing model:
```python
class ExistingTable(Base):
    # ... existing columns ...
    new_column = Column(String, nullable=True)
```

2. Create and apply migration:
```bash
python migrate.py create "Add new_column to existing_table"
python migrate.py upgrade
```

### Renaming a Column

Alembic can't auto-detect renames. Create a manual migration:

```python
def upgrade():
    op.alter_column('table_name', 'old_name', new_column_name='new_name')

def downgrade():
    op.alter_column('table_name', 'new_name', new_column_name='old_name')
```

## Troubleshooting

### Migration Conflicts

If multiple developers create migrations simultaneously:

```bash
# 1. Pull latest changes
git pull

# 2. Merge migration heads
alembic merge heads -m "Merge migration heads"

# 3. Apply merged migration
python migrate.py upgrade
```

### Database Out of Sync

If your database schema doesn't match migrations:

```bash
# Option 1: Reset database (development only)
python migrate.py reset

# Option 2: Mark current state as migrated
alembic stamp head
```

### Connection Issues

Check your DATABASE_URL environment variable:

```bash
echo $DATABASE_URL
```

For Neon/PostgreSQL, ensure the URL format is:
```
postgresql+asyncpg://user:pass@host/db?ssl=require
```

## Environment Variables

The migration system uses these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- If not set, uses the default Neon connection from `models_v2.py`

## Integration with Application

The `init_db()` function in `models_v2.py` has been updated to use migrations automatically. It will:

1. Try to use Alembic migrations if available
2. Fall back to `create_all()` if migrations aren't set up
3. Provide compatibility with existing code

This ensures smooth transition from the old system to migrations.
