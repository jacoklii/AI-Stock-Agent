"""Section summaries — the AI's per-section news synthesis.

One row per surveillance *section*: a domain (geopolitics / macro / industry / market) keyed by its
domain name, or a critical industry keyed ``"industry:<id>"``. This is the AI's only news writing —
synthesis happens per-section, not per-article (ingest just files Alpha Vantage's summaries). Each
run upserts the section's latest snapshot (orientation prose + key tickers); ``/world`` reads the
domain sections and the daily digest reads the per-industry ones. ``generated_at`` (FreshnessMixin)
marks when the synthesis was produced so the UI can show it as stale.
"""

from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, PydanticJSONB, TimestampMixin, intpk
from app.db.payloads import SectionSummaryPayload


class SectionSummary(Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "section_summary"

    id: Mapped[intpk]
    # "geopolitics" | "macro" | "industry" | "market" for the surveillance domains, or
    # "industry:<id>" for a critical industry. Unique so each section has exactly one current row.
    section_key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(128))
    snapshot: Mapped[str] = mapped_column(Text)
    payload: Mapped[SectionSummaryPayload] = mapped_column(
        PydanticJSONB(SectionSummaryPayload), nullable=False
    )
    model_name: Mapped[str] = mapped_column(String(64))
