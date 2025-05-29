"""merge_multiple_heads

Revision ID: 97b85a6cd2f3
Revises: 004_add_rule_engine, df136b9547cf
Create Date: 2025-05-28 19:30:18.206179

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97b85a6cd2f3'
down_revision: Union[str, None] = ('004_add_rule_engine', 'df136b9547cf')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
