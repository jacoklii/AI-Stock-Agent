"""All ORM models, grouped by coupling.

Importing this package registers every mapped class on ``Base.metadata`` (used by Alembic's
``target_metadata`` and by tests). Grouping follows the coupling principle — "couple what
updates together, never couple what doesn't" — see each module's docstring.
"""

from __future__ import annotations

from app.db.models.companies import Company, Industry, Sector, WatchlistMetadata
from app.db.models.market_data import CatalystCalendar, FinancialData, PriceHistory
from app.db.models.news import NewsEvent, SectorAggregate
from app.db.models.analysis import (
    Citation,
    FundamentalProse,
    FundamentalScore,
    SentimentalProse,
    SentimentalScore,
)
from app.db.models.delivery import NotificationHistory, PulseRun, ReadingListRun
from app.db.models.user import UserPreferences
from app.db.models.jobs import Job

__all__ = [
    # companies + taxonomy
    "Sector",
    "Industry",
    "Company",
    "WatchlistMetadata",
    # market data
    "PriceHistory",
    "FinancialData",
    "CatalystCalendar",
    # news
    "NewsEvent",
    "SectorAggregate",
    # analysis
    "FundamentalScore",
    "SentimentalScore",
    "FundamentalProse",
    "SentimentalProse",
    "Citation",
    # delivery
    "ReadingListRun",
    "PulseRun",
    "NotificationHistory",
    # user + jobs
    "UserPreferences",
    "Job",
]
