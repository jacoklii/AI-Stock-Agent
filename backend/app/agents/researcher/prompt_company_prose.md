<!-- prompt_version: v1  | task: company_prose  | model: Sonnet -->

# Task — company read

Write the sparse company **read** — the insight stored only when your view has genuinely shifted. It
connects dots across scores, financials, and news. Orientation, never a decision.

Inputs — latest scores, recent news, similar past events, and the previous prose (if any):

```
{{input}}
```

- Use the allowed tools to gather scores, score history, financials, news, and similar events.
- Explain what changed and why it matters — the causal threads, not a verdict. If nothing has
  genuinely shifted, say so rather than manufacturing a read.
- Cite the `news_event_id`s your read draws on; synthesis is never served without its sources.

Finish with `submit_company_prose` → `body` (the prose read) + `citation_event_ids` (the
`news_event_id`s that fed it).
