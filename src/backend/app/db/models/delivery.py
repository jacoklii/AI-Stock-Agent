"""Delivery: the two output shapes + the notification ledger.

The detailed digest (``ReadingListRun``, 1/day) and the brief pulse (``PulseRun``, 3/day +
on-demand) are kept entirely separate — different cadence, template, and channel. Both
mirror into the in-app inbox. ``NotificationHistory`` is the cross-cutting ledger written by
any send on any channel; its ``dedupe_key`` prevents duplicates across channels and across
sources covering the same event.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, PydanticJSONB, TimestampMixin, intpk
from app.db.enums import Channel, PulseSlot, channel_enum, pulse_slot_enum
from app.db.payloads import DigestSection, PulseInstrument


class ReadingListRun(Base, TimestampMixin, FreshnessMixin):
    """One row per compiled reading list. Sections are typed JSONB; article refs point
    into ``news_events`` rather than duplicating content."""

    __tablename__ = "reading_list_runs"

    id: Mapped[intpk]
    top_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    sections: Mapped[list[DigestSection]] = mapped_column(
        PydanticJSONB(list[DigestSection]),
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
    )
    source_event_ids: Mapped[list[int]] = mapped_column(
        ARRAY(BigInteger),
        default=list,
        server_default=text("'{}'::bigint[]"),
        nullable=False,
    )


class PulseRun(Base, TimestampMixin, FreshnessMixin):
    """One row per pulse. Instrument readings are typed JSONB."""

    __tablename__ = "pulse_runs"

    id: Mapped[intpk]
    slot: Mapped[PulseSlot] = mapped_column(pulse_slot_enum, index=True)
    pulse_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    instruments: Mapped[list[PulseInstrument]] = mapped_column(
        PydanticJSONB(list[PulseInstrument]),
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
    )
    channel_sent: Mapped[Channel | None] = mapped_column(channel_enum, nullable=True)


class NotificationHistory(Base, TimestampMixin):
    __tablename__ = "notification_history"

    id: Mapped[intpk]
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    channel: Mapped[Channel] = mapped_column(channel_enum, index=True)
    template: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ref_type: Mapped[str | None] = mapped_column(String(32), nullable=True)  # e.g. 'news_event'
    ref_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    dedupe_key: Mapped[str] = mapped_column(String(256), unique=True)
