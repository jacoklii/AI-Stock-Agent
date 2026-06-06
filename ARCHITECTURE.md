# DESIGN

## GOAL
Create an agentic AI system that's my research partner and analyst. It does the deep research I can't do alone — across industries, supply chains, futures (AI, quantum, aerospace, finance), macro and geopolitics — surfaces what genuinely matters, filters noise, and points me at patterns with data. It never decides for me.

### AI-Specific
Repetitive workflows, signal-filtering, pattern recognition, and timely tasks belong to the AI. It runs in **shifts**: bounded deep-research sessions where it pursues investigations, interleaved with **rest periods** where automated breadth coverage continues. When automation surfaces something substantive, the agent can be called into a session.

### Human-Specific
Complex reasoning, judgement, speculation, valuation, and decisions stay with me. I direct what gets investigated, redirect threads, decide what to act on, and catch what the AI got wrong. The agent never recommends buy/sell/hold and never makes the final valuation calls, only predicts it.

## The 3 Aspects

- **Researches** — industries, sectors, supply chains, global events, futures, macro and geopolitics. Research is the primary loop. The watchlist is downstream of research, not its boundary.

- **Analyzes** — synthesizes patterns from data, identifies historical analogs, distinguishes signal from noise. Output is observations + supporting data + clear reasoning. Never conclusions.

- **Updates** — proactively surfaces findings the agent has made, organized by industry/sector/macro, with article URLs as the primary content and the agent's synthesis alongside.

---

# ARCHITECTURE

## Requirements

**Functional**
- Three-layer coverage: **global movement** (macro/supply chain/geopolitics, filtered for substantiveness), **critical industries + sectors** (curated set, ongoing reads), **watchlist** (close coverage, mostly user-chosen).
- Two operating modes: **breadth** (automated, restricted tools, single-step outputs) and **depth** (autonomous, expanded tools, multi-step investigation loops).
- Investigation threads as the agent's working memory — topic, open questions, accumulated findings, status.
- Chat is the primary direction interface — start, redirect, pause, or kill threads; get briefings; adjust budget.
- Pattern synthesis with a strict output shape: three or more independent substantive inputs, shown with data and reasoning.
- Active sessions are bounded (wall-clock + token budget); automation runs continuously through rest periods.
- Two delivery shapes: **brief pulse** (iMessage/WhatsApp + platform) and **detailed digest** (email + platform).
- Article URLs are primary; AI summaries are orientation alongside. Every output cites the key sources used.

**Non-functional**
- Single user.
- Always-on for breadth automation; deep sessions bounded by schedule, triggers, and budget.
- Cost-bounded by **pacing and concurrency** (daily/weekly token ceiling, ≤3 active deep threads, agent self-throttles).
- Provider-swappable (one wrapper per external dependency).
- Traceable (every finding, pattern, and prose ties back to its inputs).
- Knowledge-layer only; no buy/sell/hold, no valuation calls.
- Failed jobs visible and re-runnable.

## Constraints

**Hard**
- AI never recommends buy/sell/hold or makes valuation calls.
- "Look at this" outputs require **three or more independent substantive inputs**, each shown with data and reasoning. No single-source claims.
- AI **reads freely** through breadth tools, deep-mode tools, and MCP. AI **writes only through specific paths**; no raw SQL against production data, no arbitrary state changes.
- Every prose, finding, and pattern row stores source IDs.
- Cache holds fetched content with TTL; persistent storage holds **summaries and key findings only** — never whole transcripts or article bodies.
- Embedding model is fixed; changes are explicit backfills.
- `company_id` for joins, never ticker.
- All timestamps UTC; sectors and industries from controlled vocabularies.

**Soft**
- One Postgres + pgvector over multi-store.
- Predefined tools for breadth; expanded tools for deep research.
- Daily and weekly token budget; agent throttles itself to fit.
- Active session capped at 1–3 hours wall-clock; agent rests after.
- Cache-first on web tool calls; bypass only when explicitly told or when accuracy demands freshness.
- Findings-first on deep research; check CAG before fetching.
- Retention: news events 90d / 2y / indefinite by significance; threads retained while active + 90d after close; key findings extracted to permanent store before thread closes.
- One agent until role divergence emerges.
- New external dependency behind a wrapper before first use.

## Change & Separation

- External APIs behind internal wrappers — provider swap touches one file.
- Prompts in versioned `app/[agent role]/prompts/`, separate from schema migrations.
- Embedding model name stored alongside every vector; LLM model name on every analysis row.
- Daily prices / quarterly financials / ad-hoc news / sparse prose — separate tables, separate cadences.
- **Research surface vs. deep coverage are separate concepts.** Coverage tier on `companies` lives in one column; deep coverage is a property of where the agent is currently investigating, not a permanent label.
- **automation vs. deep research are separate modes.** Same agent, different tool allowlist and execution model.
- **Substantiveness vs. significance are separate filters.** Substantiveness gates ingestion ("is this signal or noise?"); significance ranks what survives ("how big a deal is this?").
- **Cache vs. persistent storage are separate.** Cache holds full fetched content with TTL; persistent stores only summaries and findings. Promotion from cache to persistent is explicit.
- **Thread state (working memory) vs. analysis state (durable record) are separate.** Threads are mutable and short-lived; analysis is append-only and long-lived.
- **Brief pulse vs. detailed digest** are separate, with different templates and triggers.
- Agents specialize by role, not by task. Multiple prompts within one agent are fine; multiple agents for one role is overhead.
- When a task grows beyond a single LLM call — needing intermediate state, multiple decisions, branching — it has become a workflow. Specialized agents are added only when role-distinct from `researcher`.
- UI talks only to FastAPI, never directly to Postgres.
- Tools are pure functions; agents compose them but don't own them.

---

## Layers

### 1. Interface Layer

Read-mostly with one major exception: the chat panel is a direction surface. Article URLs are the primary content; AI synthesis is orientation alongside.

**Views**
- **Home** — agent state at a glance: what's the agent working on, what did it find today, current session indicator (deep / resting / automation), recent patterns, top-of-digest snapshot. The digest is a section on home, not the whole of home.
- **Chat** — primary direction surface. Persistent conversation. Start/redirect/pause/kill threads, ask for briefings, adjust budget, promote findings.
- **Threads** — list of active and recent investigations. Each shows topic, open questions, key findings, sources, status, what the agent is doing next.
- **Industries** — curated critical-industries set (AI, semis, aerospace, defense, manufacturing, quantum, chemicals, finance/banking, …). Each has its current read, recent substantive events, active threads touching it.
- **Sector view** — same shape as industries but for the broader sector taxonomy.
- **Company detail** — ranked article list with summaries, score trajectory if covered, prose alongside, threads touching this company.
- **Market pulse** — pulse-set state (fixed core + user mega-caps), latest scheduled pulse, on-demand trigger.
- **Alerts inbox** — chronological notifications, each links to the underlying finding or article.
- **Noise audit** — items filtered as non-substantive, with reason. User can promote back to signal.

**Interactions**
- Chat with the agent (primary direction).
- Promote / demote a company on the watchlist.
- Edit the critical-industries list.
- Edit user mega-caps in the pulse set.
- Start / redirect / pause / close threads.
- Raise / lower the weekly token budget.
- Promote a noise item back to signal.
- Open any article URL (clickable everywhere).
- Mark notifications read / dismissed.

**Notifications**
- **Email** — detailed digest. Starts with top snapshot, then sections by industry / sector / macro. Each section has its snapshot + article URLs with brief summaries underneath.
- **iMessage / WhatsApp** — brief update. State + short market-movement snapshot.
- **In-app inbox** — mirrors what was sent on either channel.
- TypeScript: Chose for typed UI, shareable schemas with FastAPI.

**Freshness** — every score, update, article, pattern, and pulse shows its `generated_at` / `data_through`. Stale data must look stale.

### 2. Application Layer

Two operating modes, one research agent. Breadth is orchestrated and predictable; deep is autonomous within bounded sessions.

**Operating modes**
- **Breadth mode** — called inside automation pipelines. Restricted tool allowlist. Single-step structured outputs. Predictable cost. Runs continuously.
- **Deep mode** — runs inside bounded sessions. Expanded tool allowlist including web search/fetch, SEC filings, transcripts. Multi-step investigation loops. Owns thread state. Cost-bounded by session budget.

**Agent**
- One `researcher` agent with mode-aware task dispatch. Tasks: per-article summary, substantiveness classification, significance classification, section snapshot, industry read, company prose (fundamental + sentimental), pulse snapshot, top-of-digest synthesis, pattern synthesis, deep investigation, on-demand follow-up.
- Each task carries: operating mode, prompt, model, tool allowlist, structured output schema.
- New agents added only when a new role emerges (different inputs, outputs, cadence, or operating mode).
- When a task grows beyond a single LLM call — needing intermediate state, multiple decisions, branching — it has become a workflow. A specialized agent is added only if role-distinct from `researcher`.

**Tools (breadth mode, MCP-exposed)**
- `get_company` — identity + coverage tier.
- `get_financials`, `get_price_history` — time-series rows.
- `screen_stocks` — parameterized SQL screen.
- `get_news_events` — by company / sector / industry, filtered by significance and substantiveness.
- `get_pulse_state` — latest prices/changes for the pulse set.
- `get_latest_scores`, `get_score_history`, `get_latest_prose` — watchlist + flagged industries only.
- `search_similar_events` — semantic search over stored summaries and prose.
- `classify_substantiveness` — signal / noise / ambiguous, with reason.
- `compile_reading_list` — ranks events, groups by section, generates snapshots + summaries via agent.
- `send_imessage` (AppleScript), `send_whatsapp` (pywhatkit), `send_email` (SMTP).
- `notification_history` — dedupes across channels before sending.

**Tools (deep mode additions)**
- `web_search` — open-ended search.
- `web_fetch` — fetch a specific URL.
- `fetch_sec_filing` — 10-K, 10-Q, 8-K by company.
- `fetch_earnings_transcript` — earnings call transcripts.
- `cache_get`, `cache_set` — short-term TTL cache for fetched content.
- `findings_get`, `findings_set` — CAG layer; the agent checks here before fetching externally.
- `rag_query_threads` — semantic search across the agent's own thread findings and patterns.
- `synthesize_pattern` — combines ≥3 substantive inputs into a pattern row with data and reasoning. Refuses to write a pattern that doesn't meet the threshold.
- `start_thread`, `update_thread`, `close_thread`, `link_thread_to_analysis` — thread state management. Write-path tools, carefully scoped.

**Workflows — automation pipelines (breadth)**
- **Daily research & detailed digest** — ingest data → refresh scores → researcher generates section snapshots, article summaries, top-of-digest synthesis → assemble digest → email + platform home.
- **Market pulse** — morning/midday/close → fetch pulse-set state → researcher generates snapshot → iMessage/WhatsApp + platform.
- **News ingest** — pull events → researcher classifies substantiveness (signal/noise/ambiguous) → for signal, classify significance + embed summary + write rows → for noise, write to `noise_audit` → for ambiguous, surface to user → enqueue affected covered companies for re-scoring.
- **Sector + industry research** — ongoing reads per critical industry and tracked sector. Aggregate scores, identify movers, surface notable activity.
- **Significance + substantiveness re-check** — re-evaluate older events against subsequent data; promote tier or reclassify if warranted.

**Workflows — deep research sessions**
- **Scheduled deep shift** — runs on a configurable schedule. Agent picks priority threads to advance, or opens new threads from converging signal.
- **User-directed session** — chat triggers a deep investigation on a topic.
- **Signal-triggered wakeup** — automation detects converging substantive signal (≥3 independent inputs pointing the same direction). Agent wakes briefly to assess; either opens a thread or returns to rest.

**Triggers**
- Scheduled (digest; pulse morning/midday/close; sector/industry research; deep shifts).
- Event-driven (news ingest → re-scoring; signal convergence → agent wakeup).
- Threshold-driven (score shift → prose regeneration; pattern convergence → "look at this" output).
- On-demand (chat).

**Session manager**
- Owns session lifecycle: wakeup → active → rest.
- Enforces wall-clock cap (1–3 hours) and token budget per session.
- Manages mode transitions (breadth ↔ deep).
- Logs to `agent_sessions` for cost visibility and audit.

**Investigation loop (deep mode)**
- `gather → reason about what was found → decide what's missing → gather more → synthesize → continue / rest / close`.
- Cache-first on every external read; findings-first before any external read.
- Terminates on: user stop, time/token budget exhausted, agent decides the open question is answered, no new substantive inputs available.
- On close: extract key findings to `thread_findings`, link artifacts, mark thread closed. Thread retained for 90d.

**Execution rules**
- Agent sees only the tools relevant to the current mode + task (allowlist per task).
- Outputs are structured rows + citations — not free-form chat.
- Failures logged to `jobs`; workflows retry or fail cleanly.
- Concurrency: ≤3 active deep threads; small parallelism across companies in breadth pipelines.
- Pacing: daily/weekly token budget; agent self-throttles to fit.

### 3. Data Layer

High-quality data, kept based on significance. Three-layer coverage maps to three different storage cadences. Cache and persistent storage are strictly separate.

#### Structured (relational tables)

- **`companies`** — the spine and the research surface. `[ticker, name, sector, sub_industry, exchange, coverage_tier]`. Every stock the AI has ever touched. `coverage_tier`: `watchlist` (deep coverage, mostly user-chosen) / `industry_critical` (notable within a critical industry) / `discovered` (lightweight tracking from research) / `archived`.
- **Watchlist metadata** — per-stock context: why added, why relevant, thresholds, when added.
- **`industries`** — controlled vocabulary of critical industries. `[name, parent_sector, watch_reason, added_at]`. User-editable.
- **Price history** — daily prices only. Intraday pulled on demand from yFinance.
- **Financial data & history** — `[price, market cap, P/E, EPS, CAPEX, EBITDA, ...]`. Time-series, one row per company per period. Watchlist + industry_critical only.
- **Catalyst / earnings calendar** — earnings dates, dividends, ex-dividends.
- **User preferences & alerts** — interested sectors, **critical industries list**, role each industry plays, default thresholds, notification channels, quiet hours, **session schedule, daily/weekly token budget, cache TTL preferences**, plus the **market pulse set**: `pulse_core` (fixed: SPY/VOO, DJW, QQQ, gold, 10Y, DXY, VIX) and `pulse_user` (user mega-caps).
- **Notification history** — what was sent, when, on which channel, with what template. Dedup across channels and sources.
- **News events** — metadata + AI summary per event: `[url, source, published_at, headline, tickers, sentiment_score, significance_tier, substantiveness, summary, embedding]`. `substantiveness` is `signal` / `noise` / `ambiguous`. URL is first-class display content. Original body **not** stored — summary is the canonical record.
- **`noise_audit`** — items filtered as non-substantive. `[event_id, reason, classified_at, promoted_back (bool)]`. Queryable; user can promote a row back to signal.
- **Sector aggregates** — sector ETF prices, breadth, rolled-up sentiment.
- **`industry_reads`** — current AI read on each critical industry. Sparse, change-triggered. Similar shape to prose: prose text, embedding, supporting source IDs, `generated_at`, `superseded_at`.
- **Fundamental scores** — numeric, dense, historical. Watchlist + industry_critical only.
- **Sentimental scores** — same scope and shape.
- **`patterns`** — synthesized observations. `[generated_at, pattern_description, supporting_inputs (jsonb, ≥3 required), reasoning, status (active/resolved/invalidated), embedding]`. This is the "look at this" output, stored. The `≥3 supporting_inputs` invariant is enforced at the tool level.
- **`agent_sessions`** — session log. `[started_at, ended_at, trigger (user/signal/scheduled), mode, thread_ids (jsonb), tokens_used, status]`. Cost visibility and audit trail.

#### Semi-structured (JSONB columns)

Queryable fields stay structured; variable payloads go in JSONB.

- **`threads`** — investigation state. `[id, topic, open_questions (jsonb), status (active/paused/closed), opened_at, last_active_at, closed_at, token_budget_used, parent_thread_id]`. Working memory; mutable.
- **`thread_findings`** — append-only findings within a thread. `[thread_id, generated_at, finding, supporting_inputs (jsonb), confidence_signals (jsonb), embedding]`. Read by the CAG layer.
- **`thread_artifacts`** — pointers from threads to news_events, scores, prose, patterns, external URLs. Provenance for everything a thread produced.
- **Reading list runs** — `[generated_at, top_snapshot, sections (jsonb: ordered list of {section_title, snapshot, article_refs[]}), source_event_ids[]]`. Article refs point into `news_events`.
- **Pulse runs** — `[generated_at, slot (morning/midday/close/on-demand), pulse_snapshot, instruments (jsonb), channel_sent]`.
- **Fundamental prose** — sparse rows, one per genuine shift in the read. Stored only when inputs move beyond threshold and the new prose differs meaningfully from the previous. Insights that connect dots — never a piece of decision.
- **Sentimental prose** — same shape and rule.
- **Job / run state** — `[job_type, status, started_at, completed_at, error_message, params (jsonb), result_summary (jsonb)]`.
- **Source provenance / citations** — links each analysis, finding, and pattern to the news_events and external sources that fed it.

#### Cache layer (separate from persistent storage)

- **`cache`** — short-term fetched content. `[url, fetched_at, ttl_seconds, content, content_hash]`. Cleared on TTL or manual bypass. Read on every web tool call. Never promoted to persistent storage; only extracted findings are.

#### Embeddings (pgvector columns)

Embeddings live as columns on the tables they describe.

- `news_events.summary` — find past events similar to this one. Powers research across the broader surface.
- `fundamental_prose`, `sentimental_prose` — find past analyses with similar themes; detect whether new prose differs from previous.
- `industry_reads` — find past industry reads with similar themes.
- `patterns.pattern_description` — detect pattern recurrence.
- `thread_findings.finding` — RAG over the agent's own research history.

Embedding model is fixed and stored alongside every vector.

### 4. Technical Layer

**External APIs**
- **yFinance** — prices, financials, pulse-set quotes. Chose for simplicity/access.
- **Finnhub** — news, sentiment, catalyst/earnings calendar, insider sentiment, transcripts. Chose for free-tier viability + built-in tagging + overlap with multiple data needs.
- **Anthropic API** — Claude models. Chose for analysis quality and native tool/MCP support.
- **Web search provider** — TBD (Tavily / Brave Search / SerpAPI). Choice driven by cost and search quality for deep research.
- **SEC EDGAR** — filings. Free, direct.
- **Notification providers** — SMTP (email), iMessage bridge (AppleScript), WhatsApp (pywhatkit). Wrapped behind a single `Notifier` interface.

**Internal APIs**
- **FastAPI** — data + workflow endpoints to the TypeScript UI. Async, typed, Python-native.
- **MCP server** — exposes tool registry to the AI. Two tool surfaces (breadth + deep), selected by session mode. Same MCP server, different allowlists.

**Schema & migrations**
- **SQLAlchemy 2.0 (async) + Alembic.** Chose for first-class pgvector + JSONB + FastAPI integration.
- **Pydantic v2** for API schemas, kept separate from DB models. Same library validates JSONB payloads on write.
- **asyncpg** as driver.

**Models (selected per task within the researcher agent)**
- **Sonnet / Opus** — deep investigation loops, pattern synthesis, prose, top-of-digest, industry reads, on-demand follow-ups. Chose for synthesis quality on high-stakes outputs.
- **Haiku** — per-article summaries, substantiveness classification, significance classification, pulse snapshots. Chose for cost at volume.
- **Embeddings** — one fixed model (`text-embedding-3-small` or `voyage-3`). Chose fixed-model to avoid silent retrieval drift.

**Infrastructure**
- **Always-on host** — small VPS or home server. Required for automation continuity through rest periods.
- **Scheduler** — cron or APScheduler. Lightweight over heavy orchestrator.
- **Postgres + pgvector** — single store for structured, JSONB, and vector data.
- **Cache** — Postgres-backed at v1 (one less moving part). Switch to Redis only if measured throughput demands it.
- **Session manager** — runtime component (Python service). Owns wakeup triggers, time/token budget enforcement, mode transitions. Reports to `agent_sessions`.
- **Secrets** — env file, not committed.

**Data scaling (v1 targets)**
- Watchlist: ~50–100 companies.
- Critical industries: ~8–15.
- `industry` + `discovered` surface: potentially hundreds of companies; lightweight tracking.
- Pulse set: ~7 fixed core + ~4–8 user mega-caps.
- News events ingested: ~50–500/day across all coverage.
- Signal-to-noise ratio at ingest: tune empirically; expect significant noise filtering initially.
- Active threads: ≤3 at any time.
- Deep sessions: ~1–2/day typical, more on hot weeks.
- Daily token budget: user-set; start conservative and adjust.
- Reading-list runs: 1/day. Pulse runs: 3/day scheduled + on-demand.
- Embeddings: well under 1 GB at v1 scale.
- Revisit infrastructure when any of these grow 10×.

**Complexity level**
- v1: single user, single agent (two modes), batch automation + bounded deep sessions, human-in-the-loop at session boundaries.
- Deferred until measured need: multi-agent (role-distinct), streaming, raw-text RAG over full transcripts, auto-pilot (no human check-ins), sub-second feeds, on-demand pulse via message reply, mobile-native push.
