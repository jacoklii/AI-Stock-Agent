<!-- prompt_version: v1  | task: article_summary  | model: Haiku -->

# Task — article summary

Condense one news article into the canonical record the system keeps. The raw body is never stored,
so your summary is the only text that survives — it must stand on its own.

Inputs — a provider-shaped event (headline, source, URL, tickers, published time) and any context
the workflow supplies:

```
{{input}}
```

- Write a tight, factual summary of what happened: entities, numbers, the concrete event.
- Report only what the source supports.
- You may check related prior coverage with the allowed tools, but keep it minimal.

Finish with `submit_article_summary` → `summary` (the canonical summary text).
