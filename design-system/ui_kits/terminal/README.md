# AI Stock Agent — product & interface specification

This is the **canonical specification** for the AI Stock Agent research desk, synthesized from the
product owner's notes. It defines *what information the platform surfaces* and *how that information
is presented to the user*. The interactive build in this folder (`index.html`) is the reference
implementation of this spec — treat the layout described under **Interface** as the saved, canonical
way to present information. Persistent product principles live alongside this in the root
`CLAUDE.md`; read both before changing the desk.

> Hard rule, everywhere: the agent **informs and explains patterns — it never recommends
> buy / sell / hold and never makes a valuation call.** Lead with the neutral fact; the agent's
> interpretation is offered as a *read*, deferred behind a reveal/expand.

---

## 1. Goal

A meaningful, genuinely useful platform for investors — not hype. A live feed of news & events plus
a research agent that keeps the investor updated on the stock market and runs **Palantir-style
surveillance on what's happening in the world** that might move it. The point is to make the
investor **proactive rather than reactive**: keep them aware of global events & geopolitics,
macroeconomics, and industry trends so they understand *why* the market (or a part of it) is moving.

The agent **amplifies** the human's own intuition and game theory — it finds patterns faster and
informs the user first, then explains the patterns. The human stays the decision-maker.

---

## 2. Two engines — cheap Scraper vs. expensive Researcher

- **Web scraper (always-on sensor net).** Continuously finds *thousands* of pieces of information —
  articles, news, events, reports, announcements — across the domains below. It **semantically**
  matches what's relevant; it does **not** store whole articles. Schedule-based, runs roughly every
  **10 minutes**. This is cheap and saves tokens by storing for later use.
- **AI agent (researcher).** Uses full web autonomy only when **researching** a triggered session.
  It reasons, cross-checks, scores significance, and writes findings **with citations**. It also
  **summarizes** the scraper's findings into the platform (a summary, with the source articles
  beneath it). Cheap models summarize continuously; big models run only on a deep-research trigger or
  a user request.
- Surface the distinction **honestly** in the UI (e.g. "swept by the scraper, not the agent").

**Signals & triggers.** Deep research fires on a significance threshold over scraper findings — the
agent asks "will this affect the market?" — plus any user request. **Working memory** keeps state
across research so information isn't lost.

---

## 3. Information the investor needs (the research database domains)

What the scraper looks for and the agent researches, in priority order:

1. **Geopolitics & global events** — geopolitical movements, conflicts, statements & announcements,
   elections, supply-chain bottlenecks, wars, trade disputes — anything that affects global trade.
   *This is the origin of market moves.* (e.g. "Iran takes control of the Strait of Hormuz, the US
   gets involved…" → the agent researches deeper, finds the affected industries, economics and
   stocks, then informs the investor.) Watch **technology & manufacturing state** as the origin
   point, then thread down to held names.
2. **Macroeconomics** — specific economies (mainly the US) and economic growth, central-bank policy,
   inflation metrics, interest rates, employment, manufacturing/services indexes, bonds, yield
   curves, currencies, commodities.
3. **Industry trends** — acquisitions, revenue, industry giants, new technology, and specific ties
   back to geopolitics.
4. **General market movement** — the user's most-watched stocks plus the broad market and the price
   movements.

---

## 4. Core components

- **AI agent researcher** — deep-researches topics (user interests, requests, important events &
  trends); summarizes the scraper's findings to the platform as a summary with articles beneath;
  updates the user by email or text.
- **Web scraper** — see §2.
- **Real-time / near-real-time data** — keeps the surface current: ~1-minute change on stock prices,
  market prices, yields, bonds, indexes — anything continuously changing. Also fast surfacing of
  important new statements/announcements.
- **Surveillance on the world** — news & events from the web, posted to the platform to keep the
  investor aware.
- **Updates** — delivered on the **interface** for detail; via **email** (briefings) and **text**
  (most important) for what matters. Email = shorter, AI-generated briefing that lists articles to
  read (or a full research briefing). The platform carries it all, in more detail.
- **Automation** — runs **24/7**. The only place AI is in the loop is to summarize text and scraper
  results, until a deep-research trigger or a user request escalates to a big model.

**Notifications.** Market-open briefing by **email** (overnight alerts & findings go here). **Text**
for big events (rising tensions, announcements, industry trends) or big market moves, any time of
day, plus user requests to the agent. **Updates** on market / research / news / events arrive by
email and on the platform any time.

**The "Updates" object.** Generated from the agent's deep research; includes the AI summary of
scraper findings **plus** a stock-market update. First generation is in the **morning before market
open**, then it's **triggered, not scheduled**. Past updates stay visible on the platform for up to
**7 days**, then disappear — kept as a brief memory, not a full paragraph.

**News & events** are *across* the platform: a News tab, under industries, under Updates,
geopolitics, events — everywhere news & events give context. Each section lists the most significant
pieces. Items are articles, reports, announcements, and **live channels / clips** (e.g. a reporter
covering AI and a strait blockage, or a market update).

---

## 5. Interface — the canonical layout (this is how information is presented)

Three panels around a thin header. **The middle is the one and only main view — it never switches.**

### Thin header (top)
A **very thin** bar for **time and date only**. **No logos**, no brand mark, no other chrome.

### Menu bar (left icon rail)
Opens/closes the **left panel**; it does **not** switch the main view. In order:
1. **Research** — research sessions.
2. **Watchlist & industries** — the top stocks and prices; underneath, the user's industries
   showing *what each industry is and its current state*.
3. **Chat** — talk to the agent at any time (add a name, research something, get an update).
4. **News & events** — top news and events broadly.
5. **Settings** — the **only** item that opens a separate full view (not a side panel).

### Left panel (toggled by the menu bar)
Shows the active menu surface (watchlist & industries / research / chat / news). **A picked stock or
industry opens its full detail here** — sentiment read, operational financials, industry position &
peers, supply chain, recent findings & sources, memory — with a close that returns to the list.

### Middle panel — the world surveillance view (always present)
The state of the world / overview of research, scraper findings, main news & events, industry trends,
geopolitics — the "information the investor needs." Mostly **text, bulleted lists, images (news
reports, live streaming clips), symbols, prices and price changes**. Minimal UI — it organizes, it
doesn't hype with meaningless borders. **Anything can be clicked to expand** to the full information,
to open research, or to open a source / the web.

Real-time surveillance is the key, so it's ordered top-down by what the scraper grabs and the agent
researches **first**:

1. **Overview** — the agent's synthesis across *every* domain it swept: the origin event threaded
   down through macro, industry and market, plus a one-line read per domain (jump links).
2. **Geopolitics & global events** *(news & events embedded inside each event)*.
3. **Macroeconomics**.
4. **Industry trends** *(news & events embedded inside each)*.
5. **General market** — indices, cross-asset, and the user's names.

A **Signals** band ranks the few movements that actually mean something, each as a chain
(origin → mechanism → effect) threaded down to the names the user holds. Every statement leads with
the **fact + the numbers**; the agent's read, the propagation chain, the **reports behind it**
(sourced, ranked, linking out), and the threaded names sit on the **expand**.

### Right panel — the Agent (collapsible)
**Strictly** for agent state: what the agent is doing right now, the **weekly token budget**, and
**research & findings**. Shows live AI metrics — tokens, turns, tools, sources, elapsed. **Research
sessions open here** (the full step trace, telemetry, findings, sources). Can be opened or collapsed.

### Settings
The only separate view.

---

## 6. Files

Active implementation (loaded by `index.html`, mounted by `Desk.jsx`):
- `index.html` — loads React, Lucide, the DS bundle (`_ds_bundle.js`), Babel, then the parts.
- `data.js` — invented demo data (`window.DATA`): `WORLD` (overview, tape, signals, geopolitics,
  macro, industry read, market), `NEWS`, `FOLLOWING`, `CANDIDATES`, `INDUSTRIES`, `SESSIONS`,
  `ACTIVE`, `BUDGET`, `ASK_PHRASES`. Illustrative — wire to the real scraper store to go live.
- `kit.jsx` — helpers (`useStyle`, Lucide `Icon`, formatters, `Telemetry` grid).
- `Desk.jsx` — the shell: thin header, left/middle/right panels, nav rail, state & routing.
- `WorldBoard.jsx` — the middle world-surveillance view (overview, signals, the four domains;
  expandable items with the reports behind them; live-clip / image slots).
- `LeftPanel.jsx` — the toggled left surfaces (watchlist & industries, research list, news, chat).
- `IndustryDetail.jsx` — industry deep-research detail (opens in the left panel).
- `DetailPanel.jsx` — research-session detail (opens in the right Agent panel).
- `LiveResearch.jsx` — the live "working now" agent state (right panel default).
- `Settings.jsx` — the separate settings view.
- `Tweaks.jsx`, `tweaks-panel.jsx` — the in-design Tweaks controls.
- **`StockDetail`** comes from the design-system bundle (`window.AIStockAgentDesignSystem_ea6e23`).

Legacy / not currently mounted (kept for reference): `ContextRail.jsx`, `TodayFeed.jsx`,
`ResearchList.jsx`.

## Components used
`Panel`, `Button`, `StatusPill`, `OriginBadge`, `SignificanceMeter`, `Sparkline`, `PriceQuote`,
`BudgetGauge`, `StockDetail`, **`AgentStatus`**, **`AgentTrace`**, `ImpactMap` — all from
`window.AIStockAgentDesignSystem_ea6e23`.
