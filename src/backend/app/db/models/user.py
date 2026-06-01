"""User preferences (singleton).

User-driven, rarely changes. Interested sectors are stored as taxonomy keys. The market
pulse set is split: the fixed ``pulse_core`` lives in ``app/config.py`` (a constant, not a
table); the user-chosen mega-caps (``pulse_user``) are editable and live here as tickers.
"""

from __future__ import annotations

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PydanticJSONB, TimestampMixin, intpk
from app.db.payloads import QuietHours, Thresholds, UserChannels


class UserPreferences(Base, TimestampMixin):
    """Singleton row (id=1)."""

    __tablename__ = "user_preferences"

    id: Mapped[intpk]
    interested_sectors: Mapped[list[str]] = mapped_column(
        ARRAY(String(64)), default=list, server_default=text("'{}'::varchar[]"), nullable=False
    )
    # User-chosen mega-caps for the pulse set, as yFinance ticker symbols.
    pulse_user: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)), default=list, server_default=text("'{}'::varchar[]"), nullable=False
    )
    default_thresholds: Mapped[Thresholds | None] = mapped_column(
        PydanticJSONB(Thresholds), nullable=True
    )
    channels: Mapped[UserChannels | None] = mapped_column(PydanticJSONB(UserChannels), nullable=True)
    quiet_hours: Mapped[QuietHours | None] = mapped_column(PydanticJSONB(QuietHours), nullable=True)
