"""section summary table

The AI's per-section news synthesis: one upserted row per surveillance section (a domain, or a
critical industry keyed "industry:<id>") holding the latest orientation snapshot + key tickers.
/world reads the domain sections; the daily digest reads the per-industry ones.

Revision ID: d4b8c2f15a37
Revises: c3e7a1b9f240
Create Date: 2026-06-23 00:05:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd4b8c2f15a37'
down_revision: Union[str, None] = 'c3e7a1b9f240'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'section_summary',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('section_key', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=128), nullable=False),
        sa.Column('snapshot', sa.Text(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('model_name', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('data_through', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_section_summary')),
    )
    op.create_index(op.f('ix_section_summary_section_key'), 'section_summary', ['section_key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_section_summary_section_key'), table_name='section_summary')
    op.drop_table('section_summary')
