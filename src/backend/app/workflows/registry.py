"""Workflow registry — maps each ``WF_*`` identifier to its ``run`` callable.

The connective tissue between trigger declarations and pipeline code: the scheduler's
``register(add_job)`` hook resolves a scheduled slot's ``workflow`` id here, and the API trigger
endpoints resolve an on-demand run the same way. Importing this module imports every pipeline,
so the map is always complete.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from app.workflows import (
    company_rescore,
    daily_digest,
    market_pulse,
    news_ingest,
    on_demand,
    prose_regeneration,
    sector_research,
    significance_recheck,
)
from app.workflows.triggers import (
    WF_DAILY_DIGEST,
    WF_MARKET_PULSE,
    WF_NEWS_INGEST,
    WF_ON_DEMAND,
    WF_PROSE_REGEN,
    WF_RESCORE,
    WF_SECTOR_RESEARCH,
    WF_SIGNIFICANCE_RECHECK,
)

WORKFLOWS: dict[str, Callable[..., Awaitable[object]]] = {
    WF_NEWS_INGEST: news_ingest.run,
    WF_RESCORE: company_rescore.run,
    WF_PROSE_REGEN: prose_regeneration.run,
    WF_MARKET_PULSE: market_pulse.run,
    WF_SECTOR_RESEARCH: sector_research.run,
    WF_DAILY_DIGEST: daily_digest.run,
    WF_SIGNIFICANCE_RECHECK: significance_recheck.run,
    WF_ON_DEMAND: on_demand.run,
}


def get_workflow(workflow_id: str) -> Callable[..., Awaitable[object]]:
    """Resolve a workflow's ``run`` callable by its ``WF_*`` identifier."""
    return WORKFLOWS[workflow_id]
