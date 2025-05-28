"""Add rule engine tables

Revision ID: 004_add_rule_engine
Revises: 003_add_referral_tables
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_rule_engine'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create rules table
    op.create_table('rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shop_domain', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=True),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('actions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('execution_count', sa.Integer(), nullable=True),
        sa.Column('last_executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for rules table
    op.create_index('idx_rules_shop_event_status', 'rules', ['shop_domain', 'event_type', 'status'])
    op.create_index('idx_rules_priority', 'rules', ['priority'])
    op.create_index(op.f('ix_rules_event_type'), 'rules', ['event_type'])
    op.create_index(op.f('ix_rules_shop_domain'), 'rules', ['shop_domain'])
    op.create_index(op.f('ix_rules_status'), 'rules', ['status'])

    # Create rule_versions table
    op.create_table('rule_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rule_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('actions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('change_notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for rule_versions table
    op.create_index('idx_rule_versions_rule_version', 'rule_versions', ['rule_id', 'version_number'])

    # Create rule_executions table
    op.create_table('rule_executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rule_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shop_domain', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('customer_id', sa.String(length=255), nullable=True),
        sa.Column('conditions_met', sa.Boolean(), nullable=False),
        sa.Column('actions_executed', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for rule_executions table
    op.create_index('idx_rule_executions_shop_customer', 'rule_executions', ['shop_domain', 'customer_id'])
    op.create_index('idx_rule_executions_executed_at', 'rule_executions', ['executed_at'])
    op.create_index(op.f('ix_rule_executions_customer_id'), 'rule_executions', ['customer_id'])
    op.create_index(op.f('ix_rule_executions_shop_domain'), 'rule_executions', ['shop_domain'])

    # Create event_queue table
    op.create_table('event_queue',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shop_domain', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('customer_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=True),
        sa.Column('max_attempts', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for event_queue table
    op.create_index('idx_event_queue_status_scheduled', 'event_queue', ['status', 'scheduled_at'])
    op.create_index('idx_event_queue_shop_event', 'event_queue', ['shop_domain', 'event_type'])
    op.create_index(op.f('ix_event_queue_customer_id'), 'event_queue', ['customer_id'])
    op.create_index(op.f('ix_event_queue_event_type'), 'event_queue', ['event_type'])
    op.create_index(op.f('ix_event_queue_shop_domain'), 'event_queue', ['shop_domain'])
    op.create_index(op.f('ix_event_queue_status'), 'event_queue', ['status'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('event_queue')
    op.drop_table('rule_executions')
    op.drop_table('rule_versions')
    op.drop_table('rules')
