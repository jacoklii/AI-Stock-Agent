# AI Stock Agent — Product & Behavior Specification

Drop this into your repo (as `PROJECT.md`, or merge into `CLAUDE.md`) so every future change — by you
or by Claude — follows the same product principles. This is the single source of truth for *what the
platform surfaces* and *how information is presented*. It combines the original product principles with
every clarification made while building the design system.

> **Hard rule, everywhere:** the agent **informs and explains patterns — it never recommends
> buy / sell / hold and never makes a valuation call.** Lead with the neutral fact + the numbers;
> the agent's interpretation is a *read*, offered behind a reveal/expand, never a verdict.

---

## 1. The agent is a research partner, not an oracle
- **Amplify human intelligence — never replace it.** The AI makes the user more aware and helps them
  use their own intuition, knowledge, and game theory. It finds patterns faster and *accelerates the
  user's* knowledge rather than taking it from them. The human stays the decision-maker.
- **Inform first, explain patterns second.** The AI synthesizes information and gives it to the user
  *first*; only after informing does it explain the patterns it sees. In the UI: lead every
  signal/section with the neutral **fact** (what happened + the numbers). The agent's interpretation —
  causal chains, reads, which holdings it threads to — sits behind a **reveal/expand**, opt-in, deferred.
- **Reads and observations only — never a buy / sell / hold or valuation call.**

## 2. Two engines: cheap Scraper vs. expensive Researcher
- A **continuous web scraper** (the always-on sensor net) grabs and stores information using built-in
  query tools — *not* the AI. Runs ~every 10 minutes, semantically matches relevance, stores for later
  use to save tokens. It does **not** store whole articles.
- The **AI agent (researcher)** uses full web autonomy only when **researching** a session. It reasons,
  cross-checks, scores significance, and writes findings **with citations**. Cheap models summarize the
  scraper's findings continuously; big models run only on a deep-research trigger or a user request.
- **Surface the distinction honestly** in the UI (e.g. "swept by the scraper, not the agent").
- **Triggers:** deep research fires on a significance threshold over scraper findings ("will this affect
  the market?") plus any user request. **Working memory** keeps state across research.

## 3. Automation runs while the user is away
- During and after research sessions, automation sends updates, emails, and briefings — usually when the
  user is away. Market-open briefing by **email**; **text** for big events / big market moves, any time.
- The user can **text / connect to the agent at any time** to do anything: add a name to the watchlist,
  research something, get an update.
- **The "Updates" object:** generated from the agent's deep research (AI summary of scraper findings +
  a market update). First generated in the morning before open, then **triggered, not scheduled**. Past
  updates stay visible up to **7 days**, then disappear — kept as a brief memory, not a full paragraph.

## 4. The research database domains (priority order)
1. **Geopolitics & global events** — conflicts, statements, elections, supply-chain bottlenecks, trade
   disputes. *The origin of market moves.* Watch technology & manufacturing state as the origin point,
   then thread down to held names. (e.g. Iran/Strait of Hormuz → affected industries → economics → stocks.)
2. **Macroeconomics** — economies (mainly US), growth, central-bank policy, inflation, rates, employment,
   bonds, yield curves, currencies, commodities.
3. **Industry trends** — acquisitions, revenue, giants, new technology, ties back to geopolitics.
4. **General market movement** — the user's most-watched stocks plus the broad market and prices.

## 5. One terminal, three panels — the saved layout
- **A single unified main view that never switches.** The middle panel is always the world surveillance
  view. The only separate full view is **Settings**.
- A **very thin header** carries **time and date only — no logos**, no brand mark.
- The **menu bar** (left icon rail) opens/closes the **left panel** and holds Settings; it does **not**
  switch the main view. Items, in order: **Research · Watchlist & industries · Chat · News & events · Settings**.
- **Left panel** shows the active menu surface — and a **picked stock or industry opens its full detail
  here** (agent summary, then Qualitative + Quantitative; see §7).
- **Middle panel** is the surveillance view — meaning, significance and rich interconnected context, not
  a flat dashboard of numbers. Mostly text, lists, images/live clips, symbols & prices; minimal UI.
  **Anything can be clicked to expand** to the full information, open research, or open a source.
- **Right panel** is the **Agent**: strictly agent state, the weekly token budget, and research &
  findings (tokens/turns/tools/sources). **Research sessions open here.** Collapsible.

## 6. Live surveillance is the key — real-time at the top
- The middle panel is ordered top-down by what the scraper grabs and the agent researches **first**:
  **Overview → Geopolitics (news & events embedded) → Macroeconomics → Industry trends (news & events
  embedded) → General market.** A **Signals** band ranks what actually matters now.
- The **Overview** synthesizes *every* domain swept: the origin event threaded down through macro,
  industry and market, with a one-line read per domain.
- Significance and interconnection must be *felt*: signals/events are shown as chains
  (origin → mechanism → effect) threaded down to the names the user holds.
- Every statement leads with the **fact + the numbers**; the agent's read, the chain, and the **reports
  behind it** (sourced, linking out) sit on the **expand**.

## 7. Stock / industry detail (the left-panel drill-down)
Three parts, in order:
1. **Agent summary (baked in, leads)** — the agent's synthesis of the name, the **reports behind it**
   (plain list, links out), and a short "Remembers" line of personalized context.
2. **Qualitative** — *the business* (what it actually does), *industry & position* (sector, sub-industry,
   peers, supply chain), and *sentiment* (a worded read + tone trend — never a raw number).
3. **Quantitative** — *financials* (revenue, margins, FCF, cash) and *valuation & ratios* (P/E,
   EV/EBITDA, P/S, ROIC).

Industry detail mirrors this structure (qualitative understanding + quantitative numbers + supply chain
in tiers + embedded news & events + constituents).

---

## 8. Presentation rules — information first, UI last
These are the clarifications that govern *how it looks*. They override any instinct to decorate.

- **The information takes over, not the UI.** Minimalist for clarity, **not** to look pretty. If an
  element doesn't inform, remove it.
- **Just the text, not labels.** No decorative section labels ("Agent read", "Your book", "Threads to",
  "What's driving it", "Names inside"), no eyebrow numbering (01/02/03), no "jump" affordance chrome.
  Section *titles* that aid navigation are fine; labels that merely name a block are not.
- **No fancy containers.** No glow, no scanline sweep, no drop-shadow theater, no rounded-corner box with
  a left-border accent color (an AI-slop trope), no boxed pills/badges where plain text reads fine.
- **Significance is shown as TIME, never a number.** Rank by horizon: **Now** (act on the tape today) vs.
  **Building** (expected to matter ahead). No 0–1 meters, no scores, anywhere user-facing. (An internal
  numeric score may *order* items within a horizon, but it is never displayed.)
- **Squared-off, dense, hairline-bordered terminal aesthetic.** Tight spacing, small radii, hairline
  rules, a soft warm lift for raised surfaces — never a glow. Motion is purposeful (pulses, status rises,
  blinks), never decorative bounce.
- **Lead with the fact + the numbers; defer the read.** Prose reads in a serif voice; data and labels in
  mono; UI text in sans.

## 9. Component notes (from this design system)
- **Panel** — minimal terminal surface: caps header + live signal dot + hairline body. No `glow`,
  `scan`, or `flush` variants.
- **StatusPill** — two-engine lifecycle vocabulary: agent `researching` / `open` / `briefed` vs. scraper
  `swept` / `queued`, so the UI can honestly mark "swept by the scraper" vs. "researched by the agent".
- **SignificanceMeter** — exists as a primitive, but the **platform does not display numeric
  significance**; use the Now/Building horizon instead.
- **AgentStatus** is the single live-activity narrator. (A duplicate `WorkingStrip` was removed.)
- **BudgetGauge** — the weekly token-budget gauge in the right Agent panel; the agent paces itself
  against the cap and stops deep work as it approaches it.
