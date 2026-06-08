# CLAUDE.md

Read `ARCHITECTURE.md` in full before writing code — it is the source of truth.

## Overview

Always-on research partner for stock and market intelligence. The agent 
**researches** (industries, sectors, macro), 
**analyzes** (patterns, signal vs. noise, historical analogs), and 
**updates** (surfaces findings organized by sector/significance with article URLs as primary content). It never recommends, speculates, or decides — that belongs to the human.

## Hard rules

- AI never recommends buy/sell/hold or makes valuation calls.
- "Look at this" outputs require ≥ 3 independent substantive inputs. `synthesize_pattern` enforces this.
- AI reads the DB only through predefined, read-only tools — no generated SQL, no arbitrary fetches.
- Article URLs are first-class content; AI summaries are orientation alongside, never instead.
- No raw article body text stored — the AI summary is canonical.
- Join on `company_id`, never ticker.
- Embedding model is fixed; changes are explicit backfills, never silent swaps. LLM model name stored on every analysis row.
- All timestamps UTC. Sectors and industries from controlled vocabularies.
- Deep scoring runs only on `coverage_tier = watchlist` + flagged sectors — deliberate cost boundary.

## Code rules

- One wrapper per external dependency (`app/providers/`). A provider swap touches one file.
- Tools are pure functions: injected read-only `AsyncSession` → typed Pydantic result. Never an ORM row or free-form text.
- Four model kinds, kept separate: ORM (`db/models/`), JSONB payloads (`db/payloads.py`), tool DTOs (`tools/tool_schema.py`), API wire models (`api/schemas.py`).
- Every JSONB column has a Pydantic model in `db/payloads.py`, bound via `PydanticJSONB`.
- Migrations own all DDL. `alembic check` must pass after any model change.
- Constants in `app/config.py`; seed data in `scripts/seed.py`, never inside `app/`.
- `scheduler/` may import `workflows/`, never the reverse.
- Failures surface in the `jobs` table — no silent partial successes.
- Add complexity only when current behavior measurably fails.

## Commands

All backend commands from `src/backend/` with the venv active. Postgres from repo root.

```bash
# Postgres (repo root)
docker compose up -d
docker compose down

# Setup (src/backend/, one-time)
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
source .venv/bin/activate

# Migrations
alembic upgrade head
alembic revision --autogenerate -m "describe change"
alembic check

# Seed + run
python -m scripts.seed          # idempotent
uvicorn app.main:app --reload   # FastAPI on :8000

# Tests (Postgres must be up)
pytest
pytest tests/db/test_smoke.py
pytest tests/tools tests/workflows
```

Config from repo-root `.env` (copy `.env.example`). `alembic.ini` at `src/backend/`.

## File structure

```
ai-stock-agent/
├── ARCHITECTURE.md
├── docker-compose.yml
├── .env                    # secrets, never committed
├── .env.example
└── src/backend/
    ├── alembic.ini
    ├── pyproject.toml
    ├── scripts/seed.py
    ├── tests/
    └── app/
        ├── main.py
        ├── config.py           # PULSE_CORE, DEFAULT_THRESHOLDS, model names
        ├── db/
        │   ├── base.py         # PydanticJSONB, Base
        │   ├── enums.py        # closed PG enum sets
        │   ├── payloads.py     # Pydantic models for JSONB columns
        │   ├── session.py      # readonly_session(), SessionLocal
        │   ├── models/         # companies, market_data, news, analysis, delivery, user, jobs
        │   └── migrations/
        ├── providers/          # market, news, embeddings, llm, notifier
        ├── tools/              # registry, tool_schema, research, analysis, delivery, invoke
        ├── agents/researcher/  # agent.py, schemas.py, prompts/*.md
        ├── analysis/           # fundamental_score.py, sentiment_analysis.py
        ├── workflows/          # runtime, concurrency, triggers, registry, 8 pipelines
        ├── scheduler/          # schedule.py
        ├── mcp_server/         # server.py
        └── api/                # deps, schemas, routes/
```

## Safety & security

- `.env` is never committed — holds all API keys and the DB connection string.
- Tools receive `readonly_session()`; writes go through `SessionLocal` in workflows only.
- No buy/sell/hold output, no trade execution, no valuation calls — out of scope by design.
- Notify dedup (`notification_history` lookup) before every send.
- `alembic check` + `pytest tests/db/test_smoke.py` after any migration.
