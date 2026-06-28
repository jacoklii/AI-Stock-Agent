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
WF_MARKET_DATA_INGEST = "market_data_ingest"
WF_NEWS_INGEST = "news_ingest"
WF_GDELT_INGEST = "gdelt_ingest"
WF_SECTION_SYNTHESIS = "section_synthesis"
WF_RESCORE = "company_rescore"
WF_PROSE_REGEN = "prose_regeneration"
WF_DEEP_RESEARCH = "deep_research"
WF_FOLLOWUP = "followup"


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
    pulse ``slot``) the workflow receives when this trigger fires. ``timezone`` is the cron's
    reference zone — UTC for every job except the AV news sweeps, which run on a US-market
    clock (``America/New_York``) so the day/night cadence tracks trading hours across DST.
    """

    name: str
    kind: TriggerKind
    workflow: str
    description: str
    cron: str | None = None
    source: str | None = None
    params: dict[str, str] = field(default_factory=dict)
    timezone: str = "UTC"


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
# Cron times are UTC (all timestamps in the system are UTC). Brief slots are plain strings.

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
    name="section_synthesis_daily",
    kind=TriggerKind.scheduled,
    workflow=WF_SECTION_SYNTHESIS,
    description="Per-section synthesis: write each surveillance domain + critical industry's snapshot "
    "from its events. A few times/day (LLM cost, not AV); feeds /world and the digest.",
    cron="0 10,14,18 * * *",
))
# AV free tier is ~25 calls/day. Concentrate the budget in US market hours and go sparse
# overnight: 14 daytime + 4 overnight = 18 calls/day, on an ET clock so the boundary tracks
# the trading session across DST.
register_trigger(Trigger(
    name="news_ingest_day",
    kind=TriggerKind.scheduled,
    workflow=WF_NEWS_INGEST,
    description="Daytime breadth (06:00-19:00 ET, hourly): pull + classify AV news; URL dedup keeps re-fetch cheap.",
    cron="0 6-19 * * *",
    timezone="America/New_York",
))
register_trigger(Trigger(
    name="news_ingest_night",
    kind=TriggerKind.scheduled,
    workflow=WF_NEWS_INGEST,
    description="Overnight breadth (20:00, 23:00, 02:00, 05:00 ET): sparse sweeps to conserve the AV free-tier budget.",
    cron="0 20,23,2,5 * * *",
    timezone="America/New_York",
))
# GDELT is keyless with no daily cap — only a ≤1-request/5s politeness limit (paced process-wide by
# the provider's limiter). So unlike AV's market-hours-shaped, free-tier-budgeted cadence, geopolitics
# runs on a flat round-the-clock interval. Every 30 min (48/day) keeps the world current while leaving
# the rate budget almost entirely free for on-demand user sweeps (which the limiter interleaves safely).
register_trigger(Trigger(
    name="gdelt_ingest_steady",
    kind=TriggerKind.scheduled,
    workflow=WF_GDELT_INGEST,
    description="Steady geopolitics sweep (every 30 min, round the clock): pull GDELT global events into "
    "the geopolitics domain with source_country. Decoupled from the AV cadence; rate-paced, not budgeted.",
    cron="*/30 * * * *",
))
register_trigger(Trigger(
    name="market_data_daily",
    kind=TriggerKind.scheduled,
    workflow=WF_MARKET_DATA_INGEST,
    description="Daily: refresh stored financials + daily prices for watchlist + critical names (the quantitative surface).",
    cron="30 22 * * 1-5",
))
register_trigger(Trigger(
    name="news_ingested",
    kind=TriggerKind.event,
    workflow=WF_RESCORE,
    description="New events written -> enqueue watchlisted companies for re-scoring.",
    source=WF_NEWS_INGEST,
))
register_trigger(Trigger(
    name="signal_convergence",
    kind=TriggerKind.event,
    workflow=WF_DEEP_RESEARCH,
    description="Breadth surfaced an event at/above the wakeup significance -> call the researcher back.",
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
    name="deep_research_request",
    kind=TriggerKind.on_demand,
    workflow=WF_DEEP_RESEARCH,
    description="Interface request: open a bounded research session, state-first then external.",
    source="interface",
))
register_trigger(Trigger(
    name="chat_followup",
    kind=TriggerKind.on_demand,
    workflow=WF_FOLLOWUP,
    description="Chat question: lightweight scoped answer; no session opened, nothing promoted.",
    source="interface",
))
register_trigger(Trigger(
    name="deep_research_daily",
    kind=TriggerKind.scheduled,
    workflow=WF_DEEP_RESEARCH,
    description="Self-directed session: resume unfinished work or pick a focus from breadth signal; rests when nothing is material.",
    cron="0 14 * * 1-5",
))
