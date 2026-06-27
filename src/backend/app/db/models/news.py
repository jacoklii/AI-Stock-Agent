"""News events — the high-volume ingest surface.

``NewsEvent`` is tracked for any company the AI touches (the full research surface). Two sources
converge here: **Alpha Vantage** (financial news — macro / industry / market, with tickers + a
relevance score) and **GDELT** (geopolitics / global events, with a ``source_country`` and no
tickers). Items below the ingest relevance floor are dropped and never stored. The ``summary`` is
the source's own text — AV's extractive summary, or (GDELT has no body) the GDELT headline. The raw
article body is never stored, and ingest pays no LLM/embedding cost per article (synthesis is
per-section).

URL is first-class display content; ``significance`` is the event's relevance (0–1): AV's own
relevance score, or a fixed floor for GDELT (which ships no score). Events are associated to a
company via ``company_id`` (optional FK, set when the event maps to a single company) and to the
broader tickers array for multi-company events. ``source_country`` is the geographic dimension —
the country GDELT attributes the article to (null for AV's financial feed), enabling map/geo reads.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, TimestampMixin, intpk
from app.db.enums import NewsDomain, news_domain_enum


class NewsEvent(Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "news_events"
    __table_args__ = (
        Index("ix_news_events_published_significance", "published_at", "significance"),
    )

    id: Mapped[intpk]
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True
    )
    # Industry home for the event. Ticker-matched events inherit the company's industry; orphan
    # macro/general items stay unrouted (null) — Alpha Vantage's topic/ticker structure already
    # gives a section its context, so there's no embedding-based routing.
    industry_id: Mapped[int | None] = mapped_column(
        ForeignKey("industries.id", ondelete="SET NULL"), index=True, nullable=True
    )
    # Unique so re-ingest is idempotent: the breadth run dedups against this before writing,
    # and the constraint backstops any race.
    url: Mapped[str] = mapped_column(Text, unique=True)
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    headline: Mapped[str] = mapped_column(Text)
    tickers: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)), default=list, server_default=text("'{}'::varchar[]"), nullable=False
    )
    # Alpha Vantage relevance score 0–1. Items below the ingest floor are dropped before this
    # row is written; all stored events cleared the bar.
    significance: Mapped[float] = mapped_column(Float, index=True)
    # Surveillance domain (geopolitics/macro/industry/market), resolved at ingest: explicit
    # geopolitics keywords first, then AV's topic hint, then the deterministic keyword router.
    # Nullable so older rows and abstentions degrade to the heuristic in /world. Indexed for the feed.
    domain: Mapped[NewsDomain | None] = mapped_column(news_domain_enum, index=True, nullable=True)
    summary: Mapped[str] = mapped_column(Text)
    # Geographic dimension — the country GDELT attributes the article to (e.g. "United States").
    # Null for Alpha Vantage's financial feed, which carries no geography. Indexed so the feed/tools
    # can read geopolitics by country (the GDELT "geographical mapping" surface).
    source_country: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
