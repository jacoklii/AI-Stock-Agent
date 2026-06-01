# REPO STRUCTURE

Companion to `ARCHITECTURE.md`. Architecture describes the system; this describes where the code lives.

## Tree

```
AI-STOCK-AGENT/
├── .env.example
├── .gitignore
├── ARCHITECTURE.md
├── CLAUDE.md
├── REPO_STRUCTURE.md
├── docker-compose.yml
└── src/
    ├── backend/
    │   ├── app/
    │   │   ├── agents/
    │   │   │   └── researcher/
    │   │   │       ├── agent.py                   # thin dispatcher
    │   │   │       ├── prompt_article.md
    │   │   │       ├── prompt_significance.md
    │   │   │       ├── prompt_section.md
    │   │   │       ├── prompt_company_prose.md
    │   │   │       ├── prompt_pulse.md
    │   │   │       ├── prompt_top_snapshot.md
    │   │   │       └── prompt_followup.md
    │   │   ├── analysis/                          # pure-math: scoring, prose change detection (no LLM)
    │   │   ├── api/                               # FastAPI routes
    │   │   ├── db/
    │   │   │   ├── __init__.py                    # re-exports Base, session, all models
    │   │   │   ├── base.py                        # DeclarativeBase
    │   │   │   ├── session.py                     # async engine, session factory, get_session()
    │   │   │   ├── enums.py                       # CoverageTier, SignificanceTier, JobStatus, ...
    │   │   │   ├── payloads.py                    # Pydantic models for JSONB columns
    │   │   │   ├── models/
    │   │   │   │   ├── __init__.py
    │   │   │   │   ├── companies.py               # Company, WatchlistMetadata
    │   │   │   │   ├── market_data.py             # PriceHistory, FinancialData, CatalystCalendar
    │   │   │   │   ├── news.py                    # NewsEvent, SectorAggregate
    │   │   │   │   ├── analysis.py                # Scores + prose (fundamental + sentimental)
    │   │   │   │   ├── delivery.py                # ReadingListRun, PulseRun, NotificationHistory
    │   │   │   │   ├── user.py                    # UserPreferences
    │   │   │   │   └── jobs.py                    # Job
    │   │   │   └── migrations/
    │   │   │       ├── env.py
    │   │   │       ├── script.py.mako
    │   │   │       └── versions/                  # one file per migration, append-only
    │   │   ├── mcp_server/                        # transport — imports from tools/
    │   │   ├── providers/                         # external API wrappers (yFinance, Finnhub, Anthropic, Notifier)
    │   │   ├── scheduler/                         # cron registrations only
    │   │   ├── tools/                             # peer of agents — used by agents, workflows, api, mcp_server
    │   │   ├── workflows/                         # orchestrated pipelines, thin
    │   │   ├── config.py                          # settings, pulse_core list, default thresholds
    │   │   └── main.py                            # FastAPI entry point
    │   └── tests/                                 # mirrors app/ subfolders
    ├── frontend/
    │   ├── api/                                   # generated client from FastAPI OpenAPI
    │   ├── components/
    │   ├── lib/                                   # formatters, hooks, utilities
    │   ├── public/
    │   └── views/
    └── data/                                      # actual state — gitignored
        ├── postgres/                              # local DB volume (docker-compose mounts here)
        └── snapshots/                             # ad-hoc pg_dump exports
```

## Schema Framework

- **SQLAlchemy 2.0 (async)** — DB models. Chose for first-class pgvector + JSONB + FastAPI integration. Models live in `db/models/`.
- **Alembic** — migrations. Append-only in `db/migrations/versions/`. One logical change per migration. Hand-edit for vector indexes (HNSW vs. IVFFlat); autogenerate doesn't pick.
- **asyncpg** — Postgres driver. Chose for async-native and SQLAlchemy 2.0 compatibility.
- **pgvector-python** — adds `Vector(dim)` SQLAlchemy column type and similarity operators.
- **JSONB (Postgres native)** — for columns with legitimately variable shape (Job.params, Job.result_summary, ReadingListRun.sections, PulseRun.instruments). Queryable fields stay as typed columns; only the variable payload goes in JSONB. Schemas defined as Pydantic models in db/payloads.py — Postgres doesn't enforce shape, the application does.
- **Pydantic v2** — API schemas (in `api/`) and JSONB payload validators (in `db/payloads.py`). Kept separate from DB models — DB describes what's stored, API describes what's transmitted.

## Folder Notes

- **`agents/researcher/`** — the only agent today. Folder structure is ready for siblings (`agents/portfolio/`, etc.) when role-distinct agents emerge. Each agent owns its prompts (1:1 prompt-to-task within the agent).
- **`tools/`, `workflows/`, `agents/` are peers** — not nested. Workflows use agents and tools. Agents use tools. Tools are used by everyone (agents, workflows, api, mcp_server). Nesting would invert dependencies.
- **`analysis/`** — deterministic math only. Scoring formulas, embedding-similarity check for prose change detection. No LLM calls in this folder.
- **`db/`** — schema + session + migrations. Code that *describes* the data layer.
- **`data/`** — actual state. Postgres volume, backup snapshots. Gitignored. No seeds — fixed constants like `pulse_core` live in `app/config.py`, not in seed files.
- **`mcp_server/`** — transport surface over `tools/`. Same tools work in dev (Claude Code calls them directly) and runtime (AI calls them via MCP).
- **`scheduler/`** — registers workflows on cron expressions. Workflows themselves don't know they're scheduled; they're callable from anywhere (scheduler, API, on-demand).

## Import Direction

- `db/` imports nothing from elsewhere in `app/`. Everything imports from `db/`.
- `tools/` imports from `db/` and `providers/`. Nothing else.
- `agents/` imports from `tools/` and prompts.
- `workflows/` imports from `agents/`, `tools/`, `providers/`, `db/`.
- `api/` and `mcp_server/` import from `workflows/`, `tools/`, `db/`.
- `scheduler/` imports from `workflows/` only.

No circular imports possible by construction.

## Growth

When a new role-distinct agent is needed: add `agents/<name>/` as a sibling of `researcher/`. Same internal shape (agent.py + prompts).

When a one-off ops script is needed (seeding a curated sector universe, backfilling embeddings after a model change): add a top-level `scripts/` directory. Don't put scripts inside `app/`.

When test fixtures grow beyond inline: `tests/fixtures/` — not `data/seeds/`.