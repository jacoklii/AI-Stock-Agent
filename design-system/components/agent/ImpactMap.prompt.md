# ImpactMap

The **analytical read-through of a research task**. After the agent states its findings, this maps
them to the **stocks, funds, and industries they most probably move** — so the user can see the
pattern, not just the prose.

## What each row carries

- **Effect direction** — `tailwind ▲` / `headwind ▼` / `mixed ▬`, color-coded (green / terracotta /
  ink). This describes how the finding *acts on* the name's exposure — never a buy/sell call.
- **Probability** — a 0–1 read of how likely the change actually plays out, shown as a quiet
  neutral bar + value (confidence is kept visually separate from direction).
- **The "because"** — one serif line linking finding → effect, carrying the data and the
  interpretation. This is the part that aids intuition.

## Principles

- **Only the most probable.** Feed it the links most definite to change; lower-probability noise is
  left out so the signal is legible. The component renders exactly what it's given.
- **Grouped for pattern-finding.** Default grouping is Industries → Stocks → Funds, so the macro
  read comes first and the names slot under it. Set `groupByKind={false}` for a flat, ranked list.
- **Aids intuition, never replaces it.** The default note reads "patterns to weigh, not calls to
  make." Keep that framing — the agent surfaces exposure and reasoning; the human decides.

## When to use

Inside a research session's detail, right after the findings prose — it's the interpretation of
those findings. Also works standalone anywhere a "what does this move, and why" read is useful.

## Usage

```jsx
const { ImpactMap } = window.AIStockAgentDesignSystem_ea6e23;

<ImpactMap items={[
  { kind: "industry", name: "AI accelerator silicon", effect: "tailwind", probability: 0.80,
    because: "Confirmed packaging step-up relieves the binding supply constraint." },
  { kind: "stock", ticker: "NVDA", name: "NVIDIA", effect: "tailwind", probability: 0.78,
    because: "Most unit-constrained on advanced packaging; added capacity flows straight to volume." },
  { kind: "fund", ticker: "SMH", name: "Semiconductor ETF", effect: "tailwind", probability: 0.62,
    because: "Broad basket captures the packaging-driven volume, diluted vs. single names." },
]} />
```
