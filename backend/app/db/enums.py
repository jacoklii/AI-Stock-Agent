"""Closed-set enumerations, as native Postgres enum types.

These are genuinely fixed vocabularies (unlike industries, which is an extensible
lookup table). Each is exposed as a shared SQLAlchemy ENUM instance so a name maps to
exactly one type even when reused across tables. DDL for these types is owned by the
migrations (``create_type=False``); ``values_callable`` stores the lowercase ``.value``,
not the Python member name.
"""

from __future__ import annotations

import enum

from sqlalchemy import Enum as SAEnum


class CoverageTier(str, enum.Enum):
    watchlist = "watchlist"          # deep coverage: scores + prose
    industry_critical = "industry_critical"  # critical to a tracked industry: scores + prose
    discovered = "discovered"        # lightweight tracking (research surface)
    archived = "archived"            # excluded from all active coverage


class StateStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class AnalysisType(str, enum.Enum):
    fundamental = "fundamental"
    sentimental = "sentimental"
    event_driven = "event_driven"
    summary = "summary"


class NewsDomain(str, enum.Enum):
    """The surveillance domain a news event belongs to — where the move originates. Values match
    the ``WorldDomainKey`` literal in ``app.utils`` so the classifier output maps straight onto it."""

    geopolitics = "geopolitics"
    macro = "macro"
    industry = "industry"
    market = "market"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class Channel(str, enum.Enum):
    email = "email"
    imessage = "imessage"
    whatsapp = "whatsapp"
    in_app = "in_app"


class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class PeriodType(str, enum.Enum):
    annual = "annual"
    quarterly = "quarterly"


class CalendarEventType(str, enum.Enum):
    earnings = "earnings"
    dividend = "dividend"
    ex_dividend = "ex_dividend"


def _pg_enum(py_enum: type[enum.Enum], name: str) -> SAEnum:
    return SAEnum(
        py_enum,
        name=name,
        native_enum=True,
        create_type=False,  # migrations own enum-type DDL
        values_callable=lambda obj: [member.value for member in obj],
        validate_strings=True,
    )


# Shared singletons — one instance per enum name, reused across all columns/tables.
coverage_tier_enum = _pg_enum(CoverageTier, "coverage_tier")
state_status_enum = _pg_enum(StateStatus, "state_status")
analysis_type_enum = _pg_enum(AnalysisType, "analysis_type")
news_domain_enum = _pg_enum(NewsDomain, "news_domain")
task_status_enum = _pg_enum(TaskStatus, "task_status")
channel_enum = _pg_enum(Channel, "channel")
chat_role_enum = _pg_enum(ChatRole, "chat_role")
period_type_enum = _pg_enum(PeriodType, "period_type")
calendar_event_type_enum = _pg_enum(CalendarEventType, "calendar_event_type")

# Used by migrations to create each type exactly once.
ALL_ENUMS: list[tuple[type[enum.Enum], str]] = [
    (CoverageTier, "coverage_tier"),
    (StateStatus, "state_status"),
    (AnalysisType, "analysis_type"),
    (NewsDomain, "news_domain"),
    (TaskStatus, "task_status"),
    (Channel, "channel"),
    (ChatRole, "chat_role"),
    (PeriodType, "period_type"),
    (CalendarEventType, "calendar_event_type"),
]
