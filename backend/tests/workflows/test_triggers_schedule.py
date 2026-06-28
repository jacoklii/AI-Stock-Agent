"""Coherence tests for the trigger registry and the derived schedule.

The autonomy work hangs on this wiring: breadth runs hourly, the signal-convergence event
trigger is declared, every cron parses, and every scheduled slot resolves to a registered workflow.
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
)


def test_breadth_runs_day_and_night_on_et_clock() -> None:
    day = TRIGGERS["news_ingest_day"]
    night = TRIGGERS["news_ingest_night"]
    for t in (day, night):
        assert t.kind is TriggerKind.scheduled
        assert t.workflow == WF_NEWS_INGEST
        # AV news sweeps run on a US-market clock so the day/night split tracks the session.
        assert t.timezone == "America/New_York"
    assert day.cron == "0 6-19 * * *"
    assert night.cron == "0 20,23,2,5 * * *"


def test_other_scheduled_triggers_stay_utc() -> None:
    # Only the AV news sweeps move off UTC; every other job keeps the system-wide UTC clock.
    for t in TRIGGERS.values():
        if t.kind is TriggerKind.scheduled and not t.name.startswith("news_ingest_"):
            assert t.timezone == "UTC"


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
