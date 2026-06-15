"""FastAPI entry point — the internal API the SPA talks to.

The UI talks only to this, never to Postgres. In production the SPA is served same-origin (nginx
in the web container, Caddy in front), so CORS matters only for the Vite dev server. Run with:
``uvicorn app.main:app --reload`` (from ``src/backend/`` with the venv active).
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    agent,
    chat,
    companies,
    home,
    inbox,
    preferences,
    pulse,
    research,
    sectors,
)
from app.config import get_settings
from app.db.session import engine

# App-module logs (workflow progress, the agent's "server tools ran" line) go through the root
# logger; without a handler they'd be dropped above WARNING. Uvicorn's own loggers are untouched.
logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")

logger = logging.getLogger(__name__)

# Holds the boot-time background tasks (e.g. the interest indexer) so they aren't garbage-collected
# mid-flight; each removes itself on completion.
_boot_tasks: set[asyncio.Task] = set()


async def _index_user_interests() -> None:
    """Build/refresh the user-interest corpus the ``recall_preferences`` tool searches. Embeddings
    only, idempotent, best-effort — kept off the boot path so Voyage latency/rate limits can't
    delay startup."""
    try:
        from app.workflows.research import interest_index

        result = await interest_index.run()
        if result.get("indexed"):
            logger.info("interest index: %s", result)
    except Exception:
        logger.warning("interest index skipped (database/embeddings unavailable?)", exc_info=True)


async def _index_industries() -> None:
    """Embed the industry vocabulary so ``news_ingest`` can route orphan macro news to an industry.
    Embeddings only, idempotent, best-effort — same off-the-boot-path discipline as the interest
    corpus so a Voyage hiccup never delays startup."""
    try:
        from app.workflows.research import industry_index

        result = await industry_index.run()
        if result.get("indexed"):
            logger.info("industry index: %s", result)
    except Exception:
        logger.warning("industry index skipped (database/embeddings unavailable?)", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Sweep tasks orphaned by a previous crash/restart so the activity feed stays truthful.
    # Best-effort: a DB that isn't up yet shouldn't stop the API from booting.
    try:
        from app.workflows.runtime import fail_orphaned_tasks

        orphaned = await fail_orphaned_tasks()
        if orphaned:
            logger.warning("marked %d orphaned task(s) as failed at boot", orphaned)
    except Exception:
        logger.warning("orphaned-task sweep skipped (database unavailable?)", exc_info=True)

    # First-boot defaults: preferences row, general industries, popular mega-caps. Idempotent —
    # an already-initialized database is left untouched.
    try:
        from app.db.bootstrap import ensure_defaults

        created = await ensure_defaults()
        if any(created.values()):
            logger.info("bootstrapped defaults: %s", created)
    except Exception:
        logger.warning("default bootstrap skipped (database unavailable?)", exc_info=True)

    # Seed the user-interest corpus and embed the industry vocabulary in the background (after
    # defaults exist, so the declared lines and seeded industries are there to index). Fire-and-
    # forget: startup never waits on embeddings.
    for coro in (_index_user_interests(), _index_industries()):
        task = asyncio.create_task(coro)
        _boot_tasks.add(task)
        task.add_done_callback(_boot_tasks.discard)

    # Start breadth automation only when enabled (off in dev/tests). The scheduler fires the
    # scheduled workflows; everything else stays callable on demand from the API.
    scheduler = None
    if get_settings().enable_scheduler:
        from app.scheduler import start

        scheduler = start()
    try:
        yield
    finally:
        if scheduler is not None:
            from app.scheduler import shutdown

            shutdown(scheduler)
        await engine.dispose()  # release the pool on shutdown


app = FastAPI(
    title="AI Stock Agent — Internal API",
    version="0.1.0",
    summary="Read-mostly knowledge-layer API. The UI talks only to this, never to Postgres.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (home, pulse, companies, sectors, inbox, preferences, research, chat, agent):
    app.include_router(module.router)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
