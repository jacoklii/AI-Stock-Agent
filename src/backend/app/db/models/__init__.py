"""All ORM models, grouped by coupling.

Importing this package registers every mapped class on ``Base.metadata`` (used by Alembic's
``target_metadata`` and by tests). Grouping follows the coupling principle — "couple what
updates together, never couple what doesn't" — see each module's docstring.
"""

from __future__ import annotations

from app.db.models.analysis import Analysis, Fundamental, Sentimental
from app.db.models.cache import Cache
from app.db.models.chat import ChatMessage
from app.db.models.companies import Company, Industry
from app.db.models.delivery import Notification
from app.db.models.market_data import CatalystCalendar, Financial, Price
from app.db.models.news import NewsEvent
from app.db.models.state import ResearchState
from app.db.models.tasks import Task
from app.db.models.user import UserPreferences
from app.db.models.user_interest import UserInterest

__all__ = [
    # companies + industries
    "Industry",
    "Company",
    # market data
    "Price",
    "Financial",
    "CatalystCalendar",
    # news
    "NewsEvent",
    # analysis
    "Fundamental",
    "Sentimental",
    "Analysis",
    # delivery
    "Notification",
    # chat
    "ChatMessage",
    # user
    "UserPreferences",
    "UserInterest",
    # research state + tasks
    "ResearchState",
    "Task",
    # cache
    "Cache",
]
