"""Workflow registry — maps each ``WF_*`` identifier to its ``run`` callable.

The connective tissue between trigger declarations and pipeline code: the scheduler's
``register(add_job)`` hook resolves a scheduled slot's ``workflow`` id here, and the API trigger
endpoints resolve an on-demand run the same way. Importing this module imports every pipeline,
so the map is always complete.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from app.workflows.analysis import company_rescore, prose_regeneration, significance_recheck
from app.workflows.message import daily_digest, market_pulse
from app.workflows.research import deep_research, news_ingest, sector_research
from app.workflows.triggers import (
    WF_DAILY_DIGEST,
    WF_DEEP_RESEARCH,
    WF_MARKET_PULSE,
    WF_NEWS_INGEST,
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
    # The registry serves the scheduler/trigger path, where deep research is self-directed;
    # chat/API call ``deep_research.run`` directly with the user's query.
    WF_DEEP_RESEARCH: deep_research.run_autonomous,
}


def get_workflow(workflow_id: str) -> Callable[..., Awaitable[object]]:
    """Resolve a workflow's ``run`` callable by its ``WF_*`` identifier."""
    return WORKFLOWS[workflow_id]
