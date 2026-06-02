# DESIGN
## GOAL
Create an agentic AI system that does the market research I would do, surfaces what I should know, and keeps me current — without making decisions for me.

### AI-Specific
Repetitive, complex workflows, insights, and timely tasks belong to the AI. It continuously researches the market, sectors I care about, and companies it has touched; analyzes what it finds; and synthesizes updates so I stay current.

### Human-Specific
Leave the complex reasoning, judgement, and speculations to the user. AI should **NEVER** replace decision-making, observations, speculations, and future-thinking/looking ahead.
Interpret how social, political, and market events will affect the stock market, a stock, and the future. Also catch what the AI got wrong.

## The 3 Aspects

- **Researches** — stocks & funds, sectors, global events, and market news. Research is the primary loop; everything else flows from it.

- **Analyzes** — summarizes recent news and events for closely-covered companies and sectors, identifies historical patterns, helps me understand the industry and what I'm buying.

- **Updates** — proactively surfaces the articles I should read, organized by sector and significance, with the AI's synthesis as orientation alongside — never in place of the sources.

# ARCHITECTURE

## Requirements

**Functional**
- Continuously research watchlist, flagged sectors, and the broader market.
- Answer on-demand research (stock, sector, theme, event) from stored data where possible.
- Deep analysis (scores always; prose on shift) for watchlist + flagged sectors. Lightweight tracking for the broader research surface.
- Auto-classify event significance from structural signals (price impact, volume, multi-source coverage, sentiment).
- Two update shapes: **brief pulse** (iMessage/WhatsApp + platform) and **detailed digest** (email + platform).
- Article URLs are primary; AI summaries are orientation. Every prose output cites sources.
- Platform mirrors the email: snapshot up top, sections with article lists below.

**Non-functional**
- Single user, always-on.
- Cost-bounded: deep analysis scoped; research surface broader but lightweight.
- Provider-swappable (one wrapper per external dependency).
- Traceable (every output ties back to its inputs).
- Knowledge-layer only; no buy/sell/hold.
- Failed jobs visible and re-runnable.

## Constraints

**Hard**
- AI never recommends buy/sell/hold or makes valuation calls.
- AI accesses DB only through predefined tools (read-only). No AI-generated SQL.
- Every prose row stores source IDs.
- **AI synthesis is presented alongside primary sources, never in place of them.** Article URLs are first-class; summaries are orientation.
- Embedding model is fixed; changing it is an explicit backfill, not a silent swap.
- No raw article body text stored — summaries are the canonical record.
- `company_id` for joins, never ticker.
- **Deep scoring** (fundamental + sentimental) runs only on watchlist + flagged sectors. Research surface is broader by design.
- All timestamps UTC; sectors from one controlled vocabulary.

**Soft**
- One Postgres over multi-store.
- Scheduled batch over streaming.
- Predefined tools over open agent planning.
- **One agent until role divergence emerges.** Split when a new agent would have a fundamentally different contract (inputs, outputs, cadence, operating mode) — not when an existing agent has multiple tasks.
- Simplicity over performance until measured.
- Retention: 90d routine / 2y notable / indefinite significant.
- Sparse prose, dense scores.
- Email + brief channels first; on-demand-via-message deferred.
- New external dependency goes behind a wrapper before its first use.

## Change & Separation

- External APIs behind internal wrappers — provider swap touches one file.
- Prompts in versioned `prompts/`, separate from schema migrations.
- Scoring rubrics versioned (`rubric_version` on score rows) — old scores remain interpretable.
- Embedding model name stored alongside every vector; LLM model name on every analysis row.
- Daily prices / quarterly financials / ad-hoc news / sparse prose — separate tables, separate cadences.
- **Research surface vs. deep coverage are separate concepts.** Any company the AI has touched lives in `companies`; only those with `coverage_tier = watchlist` get deep scoring.
- **Brief pulse vs. detailed digest are separate delivery shapes** with separate templates and triggers.
- **Agents specialize by role, not by task.** Multiple prompts within one agent are fine. Multiple agents for one role is overhead.
- **When an agent task grows beyond one LLM call** — needing intermediate state, multiple decision points, or branching logic — **it has become a workflow.** Workflows are the home for multi-step logic; if the workflow's sub-tasks are role-distinct from `researcher`, a specialized agent is added to handle them.
- UI talks only to FastAPI, never directly to Postgres.
- Tools are pure functions; agents compose them but don't own them.

## Layers

### 1. Interface Layer

Read-mostly; surfaces state the data layer already holds. No computation in the UI. **Article URLs are the primary content; AI summaries are orientation alongside.**

**Views**
- **Home (detailed digest mirror)** — snapshot at the top synthesizing what's going on right now, then sections by sector / macro. Each section has its own snapshot followed by a ranked article list. Every article shows its URL and the AI's brief summary underneath. Mirrors the email so platform and inbox stay in parity.
- **Market pulse** — current state of the pulse set (fixed core + user mega-caps), latest scheduled pulse displayed, button to trigger an on-demand pulse.
- **Company detail** — for any company in `companies`: ranked article list with summaries (primary), score trajectory chart if watchlisted, latest prose alongside, source list.
- **Sector view** — section snapshot, ranked article list with summaries, sector aggregate scores, surfaced movers.
- **Alerts inbox** — chronological notifications, each links to its underlying article or finding.

**Interactions**
- Promote/demote company to watchlist; attach metadata (why, what thresholds matter).
- Flag/unflag a sector for deep research.
- Edit the user mega-caps in the pulse set.
- Open any article directly (URLs clickable everywhere they appear).
- Mark an article read; mark notifications dismissed.
- Ask follow-ups scoped to a company, sector, or theme — answered from stored research. External research if needed

**Notifications**
- **Email** — detailed digest. Always starts with the top-level snapshot. Sections by sector / macro: section snapshot + article URLs each with a brief summary underneath, include key stocks (1 - 5) to watch for each.
- **iMessage / WhatsApp** — brief pulse. Pulse set state and a short snapshot of current market movement.
- **In-app inbox** — mirrors what was sent on either channel.
- TypeScript: Chose for typed UI, shareable schemas with FastAPI.

**Freshness** — every score, prose, article, and pulse displays its `generated_at` / `data_through`. Stale data must look stale.

### 2. Application Layer

Orchestrated pipelines, not open agent planning. Chose for predictable cost, behavior, and debuggability.

**Agent**
- One `researcher` agent. Handles all LLM work via task-dispatched prompts: article summaries, significance classification, section snapshots, company prose, pulse snapshots, top-of-digest synthesis, on-demand follow-ups.
- Single agent because all outputs share the same role — read inputs, produce a structured deliverable.
- **New agents added only when a new role emerges** (different inputs, outputs, cadence, or operating mode) — not when an existing agent has multiple tasks.
- **When a task grows beyond a single LLM call** (intermediate state, multiple decisions, branching), it has become a workflow. A specialized agent is added only if its sub-tasks are role-distinct from `researcher`.
- Each task carries its own prompt, model, tool allowlist, and output schema. Agent is a thin dispatcher.

**Tools (predefined, MCP-exposed)**
- `get_company` — identity + coverage tier.
- `get_financials`, `get_price_history` — time-series rows.
- `screen_stocks` — parameterized SQL screen, ranked candidates.
- `get_news_events` — by company or sector, filtered by significance.
- `get_pulse_state` — latest prices/changes for the pulse set.
- `get_latest_scores`, `get_score_history`, `get_latest_prose` — watchlist + flagged sectors only.
- `search_similar_events` — semantic search over stored summaries and prose.
- `compile_reading_list` — ranks events, groups by sector/macro, generates snapshots + summaries via agent.
- `send_imessage` (AppleScript), `send_whatsapp` (pywhatkit), `send_email` (SMTP).
- `notification_history` — dedupes across channels before sending.

**Workflows (pipelines)**
- **Daily research & digest** — ingest → refresh scores → researcher generates section snapshots, article summaries, top-of-digest synthesis → assemble → email + platform.
- **Market pulse** — morning/midday/close → fetch pulse state → researcher generates snapshot → iMessage/WhatsApp + platform.
- **News ingest** — pull events → classify significance → embed summaries → write rows → enqueue watchlisted companies for re-scoring.
- **Sector research** — aggregate sector scores, identify movers, surface notable activity → feeds digest sections.
- **On-demand research / pulse** — answer from stored research first; fetch fresh only if missing or stale.
- **Significance re-check** — re-evaluate older events against subsequent price/volume; promote tier if warranted.

**Triggers**
- Scheduled (digest; pulse morning/midday/close; sector research).
- Event-driven (news ingest → re-scoring).
- Threshold-driven (score shift → prose regeneration).
- On-demand (interface request).

**Execution rules**
- Agent sees only the tools relevant to the current task.
- Never writes SQL or fetches arbitrary URLs.
- Outputs are structured rows + citations — not free-form chat.
- Failures logged to `jobs`; workflow retries or fails cleanly.
- Concurrency: one workflow per company; small parallelism across companies.

### 3. Data Layer

High-quality data, kept based on significance. Long retention for items that drive deep value (major decisions, market shifts); short retention for noise.

#### Structured (relational tables)

- **`companies`** — the spine and the **research surface**. `[ticker, name, sector, sub-industry, exchange, coverage_tier]`. Every stock the AI has ever touched. `coverage_tier`: `watchlist` (deep coverage) / `discovered` (lightweight tracking, surfaced by research) / `archived`.
- **Watchlist metadata** — per-stock context for watchlisted companies: why added, why relevant, what thresholds matter, when added.
- **Price history** — daily prices only. Intraday pulled on demand from yFinance when needed.
- **Financial data & history** — `[price, market cap, P/E, EPS, CAPEX, EBITDA, ...]`. Time-series, one row per company per period. Populated for watchlist + flagged-sector companies.
- **Catalyst / earnings calendar** — earnings dates, dividends, ex-dividends.
- **User preferences & alerts** — interested sectors, role each sector plays in portfolio, default thresholds, notification channels, quiet hours, plus the **market pulse set**: `pulse_core` (fixed: SPY/VOO, DJW, QQQ, gold, 10Y, DXY, VIX) and `pulse_user` (user-chosen mega-caps).
- **Notification / alert history** — what was sent, when, on which channel, with what template. Prevents duplicates across channels and across sources covering the same event.
- **News events** — metadata + AI summary per event: `[url, source, published_at, headline, tickers, sentiment_score, significance_tier, summary, embedding]`. Tracked for any company the AI touches (full research surface), not just the watchlist. URL is first-class display content. Original article body is **not** stored — the summary is the canonical record.
- **Sector aggregates** — sector ETF prices, sector breadth, rolled-up sentiment.
- **Fundamental scores** — numeric, dense, historical. **Watchlist + flagged sectors only.** Not generated across the broader research surface — deliberate cost/focus decision.
- **Sentimental scores** — numeric, dense, historical. Same scope as fundamental scores.

#### Semi-structured (JSONB columns)

Used where the shape of a field varies legitimately by row type. Queryable fields stay structured; variable payloads go in JSONB.

- **Reading list runs** — one row per compiled digest: `[generated_at, top_snapshot, sections (jsonb: ordered list of {section_title, snapshot, article_refs[]}), source_event_ids[]]`. Article refs point into `news_events`; the digest doesn't duplicate article content.
- **Pulse runs** — one row per pulse: `[generated_at, slot (morning/midday/close/on-demand), pulse_snapshot, instruments (jsonb), channel_sent]`.
- **Fundamental prose** — sparse rows, one per genuine shift in the AI's read. Stored only when inputs move beyond threshold and the new prose differs meaningfully from the previous. **Insights that connect dots — never a piece of decision.**
- **Sentimental prose** — same shape and rule as fundamental prose.
- **Job/run state** — `[job_type, status, started_at, completed_at, error_message, params (jsonb), result_summary (jsonb)]`. Queryable fields are columns; job-specific inputs/outputs are JSONB.
- **Source provenance / citations** — links each analysis row to the news_events and data sources that fed it.

#### Embeddings (pgvector columns)

Embeddings live as columns on the tables they describe — not as a separate store.

- On `news_events.summary` — "find past events similar to this one." Powers research across the broader surface and helps the reading-list compiler cluster related coverage.
- On `fundamental_prose` and `sentimental_prose` — "find past analyses with similar themes," and used to detect whether newly generated prose differs meaningfully from the previous row.

Embedding model is fixed and stored alongside the vector so future model changes are detectable.

### 4. Technical Layer

**External APIs**
- **yFinance** — prices, financials, pulse-set quotes. Chose for simplicity/access (over Polygon, IEX paid tiers).
- **News provider** — Finnhub. Driven by depth using the free tier. Covers the broader research, sentiment scoring, not just watchlist.
- **Anthropic API** — Claude models. Chose for analysis quality and native tool/MCP support.
- **Notification providers** — SMTP (email), iMessage bridge or WhatsApp Business API. Wrapped behind `send_message` for either iMessages or WhatsApp, and `send_email`
**Internal APIs**
- **FastAPI** — data + workflow endpoints to the TypeScript UI. Chose for async, typed, Python-native (over Flask, Django).
- **MCP server** — exposes tool registry to the AI. Chose for one tool interface across Claude Code (dev) and runtime.

**Models (selected per task within the researcher agent)**
- **Sonnet / Opus** — section snapshots, company prose, top-of-digest synthesis, on-demand follow-ups. Chose for quality on synthesis tasks where readability and nuance matter.
- **Haiku** — per-article summaries, significance classification, pulse snapshots. Chose for cost at volume.
- **Embeddings** — one fixed model (`text-embedding-3-small` or `voyage-3`). Chose fixed-model over flexibility to avoid silent retrieval drift.

**Infrastructure**
- **Always-on host** — small VPS or on cloud (GCP). Chose over laptop because research, monitoring, and scheduled pulses must survive sleep.
- **Scheduler** — cron or APScheduler. Chose lightweight over heavy orchestrator (Airflow, Prefect).
- **Postgres + pgvector** — single store. Chose over multi-store for one backup, one query language, joins across structured + vector + JSONB.
- **Secrets** — env file, not committed. One config layer.

**Data scaling (v1 targets)**
- Watchlist (deep coverage): ~50–100 companies.
- Flagged sectors: ~3–8 (sector research universe a few hundred companies per sector).
- Broader research surface (discovered tier): potentially hundreds of companies; lightweight tracking only.
- Pulse set: ~7 fixed core instruments + ~4–8 user mega-caps.
- News events ingested: ~50–500/day across all coverage.
- Reading-list runs: 1/day. Pulse runs: 3/day scheduled + on-demand.
- Score rows: ~10–20k/year (watchlist × daily). Prose rows: ~200–500/year (sparse by design).
- Embeddings: well under 1 GB total.
- Revisit infrastructure when any of these grow 10×.

**Complexity level**
- v1 is personal-scale, single-user, batch-only.
- Deferred until measured need: streaming, multi-user, raw-text RAG, open agent planning, sub-second feeds, on-demand-pulse via message reply, mobile-native push.
- Add complexity only when current behavior measurably fails.