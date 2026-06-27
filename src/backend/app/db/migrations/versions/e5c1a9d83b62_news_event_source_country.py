"""news_event source_country (GDELT geographic field)

Revision ID: e5c1a9d83b62
Revises: d4b8c2f15a37
Create Date: 2026-06-24 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5c1a9d83b62'
down_revision: Union[str, None] = 'd4b8c2f15a37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The geographic dimension GDELT brings: the country a global-events article is attributed to.
    # Nullable — Alpha Vantage's financial feed has no geography, so AV rows stay null. Indexed so
    # the feed/tools can read geopolitics events by country.
    op.add_column('news_events', sa.Column('source_country', sa.String(length=64), nullable=True))
    op.create_index('ix_news_events_source_country', 'news_events', ['source_country'])


def downgrade() -> None:
    op.drop_index('ix_news_events_source_country', table_name='news_events')
    op.drop_column('news_events', 'source_country')
