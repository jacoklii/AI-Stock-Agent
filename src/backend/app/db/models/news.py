"""News events + sector aggregates.

``NewsEvent`` is high-volume and ad-hoc, tracked for any company the AI touches (the full
research surface), keyed to both a company (optional) and an industry (the "who gets
affected" link). The ``summary`` is the canonical record — the raw article body is never
stored. The summary's embedding is written in the SAME transaction as the row, and carries
its model name. ``SectorAggregate`` rolls sector-level price/breadth/sentiment up daily.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, TimestampMixin, embedding_vector, intpk
from app.db.enums import SignificanceTier, significance_tier_enum


class NewsEvent(Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "news_events"
    __table_args__ = (
        # Common access pattern: recent events filtered by significance.
        Index("ix_news_events_published_significance", "published_at", "significance_tier"),
        # Approximate-NN search over summary embeddings (cosine). Declared here so the
        # model metadata owns it and migrations don't drift; DDL is in the migration.
        Index(
            "ix_news_events_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True
    )
    industry_id: Mapped[int | None] = mapped_column(
        ForeignKey("industries.id", ondelete="SET NULL"), index=True, nullable=True
    )
    url: Mapped[str] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    headline: Mapped[str] = mapped_column(Text)
    # yFinance ticker symbols mentioned by the event.
    tickers: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)), default=list, server_default=text("'{}'::varchar[]"), nullable=False
    )
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # -1..1
    significance_tier: Mapped[SignificanceTier] = mapped_column(significance_tier_enum, index=True)
    summary: Mapped[str] = mapped_column(Text)  # canonical record; no raw body stored

    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)


class SectorAggregate(Base, TimestampMixin):
    """Rolled-up sector state — keyed by sector, not company. Daily cadence."""

    __tablename__ = "sector_aggregate"
    __table_args__ = (UniqueConstraint("sector_id", "date"),)

    id: Mapped[intpk]
    sector_id: Mapped[int] = mapped_column(ForeignKey("sectors.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date)
    etf_price: Mapped[float | None] = mapped_column(Numeric(20, 4), nullable=True)
    breadth: Mapped[float | None] = mapped_column(Float, nullable=True)  # e.g. fraction advancing
    rolled_sentiment: Mapped[float | None] = mapped_column(Float, nullable=True)  # -1..1
