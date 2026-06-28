<!-- prompt_version: v2  | task: section_snapshot  | model: Sonnet -->

# Task — section snapshot

Write one **section** of the surveillance feed — a domain (geopolitics, macroeconomics, industry
trends, general market) or a single critical industry. The snapshot orients the reader, then points
them at the primary sources (the article URLs already attached to the events).

Inputs — the section title and the recent events grouped into it:

```
{{input}}
```

- The section's events are provided above. You may also call `get_news_events` (with that section's
  `domain`, or an `industry_id`) or other read tools to pull more context, and `recall_preferences`
  to judge which threads matter most to this user.
- Write a short snapshot that connects the dots across the events — what is moving and why. Reads and
  observations only: never a buy/sell/hold or a valuation call.
- Name **1–5 key tickers** to watch in this section (omit if none stand out).

Finish with `submit_section_snapshot` → `snapshot` (the orientation prose) + `key_tickers` (1–5).
