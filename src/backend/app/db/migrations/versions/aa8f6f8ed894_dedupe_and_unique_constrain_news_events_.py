"""dedupe and unique-constrain news_events url

Daily re-ingest with a 1-day lookback (and the per-symbol Finnhub fetch) wrote duplicate URLs;
hourly breadth makes the URL the idempotency key. The upgrade deletes duplicate rows keeping the
lowest id per URL — the earliest row, the one most likely cited by ``analysis.supporting_inputs``
— before adding the constraint. The delete is irreversible; downgrade only drops the constraint.

Revision ID: aa8f6f8ed894
Revises: 2ee3043ce86a
Create Date: 2026-06-11 07:09:43.311819
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa8f6f8ed894'
down_revision: Union[str, None] = '2ee3043ce86a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "DELETE FROM news_events a USING news_events b "
        "WHERE a.url = b.url AND a.id > b.id"
    )
    op.create_unique_constraint(op.f('uq_news_events_url'), 'news_events', ['url'])


def downgrade() -> None:
    op.drop_constraint(op.f('uq_news_events_url'), 'news_events', type_='unique')
