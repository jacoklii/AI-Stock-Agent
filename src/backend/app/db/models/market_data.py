"""Per-company market time series, internally DECOUPLED by cadence.

These tables share a module for cohesion but NOT a write path: prices land daily,
financials quarterly, calendar events ad-hoc. They must never share a write transaction —
different cadences, different ingest jobs.

``financials`` is populated for ``watchlist`` + ``industry_critical`` companies only;
the broader discovered surface gets price tracking only.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Float, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PydanticJSONB, TimestampMixin, intpk
from app.db.enums import CalendarEventType, PeriodType, calendar_event_type_enum, period_type_enum
from app.db.payloads import CalendarPayload

_MONEY = Numeric(20, 4)


class Price(Base, TimestampMixin):
    """Daily OHLCV. Intraday is pulled on demand and not stored here."""

    __tablename__ = "prices"
    __table_args__ = (UniqueConstraint("company_id", "date"),)

    id: Mapped[intpk]
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date)
    open: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    high: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    low: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    close: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    adj_close: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    volume: Mapped[int | None] = mapped_column(Numeric(20, 0), nullable=True)


class Financial(Base, TimestampMixin):
    """One row per company per reporting period. Populated for watchlist +
    industry_critical companies only — deliberate cost/focus boundary."""

    __tablename__ = "financials"
    __table_args__ = (UniqueConstraint("company_id", "period_end", "period_type"),)

    id: Mapped[intpk]
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    period_end: Mapped[date] = mapped_column(Date)
    period_type: Mapped[PeriodType] = mapped_column(period_type_enum, index=True)
    price: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    market_cap: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    pe: Mapped[float | None] = mapped_column(Float, nullable=True)
    eps: Mapped[float | None] = mapped_column(Float, nullable=True)
    capex: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    ebitda: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    revenue: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)
    net_income: Mapped[Decimal | None] = mapped_column(_MONEY, nullable=True)


class CatalystCalendar(Base, TimestampMixin):
    """Earnings / dividend / ex-dividend dates. Variable details go in ``payload``."""

    __tablename__ = "catalyst_calendar"
    __table_args__ = (UniqueConstraint("company_id", "event_type", "event_date"),)

    id: Mapped[intpk]
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[CalendarEventType] = mapped_column(calendar_event_type_enum, index=True)
    event_date: Mapped[date] = mapped_column(Date, index=True)
    payload: Mapped[CalendarPayload | None] = mapped_column(PydanticJSONB(CalendarPayload), nullable=True)
