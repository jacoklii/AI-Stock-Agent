# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

`ARCHITECTURE.md` describes the system, and where the code should live and be organized must reflect the architecture — follow it.
The **data layer**, the **tools/triggers/stops**, the **workflow pipelines (as skeletons)**, and the
**FastAPI internal API** are built: `app/db/`, `app/tools/`, `app/providers/` (yFinance + Voyage),
`app/scheduler/`, `app/workflows/` (runtime + concurrency + triggers + 8 pipeline skeletons +
`registry.py`), and `app/api/` + `app/main.py`. **Still not built** (the workflows' `TODO(...)`
boundaries): the `researcher` agent (`app/agents/`), the `analysis/` scoring math, the Finnhub news +
notifier providers, the MCP server (`app/mcp_server/`), and the frontend.

Read `ARCHITECTURE.md` in full before writing code; it is the source of truth
and the sections below only summarize it.

## Commands (backend)

All backend commands run from `src/backend/` with the venv active (`source .venv/bin/activate`,
or prefix with `.venv/bin/`). Postgres runs via docker-compose from the repo root.

```bash
# Database (pgvector Postgres) — from repo root
docker compose up -d                      # start; data persists in src/backend/data/postgres/

# From src/backend/
python -m venv .venv && .venv/bin/pip install -e ".[dev]"   # one-time setup
alembic upgrade head                      # apply migrations (builds the full schema)
alembic revision --autogenerate -m "msg"  # create a migration after model changes
alembic check                             # assert models match the DB (no drift)
python -m scripts.seed                    # seed taxonomy + watchlist + prefs (idempotent)
pytest                                    # run tests (needs Postgres up for db/tools/jobs tests)
pytest tests/db/test_smoke.py             # data-layer smoke test
pytest tests/tools tests/workflows        # tool contracts + execution-rule stops
uvicorn app.main:app --reload             # internal API (read endpoints live; actions return 501)
```

Config comes from the repo-root `.env` (copy `.env.example`); the app and docker-compose share it.
Alembic lives at `app/db/migrations/` (`alembic.ini` at `src/backend/`).

## Data layer conventions (already established)

- **Coupling rule:** group/transact by write cadence — "couple what updates together, never couple
  what doesn't." Models live in `app/db/models/`: `companies.py` (incl. taxonomy),
  `market_data.py`, `news.py` (incl. `SectorAggregate`), `analysis.py` (scores+prose), `delivery.py`
  (digest+pulse+notifications), `user.py`, `jobs.py`.
- **DB models vs API schemas are separate** — don't reuse ORM models as response models.
- **Every JSONB column has a Pydantic model** (`app/db/payloads.py`), bound via the `PydanticJSONB`
  TypeDecorator in `app/db/base.py` — validated on write, typed on read.
- **Every vector column carries its `embedding_model`** name. Embedding is fixed: `voyage-3`, 1024-dim
  (`EMBEDDING_MODEL` / `EMBEDDING_DIM`). Changing it is an explicit backfill, not a silent swap.
- **Taxonomy is lookup tables** (`sectors`, `industries`), not enums — extensible by INSERT/seed.
  Closed sets (coverage_tier, significance_tier, …) are native PG enums in `app/db/enums.py`.
- **Fixed constants live in `app/config.py`**, not seed files: `PULSE_CORE` (the pulse set's fixed
  core; user mega-caps are `user_preferences.pulse_user`) and `DEFAULT_THRESHOLDS`. Curated-universe
  seeding (taxonomy, watchlist) is an ops script at `src/backend/scripts/seed.py` — never inside `app/`.
- **Migrations own all DDL.** The pgvector extension, enum types, and HNSW indexes are created in the
  migration; the HNSW indexes are also declared on the models so `alembic check` stays clean.

## Application layer conventions (tools / triggers / stops)

- **Tools are predefined, read-only, typed.** Each tool in `app/tools/` is a pure function taking an
  injected `AsyncSession` (callers pass `readonly_session()` from `app/db/session.py`, so a write is
  impossible at the DB) and returning a **Pydantic result model** — never an ORM row, free-form text,
  or SQL. `research.py` (company/market/news/pulse/screen/similarity), `analysis.py` (scores/prose +
  citations), `delivery.py` (dedupe lookup). Split is by subject, mirroring `db/models/`.
- **The registry is the allowlist "stop."** Tools self-register via `@tool(...)` in
  `app/tools/registry.py`; `get_tools_for(task)` returns the slice an agent step may use. Importing
  `app.tools` populates `REGISTRY`. The future MCP server exposes exactly this set.
- **One wrapper per external dependency.** `app/providers/` — `market.py` (yFinance quotes),
  `embeddings.py` (Voyage query embedding). Sync libs are dispatched via `asyncio.to_thread`. A
  provider swap touches one file. Embedding wrapper returns the model name with every vector.
- **Execution rules are code, in `app/workflows/`** (the runtime the pipelines run under):
  `runtime.run_job(...)` wraps every run in a tracked `jobs` row (pending→running→succeeded/failed;
  failures re-raise, never silent) + `with_retry`; `concurrency.company_lock` serializes per company,
  `company_gate`/`gather_bounded` cap cross-company parallelism (in-process; a PG advisory lock is the
  multi-process upgrade).
- **Workflow pipelines are thin skeletons** (`app/workflows/<name>.py`): one `async def run(...)`
  wrapped in `run_job(WF_*)`, reads via tools under `readonly_session`, deterministic writes via
  `SessionLocal`, per-company work under `company_lock`/`gather_bounded`. Each deferred step is an
  `async def _helper(...)` that `raise NotImplementedError("TODO(agent|news|notifier|scoring): …")` —
  the named boundary is where the agent / Finnhub / notifier / `analysis/` scoring plugs in.
  `workflows/registry.py` maps each `WF_*` id → its `run` callable (consumed by scheduler + API).
- **The API reads the DB directly; the tools-only rule binds the AI, not FastAPI.** `app/api/` +
  `app/main.py`: read endpoints are wired (reuse read tools where they fit, else direct read-only
  query) and mapped into `api/schemas.py` wire models (a 4th model kind, separate from ORM / JSONB /
  tool DTOs); action + workflow-trigger endpoints are defined but return `501` until the pipelines
  and write paths land. `api/deps.py` provides `ro_session` / `rw_session`.
- **Triggers + schedule are declarative skeletons.** `app/workflows/triggers.py` is the single source
  of trigger declarations (scheduled/event/threshold/on_demand) bound to **workflow identifiers**
  (placeholders until pipelines exist) — it lives in `workflows/` because event/threshold triggers
  fire from inside workflows, and `scheduler/` may import `workflows/` but never the reverse.
  `app/scheduler/schedule.py` derives the cron-slot table from the scheduled triggers and exposes a
  `register(add_job)` hook — no live APScheduler loop yet. Cron times are UTC.
- **Deferred on purpose:** `send_*` tools (need the notifier provider) and `compile_reading_list`
  (needs the agent) ship with their dependent layers, not here.

## What this is

A single-user, always-on **knowledge-layer** agent for stock/market research. It researches, analyzes, and proactively surfaces what the user should read — organized by sector and significance. It does **not** trade, and the design draws a hard line between AI work and human work. But rather finds data, connect the dots for insights

## Inviolable constraints

These are hard rules from `ARCHITECTURE.md`; violating any of them breaks the product's premise:

- **The AI never recommends buy/sell/hold and never makes valuation calls.** Output is research, summaries, numeric scores, and dot-connecting insight — never a decision, recommendation, or speculation. Judgment, speculation, and looking ahead belong to the human.
- **AI synthesis is presented alongside primary sources, never in place of them.** Article URLs are first-class content; AI summaries are orientation. Every prose output cites its source IDs.
- **AI reaches the database only through predefined, read-only tools.** No AI-generated SQL, no arbitrary URL fetching. Agents compose tools; they don't own data access.
- **No raw article body text is stored** — the AI summary is the canonical record.
- **Join on `company_id`, never ticker.**
- **Deep scoring (fundamental + sentimental) runs only on `coverage_tier = watchlist` + flagged sectors.** The broader "research surface" (discovered companies) gets lightweight tracking only — this is a deliberate cost boundary, not an oversight.
- The embedding model is **fixed**; its name is stored alongside every vector. Changing it is an explicit backfill, never a silent swap. Likewise the LLM model name is stored on every analysis row.
- All timestamps **UTC**; sectors come from one controlled vocabulary.

## Architecture shape

Four layers (detail in `ARCHITECTURE.md`):

1. **Interface** — TypeScript UI, read-mostly, talks **only to FastAPI, never directly to Postgres**. Mirrors the email digest: top snapshot → sections by sector/macro → ranked article lists with summaries.
2. **Application** — orchestrated **pipelines, not open agent planning** (chosen for predictable cost/behavior/debuggability). A fixed **tool registry** exposed over MCP; workflows compose those tools. Each agent step sees only the tools for that step and emits structured rows/scores/templated sections — not free-form chat. Failures log to a `jobs` table; no silent partial successes.
3. **Data** — single **Postgres + pgvector**. Structured tables (companies as the spine + research surface, prices, financials, news_events, scores), JSONB for legitimately variable shapes (digest runs, pulse runs, prose, job state), and pgvector embeddings living as columns on the tables they describe — not a separate store.
4. **Technical** — Python/FastAPI backend, MCP server, TypeScript frontend, scheduler (cron/APScheduler) on an always-on host.

## Conventions that shape the code

- **Every external dependency goes behind a single internal wrapper before its first use** — a provider swap (yFinance, news provider, notifier, Anthropic) should touch one file.
- **Two distinct delivery shapes, kept separate** (separate templates + triggers): the *brief pulse* (movers + market snapshot, to iMessage/WhatsApp) and the *detailed digest* (curated reading list, by email). Both mirror into the in-app inbox.
- **Research surface vs. deep coverage are separate concepts**, keyed by `coverage_tier` on `companies`. Don't conflate them.
- **Prose is sparse, scores are dense.** Write a new prose row only on a genuine, threshold-crossing shift that differs meaningfully from the prior row; scores are numeric and historical.
- Prompts live in a versioned `prompts/` directory, separate from schema migrations. Scoring rubrics carry a `rubric_version` so old scores stay interpretable.
- Default to the latest Claude models and the Anthropic SDK with prompt caching: **Opus/Sonnet** for synthesis (snapshots, prose), **Haiku** for high-volume summarization at ingest.
- Prefer simplicity over performance until measured. Streaming, multi-user, raw-text RAG, and open agent planning are explicitly deferred — add complexity only when current behavior measurably fails.

## Safety note

This is a knowledge layer with no trade execution. Keep it that way: any feature that would emit a recommendation, a buy/sell/hold, or a valuation call is out of scope by design, not a missing feature.

- Add complexity only when current behavior measurably fails.
