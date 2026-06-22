"""news_event domain classifier column

Revision ID: b1f4c7a2e9d0
Revises: 267d55e6ef0c
Create Date: 2026-06-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b1f4c7a2e9d0'
down_revision: Union[str, None] = '267d55e6ef0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The new surveillance-domain enum type, then the nullable column + its index. Nullable so
    # existing rows (and classifier abstentions) degrade to the keyword router in /world until the
    # backfill script fills them.
    news_domain = postgresql.ENUM(
        'geopolitics', 'macro', 'industry', 'market', name='news_domain'
    )
    news_domain.create(op.get_bind(), checkfirst=True)
    op.add_column('news_events', sa.Column('domain', news_domain, nullable=True))
    op.create_index('ix_news_events_domain', 'news_events', ['domain'])


def downgrade() -> None:
    op.drop_index('ix_news_events_domain', table_name='news_events')
    op.drop_column('news_events', 'domain')
    postgresql.ENUM(name='news_domain').drop(op.get_bind(), checkfirst=True)
