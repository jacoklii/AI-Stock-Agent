"""Scheduler: the declarative cron table + the APScheduler runner behind it.

Workflows don't know they're scheduled — they're callable from anywhere (scheduler, API,
on-demand). ``schedule`` declares *when* the scheduled workflows fire; ``runner`` is the live
loop that maps those declarations onto APScheduler, started from the API lifespan when enabled.
"""

from __future__ import annotations

from app.scheduler.runner import shutdown, start
from app.scheduler.schedule import SCHEDULE, ScheduleSlot, register

__all__ = ["SCHEDULE", "ScheduleSlot", "register", "start", "shutdown"]
