"""Coherence tests for the trigger registry and the derived schedule.

The autonomy work hangs on this wiring: breadth runs hourly, the recheck actually fires, the
signal-convergence event trigger is declared, every cron parses, and every scheduled slot
resolves to a registered workflow.
"""

from __future__ import annotations

from apscheduler.triggers.cron import CronTrigger

from app.scheduler.schedule import SCHEDULE
from app.workflows.registry import get_workflow
from app.workflows.triggers import (
    TRIGGERS,
    TriggerKind,
    WF_DEEP_RESEARCH,
    WF_NEWS_INGEST,
    WF_SIGNIFICANCE_RECHECK,
)


def test_breadth_runs_hourly() -> None:
    t = TRIGGERS["news_ingest_hourly"]
    assert t.kind is TriggerKind.scheduled
    assert t.workflow == WF_NEWS_INGEST
    assert t.cron == "0 * * * *"


def test_significance_recheck_is_scheduled() -> None:
    t = TRIGGERS["significance_recheck_daily"]
    assert t.kind is TriggerKind.scheduled
    assert t.workflow == WF_SIGNIFICANCE_RECHECK
    assert t.cron == "0 21 * * 1-5"


def test_signal_convergence_event_trigger_declared() -> None:
    t = TRIGGERS["signal_convergence"]
    assert t.kind is TriggerKind.event
    assert t.source == WF_NEWS_INGEST
    assert t.workflow == WF_DEEP_RESEARCH


def test_every_scheduled_cron_parses() -> None:
    for t in TRIGGERS.values():
        if t.kind is TriggerKind.scheduled:
            CronTrigger.from_crontab(t.cron)  # raises on a malformed expression


def test_every_schedule_slot_resolves_to_a_workflow() -> None:
    assert SCHEDULE  # the schedule is not empty
    for slot in SCHEDULE:
        assert callable(get_workflow(slot.workflow))
