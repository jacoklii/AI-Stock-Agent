"""Workflows: orchestrated pipelines + the runtime they execute under.

The **pipelines** live in subpackages mirroring the system's three aspects — ``research/``
(news_ingest, deep_research, section_synthesis), ``analysis/`` (company_rescore,
prose_regeneration), ``message/`` (daily_digest, market_pulse). This
package root holds what every pipeline shares:

- ``runtime`` — ``run_task`` (tracked ``tasks`` row; failures visible/re-runnable) + ``with_retry``.
- ``concurrency`` — ``company_lock``, bounded cross-company fan-out, ``workflow_slot``.
- ``triggers`` — the trigger taxonomy/registry; ``app.scheduler`` consumes the scheduled subset.
- ``registry`` — ``WF_*`` identifier -> ``run`` callable map.
- ``digest_types`` — shapes shared between section_synthesis and daily_digest.

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
