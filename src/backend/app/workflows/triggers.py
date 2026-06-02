"""Trigger taxonomy + registry (skeleton).

The architecture fires workflows four ways: **scheduled** (digest, pulse, sector research),
**event-driven** (news ingest -> re-scoring), **threshold-driven** (score shift -> prose
regeneration), and **on-demand** (interface request). This module is the binding surface:
each trigger declares which workflow it invokes (by identifier — the pipeline modules don't
exist yet, so these are placeholders). Scheduled triggers also carry a cron expression, which
``app.scheduler.schedule`` reads back; nothing here runs a loop.

It lives in ``workflows/`` (not ``scheduler/``) because event/threshold triggers fire from
*inside* workflows, and ``scheduler/`` may import ``workflows/`` but never the reverse.
Workflow identifiers are defined here as the canonical names so triggers and the scheduler
agree on them before the workflow modules are written.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field

# Canonical workflow identifiers (the workflows themselves are deferred).
WF_DAILY_DIGEST = "daily_research_digest"
WF_MARKET_PULSE = "market_pulse"
WF_NEWS_INGEST = "news_ingest"
WF_SECTOR_RESEARCH = "sector_research"
WF_RESCORE = "company_rescore"
WF_PROSE_REGEN = "prose_regeneration"
WF_SIGNIFICANCE_RECHECK = "significance_recheck"
WF_ON_DEMAND = "on_demand_research"


class TriggerKind(str, enum.Enum):
    scheduled = "scheduled"
    event = "event"
    threshold = "threshold"
    on_demand = "on_demand"


@dataclass(frozen=True)
class Trigger:
    """One firing condition bound to a workflow.

    ``cron`` is set only for ``scheduled`` triggers. ``source`` names the event/metric for
    ``event`` / ``threshold`` triggers. ``params`` carries fixed invocation arguments (e.g. the
    pulse ``slot``) the workflow receives when this trigger fires.
    """

    name: str
    kind: TriggerKind
    workflow: str
    description: str
    cron: str | None = None
    source: str | None = None
    params: dict[str, str] = field(default_factory=dict)


TRIGGERS: dict[str, Trigger] = {}


def register_trigger(trigger: Trigger) -> Trigger:
    if trigger.name in TRIGGERS:
        raise ValueError(f"trigger {trigger.name!r} already registered")
    if trigger.kind is TriggerKind.scheduled and not trigger.cron:
        raise ValueError(f"scheduled trigger {trigger.name!r} needs a cron expression")
    TRIGGERS[trigger.name] = trigger
    return trigger


def get_trigger(name: str) -> Trigger:
    return TRIGGERS[name]


def triggers_for_kind(kind: TriggerKind) -> list[Trigger]:
    return [t for t in TRIGGERS.values() if t.kind is kind]


# --- Declared triggers --------------------------------------------------------
# Cron times are UTC (all timestamps in the system are UTC). Pulse slots map to PulseSlot.

register_trigger(Trigger(
    name="digest_daily",
    kind=TriggerKind.scheduled,
    workflow=WF_DAILY_DIGEST,
    description="Daily research + detailed digest (email + platform).",
    cron="0 11 * * *",
))
register_trigger(Trigger(
    name="pulse_morning",
    kind=TriggerKind.scheduled,
    workflow=WF_MARKET_PULSE,
    description="Pre-open brief pulse.",
    cron="30 12 * * 1-5",
    params={"slot": "morning"},
))
register_trigger(Trigger(
    name="pulse_midday",
    kind=TriggerKind.scheduled,
    workflow=WF_MARKET_PULSE,
    description="Midday brief pulse.",
    cron="0 16 * * 1-5",
    params={"slot": "midday"},
))
register_trigger(Trigger(
    name="pulse_close",
    kind=TriggerKind.scheduled,
    workflow=WF_MARKET_PULSE,
    description="Post-close brief pulse.",
    cron="30 20 * * 1-5",
    params={"slot": "close"},
))
register_trigger(Trigger(
    name="sector_research_daily",
    kind=TriggerKind.scheduled,
    workflow=WF_SECTOR_RESEARCH,
    description="Aggregate sector scores, surface movers; feeds digest sections.",
    cron="0 10 * * *",
))
register_trigger(Trigger(
    name="news_ingested",
    kind=TriggerKind.event,
    workflow=WF_RESCORE,
    description="New events written -> enqueue watchlisted companies for re-scoring.",
    source=WF_NEWS_INGEST,
))
register_trigger(Trigger(
    name="score_shift",
    kind=TriggerKind.threshold,
    workflow=WF_PROSE_REGEN,
    description="Score moved beyond threshold -> regenerate prose if the read changed.",
    source="score_shift_pct",
))
register_trigger(Trigger(
    name="on_demand_request",
    kind=TriggerKind.on_demand,
    workflow=WF_ON_DEMAND,
    description="Interface request: answer from stored research, fetch fresh only if stale.",
    source="interface",
))
