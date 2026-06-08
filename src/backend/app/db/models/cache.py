"""TTL cache for external content fetched during research.

Cache holds full fetched content with a TTL; persistent storage holds extracted
summaries and findings only. Cache is never promoted to persistent storage — only
the findings extracted from cached content are. Content is cleared on TTL expiry
or manual bypass (cache_get checks freshness; expired rows are never returned).

``content_hash`` is a deterministic hash of the content, used to detect when a
re-fetch returns identical content and avoid redundant processing.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, intpk


class Cache(Base):
    __tablename__ = "cache"
    __table_args__ = (Index("ix_cache_fetched_at", "fetched_at"),)

    id: Mapped[intpk]
    url: Mapped[str] = mapped_column(Text, unique=True, index=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ttl_seconds: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    content_hash: Mapped[str] = mapped_column(String(64))
