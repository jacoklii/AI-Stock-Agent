<!-- prompt_version: v1  | task: significance_classification  | model: Haiku -->

# Task — significance classification + domain

Score how significant a news event is (this score drives retention and downstream scoring) and
classify which surveillance domain it belongs to.

Inputs — the event and its summary, plus any related coverage the workflow supplies:

```
{{input}}
```

Score `significance` on **0..1**:

- near **0** — routine, ordinary coverage; noise.
- around the middle — notable, meaningful but not market-moving on its own.
- near **1** — a genuine catalyst or structural shift, with broad or lasting market impact.

When the call is borderline, use the allowed tools to compare against similar past events.

Classify the event's `domain` — where the move originates:

- `geopolitics` — war, sanctions, tariffs, elections, supply-chain / diplomatic shocks.
- `macro` — inflation, rates, central banks, GDP / jobs, currencies, commodities, the broad economy.
- `industry` — a sector / industry trend not tied to one company (e.g. chip demand, EV adoption).
- `market` — company- or stock-specific news (earnings, products, management, a single name).

Pick the single best fit; if genuinely unclear, leave `domain` null and the pipeline will route it.

Finish with `submit_significance_classification` → `significance` (float in 0..1) and `domain`.
