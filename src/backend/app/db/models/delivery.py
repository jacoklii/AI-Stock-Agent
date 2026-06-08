"""Delivery: the notification ledger + in-app inbox.

Per ARCHITECTURE.md the only persisted delivery surface is ``notifications`` — the
cross-cutting ledger written by any send on any channel, which also backs the in-app inbox
(``read_at`` / ``dismissed_at``). The two output shapes are deliberately NOT persisted as their
own tables: the detailed digest is reconstructed from ``analysis`` (type=summary) plus the
article refs it cites, and the brief is regenerated live from quotes. ``Notification``'s unique
constraint on ``(channel, content_hash)`` prevents duplicates across channels and across sources
covering the same event.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, intpk
from app.db.enums import Channel, channel_enum


class Notification(Base, TimestampMixin):
    """Cross-cutting ledger for every send on any channel.

    Dedup is enforced at the DB level: ``(channel, content_hash)`` must be unique.
    The ``content_hash`` is a deterministic hash of the notification content, so the
    same logical message on the same channel is never sent twice. ``read_at`` /
    ``dismissed_at`` back the in-app inbox (null = unread/active).
    """

    __tablename__ = "notifications"
    __table_args__ = (UniqueConstraint("channel", "content_hash"),)

    id: Mapped[intpk]
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    channel: Mapped[Channel] = mapped_column(channel_enum, index=True)
    template: Mapped[str | None] = mapped_column(String(64), nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64))
    ref_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ref_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    # In-app inbox state — null = unread/active.
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    dismissed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
