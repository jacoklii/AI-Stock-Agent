# CLAUDE.md

Read `ARCHITECTURE.md` in full before writing code — it is the source of truth.

## Overview

Always-on research partner for stock and market intelligence. The agent 
**researches** (industries, sectors, macro), 
**analyzes** (patterns, signal vs. noise, historical analogs), and 
**updates** (surfaces findings organized by sector/significance with article URLs as primary content). It never recommends, speculates, or decides — that belongs to the human.

## Data sources

Three external feeds, one wrapper each in `app/providers/` (a swap touches one file). Each owns a slice of the four surveillance domains:

- **yFinance** (`market.py`) — stocks: quotes, daily prices, quarterly financials. The quantitative surface (feeds the quant panels + the agent's `get_financials`/`get_price_history`); not a news domain.
- **Alpha Vantage** NEWS_SENTIMENT (`alpha_vantage_news.py`) — financial news: **macroeconomics, industry trends, earnings/M&A**. AV's relevance score is the stored `significance`; its summary is stored verbatim as canonical (no per-article LLM, no embedding).
- **GDELT** (`gdelt.py`) — **geopolitics, global events, geographic mapping, the state of human society**. Fills the domain AV structurally cannot: AV is financial-only and has no geopolitics topic. The geopolitics domain is GDELT-fed, not keyword-proxied off AV.

Domain map: GDELT → `geopolitics` · AV → `macro` / `industry` / `market` · yFinance → quant panels.

## Hard rules

- AI never recommends buy/sell/hold or makes valuation calls.
- "Look at this" outputs require ≥ 3 independent substantive inputs.
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
- Constants in `app/config.py`, never inside `app/` modules; one-off ops scripts go in `scripts/`.
- `scheduler/` may import `workflows/`, never the reverse.
- Failures surface in the `tasks` table — no silent partial successes.
- Add complexity only when current behavior measurably fails.

## Commands

All backend commands from `backend/` with the venv active. Compose from repo root.

```bash
# Full local stack: db + api + web UI on http://localhost:3000 (repo root)
docker compose up -d --build
docker compose down

# Setup (backend/, one-time)
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
source .venv/bin/activate

# Migrations
alembic upgrade head
alembic revision --autogenerate -m "describe change"
alembic check

# Run
uvicorn app.main:app --reload   # FastAPI on :8000

# Tests (hermetic — no Postgres needed)
pytest
pytest tests/api tests/workflows

# Frontend (frontend/)
npm run dev       # Vite on :5173, proxies /api → :8000
npm run build     # type-check + production bundle
npm run test      # vitest
npm run gen:api   # regenerate src/api/schema.d.ts after route/schema changes (commit it)

# Production (GCE VM — see DEPLOY.md)
docker compose --profile prod up -d --build   # adds Caddy: TLS + basic auth
```

Config from repo-root `.env` (copy `.env.example`). `alembic.ini` at `backend/`.
The brief on a cloud host goes via email + in-app (iMessage needs a macOS host).

## File structure

```
ai-stock-agent/
├── README.md               # entry point: what it is, stack, quickstart
├── CLAUDE.md               # engineering conventions + hard rules (this file)
├── docs/ARCHITECTURE.md    # product + system design (source of truth)
├── docker-compose.yml      # db + migrate + api + web (+ caddy under --profile prod)
├── infra/Caddyfile         # prod front door: TLS + basic auth
├── .env                    # secrets, never committed
├── .env.example
├── backend/
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── Dockerfile  .dockerignore
│   ├── scripts/                 # one-off ops scripts + export_openapi.py
│   ├── tests/                   # hermetic: api/, workflows/, agents/
│   ├── data/                    # actual state — gitignored
│   │   └── postgres/            # local DB volume (docker-compose mounts here)
│   └── app/
│       ├── main.py
│       ├── config.py           # BRIEF_CORE, DEFAULT_THRESHOLDS, model names
│       ├── utils.py            # Helper functions, no classes
│       ├── db/
│       │   ├── base.py         # PydanticJSONB, Base
│       │   ├── enums.py        # closed PG enum sets
│       │   ├── payloads.py     # Pydantic models for JSONB columns
│       │   ├── session.py      # readonly_session(), SessionLocal
│       │   ├── models/         # companies, market_data, news, analysis, delivery, chat, user, tasks
│       │   └── migrations/
│       ├── providers/          # market, news, gdelt, embeddings, llm, notifier
│       ├── tools/              # registry, tool_schema, research, analysis, delivery, state, invoke
│       ├── agents/             # budget.py + researcher/ (agent, schemas, prompt_*.md)
│       ├── analysis/           # fundamental_score.py, sentiment_analysis.py
│       ├── workflows/          # shared: runtime, concurrency, triggers, registry, digest_types
│       │   ├── research/       # news_ingest, gdelt_ingest, deep_research, followup, sector_research
│       │   ├── analysis/       # company_rescore, prose_regeneration, significance_recheck
│       │   └── message/        # daily_digest, market_pulse
│       ├── scheduler/          # schedule.py, runner.py (APScheduler)
│       ├── mcp_server/         # server.py
│       └── api/                # deps, schemas, routes/ (home, chat, research, agent, world, events, …)
└── frontend/
    ├── Dockerfile  nginx.conf  vite.config.ts  package.json
    ├── index.html  public/
    └── src/
        ├── api/                # schema.d.ts (generated, committed), client, queries
        ├── components/         # NavShell, ArticleList, ArticleRow, BudgetGauge, FreshnessStamp, …
        ├── lib/                # format, freshness (+ tests)
        └── views/              # Home, Chat, Research(+Detail), Industries(+Detail),
                                # CompanyDetail, World, Settings
```

## Safety & security

- `.env` is never committed — holds all API keys and the DB connection string.
- Tools receive `readonly_session()`; writes go through `SessionLocal` in workflows only.
- No buy/sell/hold output, no trade execution, no valuation calls — out of scope by design.
- Notify dedup (`notification_history` lookup) before every send.
- `alembic check` + `pytest tests/db/test_smoke.py` after any migration.
