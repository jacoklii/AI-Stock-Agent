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
 