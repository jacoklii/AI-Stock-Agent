<!-- prompt_version: v1  | task: pulse_snapshot  | model: Haiku -->

# Task — pulse snapshot

Write the **brief pulse**: a few sentences on current market movement, sent to iMessage/WhatsApp.
Short, scannable, plain — a phone notification, not a report.

Inputs — the live pulse-set readings (fixed core indices + the user's mega-caps):

```
{{input}}
```

- Call out the notable movers and the overall tone in one short paragraph.
- Keep it terse; describe movement, never forecast it.

Finish with `submit_pulse_snapshot` → `snapshot` (the brief movement text).
