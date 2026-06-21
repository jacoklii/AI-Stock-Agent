# DESIGN

## GOAL
Create an agentic AI system that's my research partner and analyst. It does the deep research I can't do alone — across industries, supply chains, futures (AI, quantum, aerospace, finance), macro and geopolitics — surfaces what genuinely matters, filters noise, and points me at patterns with data. It never decides for me.

## Mental Model
Think of it like a researcher. It researches intensively in bounded sessions, then rests after finding what it needs. While it rests from deep research, automation keeps running in the background — ingesting news, filtering noise, updating the user, etc. The AI is in the automation to summarize findings from tools, and if something material surfaces during that automation, the researcher is back up to run deep research. Otherwise the researcher waits for a schedule or a direct request. The automation never stops; the researcher only works when there's something worth working on.

### AI-Specific
Repetitive workflows + tasks, signal-filtering and pattern recognition to research macro movement, industries and sectors, and stocks within those industries. 

### Human-Specific
Complex reasoning, judgement, speculation, valuation, and decisions stay with me. I direct research, decide what to act on, and catch what the AI got wrong. Buy/Sell/Hold, final valuation calls are with me.

## Definitions
**Breadth** — continuous automation: news ingest, noise filtering, summarization. Runs always, including while the agent is at deep research rest.
**Deep research** — bounded agent sessions: on-demand, on-schedule, or triggered when breadth surfaces converging signal. Between sessions the agent rests; breadth automation continues and can call it back if something material appears.
**Brief** — a short snapshot pushed to iMessage/WhatsApp. Runs morning/midday/close. Includes 5-7 mega-cap/intrested stocks from the user and there prices at the bottom
**Significance** — a fast ingest filter. Answers: does this event clear the bar? Above threshold it's kept; below threshold it's dropped and never stored.
Coverage tier — controls what the system fetches and scores per company. See Coverage Tiers table.

## The 3 Aspects
- **Researches** — industries, sectors, supply chains, macro, geopolitics, specific companies. Watchlist is downstream of research, not its boundary.
- **Analyzes** — synthesizes patterns from data, filters noise. Output is observations + supporting data + reasoning. Never conclusions.
- **Updates** — surfaces findings the agent made, organized by industry / sector / macro. Article URLs are primary; AI synthesis is orientation alongside.

## Coverage Tiers
 
Every company has a `coverage_tier` that controls what the system fetches and scores for it.
 
| Tier               | News ingest | Financials | Scoring |
|--------------------|-------------|------------|---------|
| `watchlist`        | Yes         | Yes        | Yes     |
| `industry_critical`| Yes         | Yes        | Yes     |
| `discovered`       | Yes         | No         | No      |
| `archived`         | No          | No         | No      |
 
`discovered` companies surface through research but haven't been promoted. `archived` companies are excluded from all active coverage.

---
 
# ARCHITECTURE 
 
## Requirements
 
**Functional**
- Ingest news + market data continuously; filter significance signal from noise.
- Three-layer coverage: **global movement**, **critical industries + sectors**, **watchlist**.
- Run deep research sessions: user-triggered, scheduled, or wakeup from signal convergence in breadth.
- Maintain memory across sessions so the agents state can resume.
- Chat is the primary direction interface.
- Surface findings via brief update and detailed digest.
- Cite sources on every output. Article URLs are first-class.

**Non-functional**
- Single user, always-on for breadth automation; deep sessions bounded.
- Cost-bounded by a weekly token budget; agent self-paces.
- Provider-swappable (one wrapper per external dependency).
- Traceable (every output ties back to its inputs).
- Knowledge-layer only; no buy/sell/hold or valuation calls.
- Failed jobs visible and re-runnable.

## Constraints
 
**Hard**
- AI never recommends buy/sell/hold or makes valuation calls.
- AI reads freely (DB tools + web). AI writes only through specific paths; no raw SQL on production data.
- Every analysis, pattern, and finding cites sources.
- Cache holds fetched content with TTL; persistent storage holds summaries and findings only — never whole transcripts or article bodies.
- Embedding model is fixed; changes are explicit backfills.
- `company_id` for joins, never ticker.
- All timestamps UTC; sectors and industries from controlled vocabularies.
- Noise findings isn't stored.

**Soft**
- One Postgres + pgvector.
- Weekly token budget; agent throttles to fit.
- Deep sessions bounded by wall-clock + token cap.
- Cache-first on web reads; bypass when freshness matters.
- Findings-first before external fetches (check what the agent already knows).
- One agent until role divergence emerges.
- New external dependency behind a wrapper before first use.

## Change & Separation
 
- External APIs behind internal wrappers.
- Daily prices / quarterly financials / news / state — separate cadences, separate tables.
- **Significance** keeps signal, exempts noise. Ranks signal ("how big a deal").
- **Cache vs. persistent storage are separate.** Cache holds full content with TTL; storage holds extracted summaries and findings only.
- **State (the agents mutable working memory) vs. analysis (durable record) are separate.**
- **Brief update vs. detailed digest are separate delivery shapes** with separate templates and triggers.
- Tools are pure functions; the agent composes them but doesn't own them.
- UI talks only to FastAPI; never directly to Postgres.

## Layers
 
### 1. Interface
 
**Views**
- **Home** — agent state at a glance: what it's working on, today's findings, current research, top-of-digest snapshot.
- **Chat** — primary direction surface. Persistent conversation. Open/redirect/close research, ask for briefings, adjust budget.
- **Research** — active and recent research with topic, sources, status.
- **Industries** — curated critical-industries set with current read on each and research touching it.
- **Sector / company detail** — drill-downs with article lists, analysis (scores + summary), related research.
- **Brief** — brief-set state, latest scheduled brief, on-demand trigger. (Brief = iMessage/WhatsApp snapshot.)
- **Inbox** — chronological notifications.
**Interactions** — chat, watchlist + industries editing, brief stocks/mega-cap editing, research open/redirect/close, raise/lower weekly budget, open any article URL.
 

 
### 2. Application
 
One agent (`researcher`). Same agent across all tasks; the prompt, model, and tool allowlist vary per call. The agent doesn't have "modes" — workflows give it what it needs for the task at hand.
 
**Workflows**

- **News ingest** — pull events → `significance` classifier runs → above threshold: embed summary, write row to `news_events`, enqueue affected companies for re-scoring → below threshold: dropped, nothing stored.
- **Daily digest** — refresh scores → researcher generates section snapshots + article summaries + top snapshot → assemble → email + platform home.
- **Brief** — morning/midday/close → fetch brief set → researcher generates short snapshot → iMessage/WhatsApp + platform.
- **Deep research** — triggered by chat, schedule, or event-driven from breadth. Multi-step loop: gather → reason → decide what's missing → gather more → synthesize. State-first then cache-first then external. Terminates on user stop, budget exhausted, agent decides the question is answered, or no new input.

**Triggers** — scheduled (digest, brief, deep shifts), event-driven (news ingest, signal convergence), on-demand (chat).
 
**Execution rules**

- Tools allowlisted per task.
- Outputs are structured rows + citations — never free-form chat.
- Failures logged to `tasks`; workflows retry or fail cleanly.
- ≤3 active research rows at a time. Agent self-paces against the weekly budget. Blocks + surfaces in chat if opening a 4th active research.

### 3. Data
 
**Structured (relational tables)**

- **`companies`** — `[ticker, name, sector, sub_industry, exchange, coverage_tier]`. Spine. Tier controls what the system fetches and scores; see Coverage Tiers above.
- **`industries`** — controlled vocabulary of critical industries. User-editable.
- **`news_events`** — `[url, source, published_at, headline, tickers, significance, summary, embedding]`. URL is first-class display content. Article body **not** stored.
- **`prices`** — daily.
- **`financials`** — quarterly. `watchlist` + `industry_critical` only.
- **`catalyst_calendar`** — earnings, dividends.
- **`user_preferences`** — sectors, critical industries list, brief instruments (broad-market + user mega-caps), watchlist alert thresholds, notification channels, weekly token budget.
- **`notifications`** — `[sent_at, channel, template, content_hash]`. Dedup on `(channel, content_hash)` before sending.
- **`fundamental`**, **`sentimental`** — `[company_id, generated_at, scores (jsonb), prose (nullable, written only on meaningful shift), embedding]`. Dense, historical. `watchlist` only.

**Semi-structured (JSONB columns)**

- **`analysis`** — `[id, type, generated_at, content (jsonb), supporting_inputs (jsonb), embedding]`. One table because the access pattern is "what's the current/historical read on X?" — `type` is the filter. Covers stocks, industries, sectors, macro, supply-chain. `Type`: `fundamental / sentimental / event-driven / summary` 
- **`state`** — `[id, topic, current_tasks, tasks (previous/finished tasks), findings, open_questions, sources (jsonb: source IDs + URLs), status, opened_at, last_active_at, closed_at, parent_state_id]`. Working memory. Key findings extracted to `analysis` literally for analysis on findings when research finishes.
- **`tasks`** — `[state_id (nullable), type, status, started_at, completed_at, params (jsonb), result_summary (jsonb), tokens_used]`. Deep research sessions are jobs; cost and audit trail live here.

**Session Lifecycle**

**`On open`**
- If resuming an existing state, the agent receives: topic, current task, previous/finished tasks, findings to date, open questions, sources already consulted, and relevant analysis rows. This is the full reconstructed context window — nothing else is pulled in.
**`During`**
- State is flushed to the DB when the agent finishes its current task. On flush: new findings are appended to findings, new questions are appended to open questions. Sources are written as they're used. Nothing is flushed mid-task.
**`On close`**
- All findings in state are promoted to analysis on close. Trigger depends on how the session was initiated:

Autonomous workflow — analysis runs automatically after close, no prompt.
User-initiated — agent asks whether the user wants analysis, research only, or both. If analysis is requested, same process as autonomous. If not, state closes and nothing is promoted.

**Cache (separate from persistent)**

- **`cache`** — `[url, fetched_at, ttl_seconds, content, content_hash]`. Cleared on TTL or manual bypass. Never promoted to persistent; only extracted findings are.

**Embeddings (pgvector columns)**
- `news_events.summary`.
- `analysis.content` — across all types, enables "find similar prior reads, patterns, or industry takes".
- `state` — rolling summary embedding for semantic search across past and current research state.
Embedding model name stored alongside every vector.
 
### 4. Technical
 
**External APIs (each behind a `providers/` wrapper)**

- **yFinance** — prices, financials.
- **Finnhub** — news, sentiment, catalyst calendar.
- **Anthropic API** — Claude models.
- **Web search/fetch** — Anthropic server-side tools (`web_search`/`web_fetch`), billed to the same API key; no separate provider.
- **SEC EDGAR** — filings, direct.
- **Notification providers** — SMTP, iMessage bridge, WhatsApp.

**Internal**

- **FastAPI** — UI endpoints.
- **MCP server** — exposes the tool registry to the agent.

**Schema**

- **SQLAlchemy 2.0 (async) + Alembic.** First-class pgvector + JSONB + FastAPI integration.
- **Pydantic v2** for API schemas and JSONB payload validation.
- **asyncpg** as driver.

**Models (per task within the researcher agent)**

- **Sonnet / Opus** — deep investigation loops, analysis, pattern synthesis, on-demand follow-ups.
- **Haiku** — per-article significance classification, summaries, brief snapshots.
- **Embeddings** — one fixed model (`voyage-3`).

**Infrastructure**

- **Always-on host** — small VPS, home server, or cloud (GCP). Required so automation survives laptop sleep.
- **Scheduler** — cron or APScheduler. Deep research sessions are scheduled or triggered jobs.
- **Postgres + pgvector** — single store.
- **Secrets** — env file, not committed.

**Considered, add only when measurably needed**

- Multi-agent (role-distinct agents).
- Streaming ingestion / sub-second feeds.
- Raw-text RAG over full transcripts.
- Auto-pilot mode (no human at session boundaries).
- Mobile-native push.
- Separate breadth/deep MCP tool registries — one registry until expensive tools are misused.
- Separate `patterns`, `industry_reads`, `agent_sessions` tables — folded into `analysis`, `news_events.significance`, and `tasks` until a query genuinely needs them split.
 