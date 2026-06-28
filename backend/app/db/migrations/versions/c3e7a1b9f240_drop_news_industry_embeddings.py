"""drop news + industry embedding layer

Alpha Vantage's structured tickers/topics replaced the embedding-based news dedup, orphan→industry
routing, and "related events" surfaces, so the per-article embedding columns and the industry
routing embeddings are no longer written or read. Drop them. Voyage embeddings remain on analysis,
research_state, fundamental, and user_interest (unaffected).

Revision ID: c3e7a1b9f240
Revises: b1f4c7a2e9d0
Create Date: 2026-06-23 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy.vector


# revision identifiers, used by Alembic.
revision: str = 'c3e7a1b9f240'
down_revision: Union[str, None] = 'b1f4c7a2e9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index('ix_news_events_embedding_hnsw', table_name='news_events', postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.drop_column('news_events', 'embedding_model')
    op.drop_column('news_events', 'embedding')
    op.drop_index('ix_industries_embedding_hnsw', table_name='industries', postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.drop_column('industries', 'embedding_model')
    op.drop_column('industries', 'embedding')


def downgrade() -> None:
    op.add_column('industries', sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=1024), nullable=True))
    op.add_column('industries', sa.Column('embedding_model', sa.String(length=64), nullable=True))
    op.create_index('ix_industries_embedding_hnsw', 'industries', ['embedding'], unique=False, postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.add_column('news_events', sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=1024), nullable=True))
    op.add_column('news_events', sa.Column('embedding_model', sa.String(length=64), nullable=True))
    op.create_index('ix_news_events_embedding_hnsw', 'news_events', ['embedding'], unique=False, postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
