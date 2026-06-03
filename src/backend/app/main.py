"""FastAPI entry point — the internal API the TypeScript UI talks to.

Read endpoints are wired to the data layer; action and workflow-trigger endpoints are present in
the contract but return ``501`` until the workflows/write paths land. Run with:
``uvicorn app.main:app --reload`` (from ``src/backend/`` with the venv active).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import companies, home, inbox, preferences, pulse, research, sectors
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()  # release the pool on shutdown


app = FastAPI(
    title="AI Stock Agent — Internal API",
    version="0.1.0",
    summary="Read-mostly knowledge-layer API. The UI talks only to this, never to Postgres.",
    lifespan=lifespan,
)

for module in (home, pulse, companies, sectors, inbox, preferences, research):
    app.include_router(module.router)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
