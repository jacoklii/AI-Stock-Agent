"""News events — the high-volume ingest surface.

``NewsEvent`` is tracked for any company the AI touches (the full research surface).
Events that don't clear the significance threshold are dropped at ingest and never
stored here. The ``summary`` is the canonical record — raw article body is never stored.
The summary's embedding is written in the same transaction as the row.

URL is first-class display content; ``significance`` is the Haiku classifier's score
(0–1) indicating how material the event is. Events are associated to a company via
``company_id`` (optional FK, set when the event maps to a single company) and to the
broader tickers array for multi-company events.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, TimestampMixin, embedding_vector, intpk
from app.db.enums import NewsDomain, news_domain_enum


class NewsEvent(Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "news_events"
    __table_args__ = (
        Index("ix_news_events_published_significance", "published_at", "significance"),
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
    # Industry home for the event. Ticker-matched events inherit the company's industry; orphan
    # macro/general items are routed to their closest industry by embedding similarity at ingest, so
    # a section can pull macro context that names no single company. Null when nothing fits.
    industry_id: Mapped[int | None] = mapped_column(
        ForeignKey("industries.id", ondelete="SET NULL"), index=True, nullable=True
    )
    # Unique so re-ingest is idempotent: the hourly breadth run dedups against this before
    # paying for summarization, and the constraint backstops any race.
    url: Mapped[str] = mapped_column(Text, unique=True)
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    headline: Mapped[str] = mapped_column(Text)
    tickers: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)), default=list, server_default=text("'{}'::varchar[]"), nullable=False
    )
    # Haiku classifier score 0–1. Events below the ingest threshold are dropped before
    # this row is written; all stored events cleared the bar.
    significance: Mapped[float] = mapped_column(Float, index=True)
    # Surveillance domain (geopolitics/macro/industry/market), classified at ingest by the
    # significance task and falling back to the deterministic keyword router. Nullable so older
    # rows (pre-backfill) and abstentions degrade to the heuristic in /world. Indexed for the feed.
    domain: Mapped[NewsDomain | None] = mapped_column(news_domain_enum, index=True, nullable=True)
    summary: Mapped[str] = mapped_column(Text)

    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
