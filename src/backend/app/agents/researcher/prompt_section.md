<!-- prompt_version: v1  | task: section_snapshot  | model: Sonnet -->

# Task — digest section

Write one **section** of the daily digest — a sector or macro grouping. The section orients the
reader, then points them at the primary sources (the article URLs the workflow attaches).

Inputs — the sector/theme, its rolled-up state, and the ranked events in the group:

```
{{input}}
```

- Use the allowed tools to pull scores, recent news, and similar events as needed. For a sector or
  industry section, call `get_news_events` with that `industry_id` to pull its company-tagged events
  *and* the macro items routed to it in one read. `recall_preferences` helps you judge which threads
  matter most to this user.
- Write a short snapshot that connects the dots across the events — what is moving and why.
- Name **1–5 key tickers** to watch in this section.

Finish with `submit_section_snapshot` → `snapshot` (the orientation prose) + `key_tickers` (1–5).
