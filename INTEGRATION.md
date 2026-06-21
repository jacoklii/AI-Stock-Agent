# Integration & PR plan — into `jacoklii/AI-Stock-Agent`

Target: `src/frontend/` — **React + TypeScript + React Router + Tailwind CSS v4** (`@import "tailwindcss"`).
This doc maps the design system + behavior spec onto your *actual* files and lays out the PR. Read
`PROJECT.md` first — it's the behavior contract; everything below serves it.

> I can't push from here (read-only GitHub access). Apply this on a branch locally — easiest with
> **Claude Code** in the repo with `PROJECT.md` + this file in context. Branch + commit plan at the bottom.

---

## The gap (current repo → target)
Your frontend is on the **older multi-view architecture**. The saved design diverges in five structural ways:

| # | Current (`main`) | Target (design system / `PROJECT.md`) |
|---|---|---|
| 1 | Routed multi-view: `Home`, `Brief`, `Inbox`, `Industries`, `Research`, `Chat`, `Settings` each a full page (`App.tsx` `<Routes>`) | **One unified main view that never switches** — the middle world-surveillance view. Only **Settings** is a separate full view. |
| 2 | `NavShell` left sidebar with **brand "AI Stock Agent" + "research partner"** label, text nav | **Very thin header = time & date only, no logo.** A left **icon rail** opens/closes a left panel; it does not switch the main view. |
| 3 | Nav: Home · Chat · Research · Industries · Brief · Inbox · Settings | Rail order: **Research · Watchlist & industries · Chat · News & events · Settings** |
| 4 | `SignificanceBadge` (numeric/score) | **No numeric significance anywhere.** Rank by time horizon: **Now** vs **Building**. |
| 5 | `WorkingStrip` + separate agent bits | **AgentStatus** is the single live narrator; right **Agent panel** (collapsible) holds agent state + weekly budget; **research opens here**. `WorkingStrip` removed. |

Plus: stock/company detail must become **Agent summary → Qualitative (business, industry, sentiment) →
Quantitative (financials, ratios)**; and the three-panel layout = **left panel (menu surface; a picked
stock/industry opens its full detail here) · middle (surveillance) · right (Agent)**.

---

## Design tokens on Tailwind v4
Your app uses Tailwind's default palette via utilities. Don't hand-port our `tokens/*.css` variable names
1:1 — instead bring the **values** into Tailwind's theme so utilities resolve to them:

1. In `src/frontend/src/styles.css`, after `@import "tailwindcss";`, add an `@theme { … }` block and map our
   palette, type scale, spacing, and radii to Tailwind theme keys (`--color-*`, `--font-*`, `--radius-*`,
   `--spacing`). Source values: `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css` in the
   downloaded package.
2. Keep the terminal aesthetic from `PROJECT.md §8`: squared corners (small radii), **hairline borders**,
   soft warm lift (no glow/shadow theater), mono for data/labels, serif for the agent's prose, sans for UI.
3. The DS components inject their own `<style>` reading CSS vars — for a TS/Tailwind app, prefer
   **re-styling your existing components with the tokens** over importing the `.jsx`. Use `components/*/*.jsx`
   + `.d.ts` in the package as the **visual + prop spec**, and `ui_kits/terminal/` as the assembled-layout
   reference.

---

## File-by-file plan

**Layout / shell**
- `components/NavShell.tsx` → split into a **thin top header** (date + clock, no brand) and a **left icon
  rail** (Research, Watchlist & industries, Chat, News & events, Settings). The rail toggles a left panel;
  Settings is the only item that swaps the main region to a full view. Move `BudgetGauge` out of the sidebar
  into the right Agent panel.
- `App.tsx` → collapse the routed pages into the single desk. Keep routing only for deep-links if you want
  (e.g. `/companies/:id` opens that detail in the **left** panel), but the **middle never switches**. Settings
  stays a separate route/view.
- New: a **Desk** shell (left panel · middle surveillance · right Agent panel, collapsible). Mirror
  `ui_kits/terminal/Desk.jsx` structure.

**Middle (surveillance)** — new `views/World.tsx` (mirror `ui_kits/terminal/WorldBoard.jsx`)
- Order: **Overview → Geopolitics(+news) → Macro → Industry trends(+news) → General market**, with a
  **Signals** band split into **Now** / **Building**.
- Every item: **fact + numbers lead**; the read, the chain, and the reports-behind-it sit on an **expand**.
  Minimal UI — plain text, no decorative labels/pills/jump chrome/left-border accents.

**Components**
- `components/SignificanceBadge.tsx` → **replace** with a `HorizonTag` (`Now` | `Building`), plain text, no
  number. Remove numeric significance from every caller.
- `components/WorkingStrip.tsx` → **delete**; use a single `AgentStatus` narrator (spec in package
  `components/agent/AgentStatus.{jsx,d.ts}`).
- `components/StatusPill.tsx` → extend states to the **two-engine lifecycle**: agent `researching`/`open`/
  `briefed` vs scraper `swept`/`queued` (package `components/status/StatusPill.d.ts`).
- `components/BudgetGauge.tsx` → keep; relocate into the right Agent panel ("weekly token budget").
- Panel/surfaces → ensure no glow/scan; caps header + hairline body.

**Views → panels**
- `views/CompanyDetail.tsx` → restructure to **Agent summary → Qualitative (the business, industry &
  position, sentiment) → Quantitative (financials, valuation & ratios)**; opens in the **left** panel.
  Spec: package `components/market/StockDetail.{jsx,d.ts}`.
- `views/IndustryDetail.tsx` → mirror the same qual/quant structure; opens in the left panel.
- `views/Research.tsx` + `views/ResearchDetail.tsx` → sessions live in the **right Agent panel**; a session
  opens its full trace there (tokens/turns/tools/sources). Spec: `ui_kits/terminal/DetailPanel.jsx`,
  `LiveResearch.jsx`.
- `views/Home.tsx` / `views/Brief.tsx` → fold into the middle Overview + Updates; `Inbox` becomes **News &
  events** (left panel surface). `Industries` list → "Watchlist & industries" left surface.
- `views/Chat.tsx` → the Chat left-panel surface (talk to the agent any time).
- `views/Settings.tsx` → keep as the one separate full view.

**Behavior guardrails (apply in every changed file)**
- **Reads & observations only** — no buy/sell/hold, no valuation calls.
- **Significance as time, never a number.**
- **Inform first** (fact + numbers), **explain on expand** (read + chain + reports).
- **Surface scraper vs agent honestly** ("swept by the scraper").

---

## Branch + commits + PR

**Branch:** `feat/three-panel-research-desk`

Suggested commit sequence (keeps the PR reviewable):
1. `docs: add PROJECT.md product & behavior spec`
2. `style: add design tokens to Tailwind @theme (palette, type, spacing, radii)`
3. `feat(shell): thin date/time header + left icon rail + collapsible Agent panel`
4. `feat(world): unified surveillance view (Overview→Geo→Macro→Industry→Market) with Now/Building signals`
5. `refactor(detail): CompanyDetail/IndustryDetail → Agent summary + Qualitative + Quantitative`
6. `refactor(agent): research sessions in right panel; AgentStatus single narrator; remove WorkingStrip`
7. `refactor(status): HorizonTag replaces SignificanceBadge; StatusPill two-engine lifecycle`

PR body is in `PR_DESCRIPTION.md`.
