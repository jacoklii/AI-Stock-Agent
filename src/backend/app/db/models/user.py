"""User preferences (singleton).

User-driven, rarely changes. ``interested_sectors`` is a list of sector name strings.
``critical_industries`` is a list of ``industries.id`` values the user has flagged —
this drives which companies get ``industry_critical`` coverage tier. The brief set is
split: the fixed ``BRIEF_CORE`` lives in ``app/config.py`` (a constant, not a table);
the user-chosen mega-caps (``brief_user``) are editable and live here as tickers.
``weekly_token_budget`` caps the agent's spend; the agent self-throttles to fit.
"""

from __future__ import annotations

from sqlalchemy import Integer, String, text
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
    # Foreign keys into industries.id — the critical industries the user is tracking.
    critical_industries: Mapped[list[int]] = mapped_column(
        ARRAY(Integer), default=list, server_default=text("'{}'::integer[]"), nullable=False
    )
    # User-chosen mega-caps for the brief, as yFinance ticker symbols.
    brief_user: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)), default=list, server_default=text("'{}'::varchar[]"), nullable=False
    )
    default_thresholds: Mapped[Thresholds | None] = mapped_column(
        PydanticJSONB(Thresholds), nullable=True
    )
    channels: Mapped[UserChannels | None] = mapped_column(PydanticJSONB(UserChannels), nullable=True)
    quiet_hours: Mapped[QuietHours | None] = mapped_column(PydanticJSONB(QuietHours), nullable=True)
    # Weekly token budget in tokens. Agent self-paces; None = no cap.
    weekly_token_budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
