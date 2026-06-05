"""add in-app inbox read/dismissed state to notification_history

Revision ID: a1b2c3d4e5f6
Revises: f55510b1e0cd
Create Date: 2026-06-03 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f55510b1e0cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # In-app inbox state: null = unread/active; set when the user reads/dismisses the item.
    op.add_column(
        'notification_history',
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'notification_history',
        sa.Column('dismissed_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('notification_history', 'dismissed_at')
    op.drop_column('notification_history', 'read_at')
