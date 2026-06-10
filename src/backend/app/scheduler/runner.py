"""APScheduler runner — the live loop behind the declarative schedule.

``schedule.register`` hands each ``ScheduleSlot`` to ``_add_job``, which binds its cron to the
workflow callable resolved from the registry. Started from the API lifespan when
``enable_scheduler`` is set; off by default so dev/tests never fire external-API jobs. Workflow
failures surface in the ``tasks`` table (each runs under ``run_task``), so a bad job is visible,
not silent.

Import direction holds: ``scheduler/`` imports ``workflows/``, never the reverse.
"""

from __future__ import annotations

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.scheduler.schedule import ScheduleSlot, register
from app.workflows.registry import get_workflow


def _add_job(scheduler: AsyncIOScheduler, slot: ScheduleSlot) -> None:
    scheduler.add_job(
        get_workflow(slot.workflow),
        CronTrigger.from_crontab(slot.cron, timezone="UTC"),
        kwargs=dict(slot.params),
        id=slot.name,
        replace_existing=True,
    )


def start() -> AsyncIOScheduler:
    """Build, populate, and start the scheduler. Returns it so the caller can shut it down."""
    scheduler = AsyncIOScheduler(timezone="UTC")
    register(lambda slot: _add_job(scheduler, slot))
    scheduler.start()
    return scheduler


def shutdown(scheduler: AsyncIOScheduler) -> None:
    scheduler.shutdown(wait=False)
