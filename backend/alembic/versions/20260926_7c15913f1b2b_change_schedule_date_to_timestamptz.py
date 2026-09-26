"""change_schedule_date_to_timestamptz

Revision ID: 7c15913f1b2b
Revises: e7c319125dd9
Create Date: 2026-09-26 13:06:50.158116

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7c15913f1b2b'
down_revision: Union[str, None] = 'e7c319125dd9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('stock_operations', 'schedule_date',
               existing_type=sa.Date(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True)


def downgrade() -> None:
    op.alter_column('stock_operations', 'schedule_date',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.Date(),
               existing_nullable=True)
