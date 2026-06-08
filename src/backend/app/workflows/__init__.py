"""Workflows: orchestrated pipelines + the runtime they execute under.

The **pipelines** (daily research & digest, market brief, news ingest, industry research, …) are
deferred. What's here now is the shared **execution runtime** — the "stops" that govern any
workflow — plus the **trigger declarations** that bind firing conditions to pipelines:

- ``runtime`` — ``run_task`` (tracked ``tasks`` row; failures visible/re-runnable) + ``with_retry``.
- ``concurrency`` — ``company_lock`` (one workflow per company) + bounded cross-company fan-out.
- ``triggers`` — the trigger taxonomy/registry; ``app.scheduler`` consumes the scheduled subset.

Per STRUCTURE.md import direction, ``workflows/`` may import ``agents/``, ``tools/``,
``providers/``, ``db/``; ``scheduler/`` imports ``workflows/`` (not the reverse).
"""

from __future__ import annotations

from app.workflows.concurrency import company_gate, company_lock, gather_bounded
from app.workflows.runtime import JobHandle, TaskHandle, run_job, run_task, with_retry
from app.workflows.triggers import (
    TRIGGERS,
    Trigger,
    TriggerKind,
    get_trigger,
    register_trigger,
    triggers_for_kind,
)

__all__ = [
    "run_task",
    "run_job",  # back-compat alias
    "with_retry",
    "TaskHandle",
    "JobHandle",  # back-compat alias
    "company_lock",
    "company_gate",
    "gather_bounded",
    "Trigger",
    "TriggerKind",
    "TRIGGERS",
    "register_trigger",
    "get_trigger",
    "triggers_for_kind",
]
