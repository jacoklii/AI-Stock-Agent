<!-- prompt_version: v1  | task: significance_classification  | model: Haiku -->

# Task — significance classification

Score how significant a news event is. This score drives retention and downstream scoring.

Inputs — the event and its summary, plus any related coverage the workflow supplies:

```
{{input}}
```

Score `significance` on **0..1**:

- near **0** — routine, ordinary coverage; noise.
- around the middle — notable, meaningful but not market-moving on its own.
- near **1** — a genuine catalyst or structural shift, with broad or lasting market impact.

When the call is borderline, use the allowed tools to compare against similar past events.

Finish with `submit_significance_classification` → `significance` (float in 0..1).
