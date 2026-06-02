"""Scheduler: cron registrations only.

Workflows don't know they're scheduled — they're callable from anywhere (scheduler, API,
on-demand). This package only declares *when* the scheduled workflows fire and offers the hook
to wire those declarations into a real scheduler later. No live loop runs in this pass.
"""

from __future__ import annotations

from app.scheduler.schedule import SCHEDULE, ScheduleSlot, register

__all__ = ["SCHEDULE", "ScheduleSlot", "register"]
