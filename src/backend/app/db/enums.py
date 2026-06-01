"""Closed-set enumerations, as native Postgres enum types.

These are genuinely fixed vocabularies (unlike sectors/industries, which are extensible
lookup tables). Each is exposed as a shared SQLAlchemy ENUM instance so a name maps to
exactly one type even when reused across tables (e.g. `channel`). DDL for these types is
owned by the migrations (``create_type=False``); ``values_callable`` stores the lowercase
``.value``, not the Python member name.
"""

from __future__ import annotations

import enum

from sqlalchemy import Enum as SAEnum


class CoverageTier(str, enum.Enum):
    watchlist = "watchlist"  # deep coverage: scores + prose
    discovered = "discovered"  # lightweight tracking (research surface)
    archived = "archived"


class SignificanceTier(str, enum.Enum):
    routine = "routine"  # 90d retention
    notable = "notable"  # 2y retention
    significant = "significant"  # indefinite retention


class ProseKind(str, enum.Enum):
    fundamental = "fundamental"
    sentimental = "sentimental"


class PulseSlot(str, enum.Enum):
    morning = "morning"
    midday = "midday"
    close = "close"
    on_demand = "on_demand"


class JobStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class Channel(str, enum.Enum):
    email = "email"
    imessage = "imessage"
    whatsapp = "whatsapp"
    in_app = "in_app"


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
significance_tier_enum = _pg_enum(SignificanceTier, "significance_tier")
prose_kind_enum = _pg_enum(ProseKind, "prose_kind")
pulse_slot_enum = _pg_enum(PulseSlot, "pulse_slot")
job_status_enum = _pg_enum(JobStatus, "job_status")
channel_enum = _pg_enum(Channel, "channel")
period_type_enum = _pg_enum(PeriodType, "period_type")
calendar_event_type_enum = _pg_enum(CalendarEventType, "calendar_event_type")

# Used by the initial migration to create each type exactly once.
ALL_ENUMS: list[tuple[type[enum.Enum], str]] = [
    (CoverageTier, "coverage_tier"),
    (SignificanceTier, "significance_tier"),
    (ProseKind, "prose_kind"),
    (PulseSlot, "pulse_slot"),
    (JobStatus, "job_status"),
    (Channel, "channel"),
    (PeriodType, "period_type"),
    (CalendarEventType, "calendar_event_type"),
]
