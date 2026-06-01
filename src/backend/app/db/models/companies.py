"""Company identity + the controlled taxonomy it is classified by.

``companies`` is the spine AND the research surface: every stock the AI has ever touched
lives here, distinguished by ``coverage_tier``. ``watchlist_metadata`` holds the per-stock
context that only exists once a company is promoted — it changes on the same user
promote/demote action as the tier, so the two are coupled (1:1, cascade).

The taxonomy (``sectors``, ``industries``) is the controlled vocabulary, modelled as
lookup tables (not enums) so new critical industries are an INSERT, not a migration.
``industry`` is the "who gets affected" key. All joins elsewhere are on ``company_id``.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, PydanticJSONB, TimestampMixin, intpk
from app.db.enums import CoverageTier, coverage_tier_enum
from app.db.payloads import Thresholds


class Sector(Base, TimestampMixin):
    __tablename__ = "sectors"

    id: Mapped[intpk]
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))

    industries: Mapped[list["Industry"]] = relationship(back_populates="sector")


class Industry(Base, TimestampMixin):
    __tablename__ = "industries"

    id: Mapped[intpk]
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    sector_id: Mapped[int] = mapped_column(ForeignKey("sectors.id"), index=True)

    sector: Mapped["Sector"] = relationship(back_populates="industries")


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[intpk]
    # yFinance ticker symbol (e.g. AAPL, BRK-B, ^GSPC). 20 chars covers the full yFinance
    # symbol space (index `^`, share-class `-`, suffixes like GC=F / DX-Y.NYB / BTC-USD).
    # External identifier only — joins are on company_id, never the ticker.
    ticker: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(256))
    sector_id: Mapped[int | None] = mapped_column(ForeignKey("sectors.id"), index=True, nullable=True)
    industry_id: Mapped[int | None] = mapped_column(ForeignKey("industries.id"), index=True, nullable=True)
    exchange: Mapped[str | None] = mapped_column(String(32), nullable=True)
    coverage_tier: Mapped[CoverageTier] = mapped_column(
        coverage_tier_enum,
        default=CoverageTier.discovered,
        server_default=CoverageTier.discovered.value,
        index=True,
    )

    watchlist_meta: Mapped["WatchlistMetadata | None"] = relationship(
        back_populates="company", uselist=False, cascade="all, delete-orphan"
    )


class WatchlistMetadata(Base, TimestampMixin):
    __tablename__ = "watchlist_metadata"

    id: Mapped[intpk]
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), unique=True, index=True
    )
    why_added: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_relevant: Mapped[str | None] = mapped_column(Text, nullable=True)
    thresholds: Mapped[Thresholds | None] = mapped_column(PydanticJSONB(Thresholds), nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="watchlist_meta")
