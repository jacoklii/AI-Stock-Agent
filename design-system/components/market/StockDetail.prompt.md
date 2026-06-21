# StockDetail

The **watchlist drill-down**. In the research desk, the "Following" list is the watchlist; clicking
a name swaps the right panel from the standing context to this full per-stock record.

## What it shows

A quiet **price header** (ticker, name, coverage `TierBadge`, price + signed change + sparkline,
live-quote stamp), then a stack of `Panel` sections:

1. **Sentiment** — the agent's read on a calm −1…+1 meter (centered zero, colored marker), a
   one-line serif read, a 30-day trend trace, and the source count. Interpretive, always sourced.
2. **Financials** — operational rows (revenue, growth, margins, FCF, net cash) in mono tabular
   figures. `dir` may tint a growth/margin value — never a verdict.
3. **Industry & position** — sector / sub-industry / a descriptive position line, a **peers** list
   with signed changes, and **supply-chain neighbor** chips.
4. **Recent findings** — material articles the agent read about the name, each with domain (link),
   timestamp, and a `SignificanceMeter`.
5. **What the agent remembers** — the memory-of-you note for this name.
6. **Actions** — Research this name (spawns a session), Set alert, Remove.

## Provenance & loading

The record is pulled from the store, so each section can carry an **"as of …"** freshness stamp
(`showProvenance`, on by default) and the panel renders a calm **skeleton** while `loading`.

## When to use

Use it whenever a watchlist/coverage name needs a metrics drill-down. Drop it into the right
detail rail alongside `DetailPanel` (research sessions) — they share the surface.

## Hard rule

Like everything in this system, it **never recommends buy/sell/hold and makes no valuation
calls**. Sentiment, financials, and position are framed as *reads and observations*, with sources.

## Usage

```jsx
const { StockDetail } = window.AIStockAgentDesignSystem_ea6e23;

<StockDetail
  stock={record}
  loading={fetching}
  onClose={() => setPicked(null)}
  onResearch={(s) => spawnSession(`What's material on ${s.ticker}?`)}
  onSetAlert={(s) => openAlertEditor(s)}
  onRemove={(s) => unfollow(s)}
/>
```

Render with `<window.Icon>` available (Lucide) for the close glyph; it falls back to a text mark.
