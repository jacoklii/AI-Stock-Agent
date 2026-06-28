# Architecture

The single source of truth for *what the platform surfaces*, *how information is presented*, and
*how the system is built*. It merges the original product specification and the architecture design.

> **Hard rule, everywhere:** the agent **informs and explains patterns — it never recommends
> buy / sell / hold and never makes a valuation call.** Lead with the neutral fact + the numbers; the
> agent's interpretation is a *read*, offered behind a reveal/expand, never a verdict.

---

## 1. Vision

A meaningful, genuinely usable intelligence platform for an investor — not hype. It runs a live feed
of news and events plus a research agent that keeps the investor aware of why the market (or a slice
of it) is moving: global events and geopolitics, macroeconomics, industry trends, and the names they
hold.

Like a Palantir-style surveillance system, it watches what is happening in the world that might move
the market, keeping the investor **proactive rather than reactive**.

### The agent is a research partner, not an oracle
- **Amplify human intelligence — never replace it.** The AI makes the user more aware and accelerates
  their own intuition, knowledge, and game theory. The human stays the decision-maker.
- **Inform first, explain patterns second.** Lead every signal with the neutral **fact** (what
  happened + the numbers). The agent's interpretation — causal chains, reads, which holdings it
  threads to — sits behind a **reveal/expand**, opt-in and deferred.
- **Reads and observations only — never a buy / sell / hold or valuation call.**

### What is the AI's, and what is the human's
- **AI:** deep research, repetitive workflows, pattern recognition across macro moves, industries,
  trends, and stocks; summarizing tool findings.
- **Human:** complex reasoning and game theory, judgement, speculation, valuation, decisions —
  directed research, what to act on, and catching what the AI got wrong. Buy / sell / holds.

## 2. Mental model — two engines

Think of it as a researcher that works hard in bounded sessions, then rests. While it rests,
automation keeps running.

- **Scraper (breadth)** — the always-on sensor net. Continuous news ingest, noise filtering, and
  summarization using built-in query tools, *not* the AI. Runs on a steady cadence, semantically
  matches relevance, and stores summaries for later use to save tokens. It never stores whole
  articles.
- **Researcher (deep research)** — bounded agent sessions with full web autonomy. It reasons,
  cross-checks, scores significance, and writes findings **with citations**. Cheap models summarize
  the scraper's findings continuously; big models run only on a deep-research **trigger** or a user
  request. **Working memory** keeps state across sessions.
- **Triggers:** deep research fires on a significance threshold over scraper findings ("will this
  affect the market?") plus any user request.
- **Surface the distinction honestly** in the UI (e.g. "swept by the scraper, not the agent").

The automation never stops; the researcher only works when there is something worth working on.

## 3. The research domains (priority order)

Ordered top-down, by where market moves originate down to the names the user holds.

1. **Geopolitics & global events** — conflicts, statements, elections, supply-chain bottlenecks,
   trade disputes. *The origin of market moves.* (e.g. Iran / Strait of Hormuz → affected industries
   → economics → stocks.)
2. **Macroeconomics** — economies (mainly US), growth, central-bank policy, inflation, rates,
   employment, bonds, yield curves, currencies, commodities.
3. **Industry trends** — acquisitions, revenue, giants, new technology, ties back to geopolitics.
4. **General market movement** — the user's most-watched stocks plus the broad market and prices.

## 4. Coverage tiers

Every company has a `coverage_tier` that controls what the system fetches and scores for it.

| Tier                | News ingest | Financials | Scoring |
| ------------------- | ----------- | ---------- | ------- |
| `watchlist`         | Yes         | Yes        | Yes     |
| `industry_critical` | Yes         | Yes        | Yes     |
| `discovered`        | Yes         | No         | No      |
| `archived`          | No          | No         | No      |

`discovered` companies surface through research but haven't been promoted. `archived` companies are
excluded from all active coverage.

## 5. Delivery

- **Brief** — a short snapshot pushed to the user (email + in-app; iMessage needs a macOS host).
  Morning / midday / close, with a handful of mega-cap / watchlist prices at the bottom.
- **Updates** — generated from the agent's deep research (AI summary of scraper findings + a market
  update). First generated in the morning before open, then **triggered, not scheduled**. Past
  updates stay visible up to **7 days**, then drop off — kept as a brief memory, not a full paragraph.
- **Email** is for briefings; **text** is for the most important alerts (top-watchlist moves, a major
  acquisition, the biggest geopolitical events) and for user requests to the agent.

---

## 6. Requirements

**Functional**
- Ingest news + market data continuously.
- Run deep-research sessions: user-triggered, scheduled, or woken by signal convergence in breadth.
- Maintain memory across sessions so the agent's state can resume.
- Chat is the primary direction interface.
- Surface findings via brief update and detailed digest.
- Cite sources on every output. Article URLs are first-class.

**Non-functional**
- Single user; always-on for breadth automation, deep sessions bounded.
- Cost-bounded by a weekly token budget; the agent self-paces.
- Provider-swappable (one wrapper per external dependency).
- Traceable — every output ties back to its inputs.
- Knowledge-layer only; no buy / sell / hold or valuation calls.
- Failed jobs are visible and re-runnable.

## 7. Constraints

**Hard**
- AI never recommends buy / sell / hold or makes valuation calls.
- AI reads freely (DB tools + web + providers) but writes only through specific paths; no raw SQL on
  production data.
- Every analysis, pattern, and finding cites sources.
- Cache holds fetched content with TTL; persistent storage holds summaries and findings only — never
  whole transcripts or article bodies.
- Embedding model is fixed; changes are explicit backfills.
- `company_id` for joins, never ticker.
- All timestamps UTC; sectors and industries from controlled vocabularies.

**Soft**
- One Postgres + pgvector.
- Weekly token budget; the agent throttles to fit; deep sessions bounded by wall-clock + token cap.
- Cache-first on web reads; bypass when freshness matters.
- Findings-first before external fetches (check what the agent already knows).
- One agent until role divergence emerges.
- A new external dependency goes behind a wrapper before first use.

## 8. Change & separation

- External APIs live behind internal wrappers (one wrapper per dependency).
- Daily prices / quarterly financials / news / state — separate cadences, separate tables.
- **Cache vs. persistent storage are separate.** Cache holds full content with TTL; storage holds
  extracted summaries and findings only.
- **State (the agent's mutable working memory) vs. analysis (durable record) are separate.**
- **Brief update vs. detailed digest are separate delivery shapes** with separate templates and
  triggers.
- Tools are pure functions; the agent composes them but doesn't own them.
- The UI talks only to FastAPI, never directly to Postgres.

---

## 9. Interface — one terminal, three panels

A single unified main view that never switches. The middle panel is always the world surveillance
view; the only separate full view is **Settings**. A very thin header carries **time and date only —
no logos**.

- **Menu bar** (left icon rail) opens/closes the left panel and holds Settings; it does not switch the
  main view. Order: **Research · Watchlist & industries · Chat · News & events · Settings**.
- **Left panel** shows the active menu surface; picking a stock or industry opens its full detail here
  (agent summary, then Qualitative + Quantitative — see §11).
- **Middle panel** is the surveillance view — significance and interconnected context, not a flat
  dashboard. Mostly text, lists, images/clips, symbols & prices; minimal UI. Anything can be clicked
  to expand to full information, open research, or open a source.
- **Right panel** is the **Agent**: strictly agent state, the weekly token budget, and research &
  findings (tokens / turns / tools / sources). Research sessions open here. Collapsible.

## 10. Live surveillance — real-time at the top

- The middle panel is ordered top-down by what the scraper grabs and the agent researches first:
  **Overview → Geopolitics → Macroeconomics → Industry trends → General market.** A **Signals** band
  ranks what matters now.
- The **Overview** synthesizes every domain swept: the origin event threaded down through macro,
  industry, and market, with a one-line read per domain.
- Significance must be *felt*: signals are shown as chains (origin → mechanism → effect) threaded down
  to the names the user holds.
- Every statement leads with the **fact + the numbers**; the agent's read, the chain, and the reports
  behind it (sourced, linking out) sit on the expand.

## 11. Stock / industry detail (left-panel drill-down)

Three parts, in order:
1. **Agent summary (leads)** — the agent's synthesis of the name, the reports behind it (plain list,
   links out), and a short "Remembers" line of personalized context.
2. **Qualitative** — the business (what it does), industry & position (sector, sub-industry, peers,
   supply chain), and sentiment (a worded read + tone trend — never a raw number).
3. **Quantitative** — financials (revenue, margins, FCF, cash) and valuation & ratios (P/E,
   EV/EBITDA, P/S, ROIC).

Industry detail mirrors this: qualitative understanding + quantitative numbers + supply chain in
tiers + embedded news & events + constituents.

---

## 12. Presentation rules — information first, UI last

These govern *how it looks* and override any instinct to decorate.

- **The information takes over, not the UI.** Minimalist for clarity, not to look pretty. If an
  element doesn't inform, remove it.
- **Just the text, not labels.** No decorative section labels, no eyebrow numbering (01/02/03), no
  "jump" chrome. Navigational section *titles* are fine; labels that merely name a block are not.
- **No fancy containers.** No glow, scanline, drop-shadow theater, or rounded box with a left-border
  accent color (an AI-slop trope); no boxed pills where plain text reads fine.
- **Significance is shown as TIME, never a number.** Rank by horizon — **Now** (act on the tape today)
  vs. **Building** (expected to matter ahead). No 0–1 meters or scores anywhere user-facing. (An
  internal numeric score may *order* items within a horizon, but it is never displayed.)
- **Squared-off, dense, hairline-bordered terminal aesthetic.** Tight spacing, small radii, hairline
  rules. Motion is purposeful (pulses, status rises), never decorative.
- **Lead with the fact + the numbers; defer the read.** Prose reads in a serif voice; data and labels
  in mono; UI text in sans.

For the engineering conventions that enforce these rules (data layer, tools, providers, migrations,
palette), see [CLAUDE.md](../CLAUDE.md).
