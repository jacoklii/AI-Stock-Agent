"""Cron-slot table (skeleton).

The scheduled slots are derived from the scheduled triggers (single source of truth in
``app.workflows.triggers``), so cron times live in exactly one place. ``register`` is the seam
to a real scheduler — APScheduler or cron — wired up once the workflows it points at exist.
This pass deliberately stops short of running a loop or taking an APScheduler dependency: it
declares the schedule and leaves a typed hook.

Import direction holds: ``scheduler/`` imports ``workflows/`` (never the reverse).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from app.workflows.triggers import Trigger, TriggerKind, triggers_for_kind


@dataclass(frozen=True)
class ScheduleSlot:
    """A scheduled workflow invocation: cron expression + workflow id + fixed params."""

    name: str
    cron: str
    workflow: str
    params: dict[str, str]

    @classmethod
    def from_trigger(cls, trigger: Trigger) -> "ScheduleSlot":
        assert trigger.cron is not None  # guaranteed by register_trigger for scheduled kind
        return cls(
            name=trigger.name,
            cron=trigger.cron,
            workflow=trigger.workflow,
            params=dict(trigger.params),
        )


# The schedule, built from the declared scheduled triggers.
SCHEDULE: list[ScheduleSlot] = [
    ScheduleSlot.from_trigger(t) for t in triggers_for_kind(TriggerKind.scheduled)
]


def register(add_job: Callable[[ScheduleSlot], None]) -> None:
    """Hand each slot to a scheduler backend.

    ``add_job`` is supplied by whatever runs the loop later (e.g. a thin APScheduler wrapper
    that maps ``slot.workflow`` -> the workflow callable and ``slot.cron`` -> a CronTrigger).
    Keeping the backend out of this module means the schedule stays declarative data and the
    workflows stay unaware they're scheduled.
    """
    for slot in SCHEDULE:
        add_job(slot)
