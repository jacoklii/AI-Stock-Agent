# Three-panel research desk + behavior spec

Brings the frontend in line with the saved design system and the product/behavior spec. Replaces the
older multi-view layout with the single unified surveillance desk and the reads-only, information-first
rules captured in `PROJECT.md`.

## Why
The agent is a research partner that **informs first and explains patterns second** — and **never makes
a buy/sell/hold or valuation call**. The UI should let the information take over, not the chrome. The
current routed multi-view layout and numeric significance badges work against that. This PR adopts the
saved three-panel layout and the presentation rules.

## What changes
- **Layout → one terminal, three panels.** A very thin header (date + time only, **no logo**). A left
  **icon rail** — Research · Watchlist & industries · Chat · News & events · Settings — toggles a left
  panel; it does **not** switch the main view. The **middle** is the always-on world surveillance view.
  The **right** is the Agent panel (state + weekly token budget; research sessions open here),
  collapsible. **Settings** is the only separate full view.
- **Middle view** ordered Overview → Geopolitics (news embedded) → Macroeconomics → Industry trends
  (news embedded) → General market, with a **Signals** band split into **Now** vs **Building**. Every
  statement leads with the fact + the numbers; the read, the chain, and the reports behind it sit on an
  expand. Anything clickable expands to full info / research / source.
- **Significance is shown as time, never a number.** `HorizonTag` (Now / Building) replaces
  `SignificanceBadge`; numeric scores removed from all surfaces.
- **Stock / industry detail** restructured to **Agent summary → Qualitative (the business, industry &
  position, sentiment) → Quantitative (financials, valuation & ratios)**; opens in the left panel.
- **Agent surfaces consolidated.** `AgentStatus` is the single live narrator; `WorkingStrip` removed.
  `StatusPill` gains the two-engine lifecycle (agent `researching`/`open`/`briefed` vs scraper
  `swept`/`queued`) so the UI honestly distinguishes "swept by the scraper" from "researched by the agent."
- **Design tokens** added to Tailwind `@theme` (palette, type scale, spacing, radii) for the squared-off,
  hairline-bordered terminal aesthetic — no glow.
- **`PROJECT.md`** added at repo root as the durable behavior contract.

## Out of scope / follow-ups
- Wiring the new surfaces to live scraper/agent data beyond what the current queries expose.
- Email/text notification flows.
- Removing now-unused routed views once their content is folded into the desk (can land in a cleanup PR).

## Notes for reviewers
- Behavior guardrails apply throughout: reads-only (no recommendations/valuation), inform-first then
  explain-on-expand, significance-as-time, scraper-vs-agent surfaced honestly, minimalist UI (no
  decorative labels, pills, jump chrome, left-border accents, or glow).
- Full rationale and the per-file map are in `INTEGRATION.md`; the design reference (components + the
  assembled desk in `ui_kits/terminal/`) ships alongside.
