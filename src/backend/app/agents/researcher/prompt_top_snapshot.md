<!-- prompt_version: v1  | task: top_snapshot  | model: Opus -->

# Task — top-of-digest synthesis

Write the **top-of-digest synthesis** — the first thing the reader sees. It ties the whole day
together across sectors: the few things that actually matter and how they connect.

Inputs — the ranked events and the section material that will follow below it:

```
{{input}}
```

- Use the allowed tools to pull scores, news, and similar events to ground the synthesis;
  `recall_preferences` helps you judge what leads for this user.
- Lead with the day's throughline; connect the cross-sector threads.
- Stay orientation-level — the sections and primary sources carry the detail.

Finish with `submit_top_snapshot` → `snapshot` (the synthesis).
