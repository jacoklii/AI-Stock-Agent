"""Company identity + the critical industries vocabulary it is classified against.

``companies`` is the spine and the research surface: every stock the AI has ever touched
lives here, distinguished by ``coverage_tier``. ``sector`` is a plain string (GICS or
user-supplied); ``industry_id`` is an optional FK to ``industries`` — the curated set of
critical industries the user is actively tracking. A company with ``industry_id`` set and
deep coverage is a prime candidate for ``industry_critical`` tier.

``industries`` is user-editable: adding an entry expands what the system tracks at depth.
All joins elsewhere are on ``company_id``, never ticker.
"""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, intpk
from app.db.enums import CoverageTier, coverage_tier_enum


class Industry(Base, TimestampMixin):
    """Controlled vocabulary of critical industries — user-editable.

    Each entry represents a domain the user is actively tracking (e.g. "AI / ML",
    "Quantum Computing", "Aerospace & Defense"). ``is_active`` lets the user pause
    a tracked industry without deleting it.
    """

    __tablename__ = "industries"

    id: Mapped[intpk]
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[intpk]
    # yFinance ticker symbol (e.g. AAPL, BRK-B, ^GSPC). External identifier only —
    # joins are on company_id, never the ticker.
    ticker: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(256))
    sector: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sub_industry: Mapped[str | None] = mapped_column(String(128), nullable=True)
    exchange: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # Optional link to the critical industries vocabulary. Set when this company is
    # relevant to a tracked industry; drives industry_critical tier assignment.
    industry_id: Mapped[int | None] = mapped_column(
        ForeignKey("industries.id", ondelete="SET NULL"), index=True, nullable=True
    )
    coverage_tier: Mapped[CoverageTier] = mapped_column(
        coverage_tier_enum,
        default=CoverageTier.discovered,
        server_default=CoverageTier.discovered.value,
        index=True,
    )

    industry: Mapped["Industry | None"] = relationship()
