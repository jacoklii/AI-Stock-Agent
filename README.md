# AI Stock Agent

An always-on research partner for stock and market intelligence. It **researches** (industries,
sectors, macro, geopolitics), **analyzes** (patterns, signal vs. noise, historical analogs), and
**surfaces** findings organized by sector and significance — with article URLs as first-class
content. Like a Palantir-style surveillance system for the market, it keeps the investor proactive
rather than reactive.

> It never recommends, speculates, or decides — **no buy / sell / hold, no valuation calls.** That
> belongs to the human.

## How it works

Two engines run side by side:

- **Scraper (breadth)** — continuous news ingest, noise filtering, and per-section synthesis. Always
  on, cheap, no deep model in the loop.
- **Researcher (deep research)** — bounded agent sessions with web autonomy that reason, cross-check,
  and write findings with citations. Triggered by signal convergence or a user request.

Data sources, one wrapper each:

| Source                     | Domain                                                     |
| -------------------------- | ---------------------------------------------------------- |
| **yFinance**               | Stocks — quotes, daily prices, quarterly financials        |
| **Alpha Vantage** NEWS     | Macroeconomics, industry trends, earnings / M&A            |
| **GDELT**                  | Geopolitics, global events, the state of human society     |

## Stack

- **Backend** — FastAPI, SQLAlchemy (async), Alembic, APScheduler, Postgres + pgvector, Pydantic v2.
- **Frontend** — React 19, TanStack Query, Vite, Tailwind, openapi-typescript.
- **Infra** — Docker Compose (db + api + web), Caddy (TLS + basic auth) under the `prod` profile.

## Repository layout

```
ai-stock-agent/
├── README.md
├── CLAUDE.md               # engineering conventions + hard rules
├── docs/ARCHITECTURE.md    # product + system design (source of truth)
├── docker-compose.yml      # db + migrate + api + web (+ caddy under --profile prod)
├── infra/Caddyfile         # prod front door: TLS + basic auth
├── .env / .env.example     # secrets (never committed) + template
├── backend/                # FastAPI service (app/, tests/, alembic)
└── frontend/               # React + Vite single-page app
```

## Quickstart

**Full local stack** (db + api on `:8000` + web UI on `:3000`), from the repo root:

```bash
cp .env.example .env        # then fill in API keys + DB URL
docker compose up -d --build
docker compose down
```

**Backend only** (from `backend/`):

```bash
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload      # FastAPI on :8000
pytest                             # hermetic — no Postgres needed
```

**Frontend only** (from `frontend/`):

```bash
npm install
npm run dev                        # Vite on :5173, proxies /api → :8000
npm run build                      # type-check + production bundle
npm run gen:api                    # regenerate src/api/schema.d.ts after API changes
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — product behavior, the three-panel terminal, the
  research domains, and system design.
- [CLAUDE.md](CLAUDE.md) — engineering conventions, data-layer rules, and the hard constraints every
  change must follow.
- Deployment to a GCE VM runs via `docker compose --profile prod up -d --build` (adds Caddy for TLS +
  basic auth).
