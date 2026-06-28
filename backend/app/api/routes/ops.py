"""On-demand workflow triggers — run breadth/research/data jobs *now*, without the scheduler.

The scheduler (``ENABLE_SCHEDULER``) fires these same workflows on a cadence on the always-on host;
these routes let a developer or the UI kick one off immediately. Each run goes through the normal
``run_task`` path inside its workflow, so it surfaces as a ``running`` row in ``/agent/activity`` —
the caller polls that instead of holding the request open. Fire-and-forget: a 202 comes back the
moment the run is spawned.

These are operational levers, not the agent's tools — the tools-only/read-only rule constrains the
AI, not the API. Nothing here makes a buy/sell/hold or valuation call.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable
from typing import Callable

from fastapi import APIRouter

from app.api.schemas import OpsRunResponse
from app.workflows.message import daily_digest
from app.workflows.research import gdelt_ingest, market_data_ingest, news_ingest

router = APIRouter(tags=["ops"])

# Keep-alive set for fire-and-forget runs (asyncio only holds weak refs to tasks).
_BACKGROUND_TASKS: set[asyncio.Task] = set()


def _spawn(coro: Awaitable[object]) -> None:
    task = asyncio.create_task(coro)
    _BACKGROUND_TASKS.add(task)
    task.add_done_callback(_BACKGROUND_TASKS.discard)


def _trigger(workflow: str, run: Callable[[], Awaitable[object]]) -> OpsRunResponse:
    _spawn(run())
    return OpsRunResponse(workflow=workflow)


@router.post("/ops/sweep", response_model=OpsRunResponse, status_code=202)
async def sweep() -> OpsRunResponse:
    """Run one full news sweep now: both Alpha Vantage (financial) and GDELT (geopolitics).

    The user-bounded sweep — fires both ingest pipelines immediately instead of waiting for their
    crons. Each has its own ``workflow_slot`` (so a concurrent scheduled run no-ops, double-clicks
    are safe), and GDELT's process-wide rate limiter spaces this call against the steady cron so it
    can't burst into a 429 — there's always headroom for an on-demand sweep."""
    _spawn(news_ingest.run())
    _spawn(gdelt_ingest.run())
    return OpsRunResponse(workflow="news_ingest+gdelt_ingest")


@router.post("/ops/digest", response_model=OpsRunResponse, status_code=202)
async def digest() -> OpsRunResponse:
    """Run the daily digest now: refresh breadth, write the cross-domain overview, deliver it."""
    return _trigger("daily_digest", daily_digest.run)


@router.post("/ops/refresh-financials", response_model=OpsRunResponse, status_code=202)
async def refresh_financials() -> OpsRunResponse:
    """Refresh stored financials + daily prices for watchlist + critical names (the quant surface)."""
    return _trigger("market_data_ingest", market_data_ingest.run)
