The signature live status line — the agent narrating itself. Phrases rise from below into place, hold, then rise away as the next replaces them. Leading typing-dots signal active work. This is the heart of the "personal, fully visible" feel.

```jsx
<AgentStatus
  phrases={[
    "Thinking…",
    "Researching TSMC advanced-node capacity…",
    "Reading 6 sources…",
    "Cross-checking against the Jun 14 brief…",
    "Drafting findings…",
    "Finding related topics…",
  ]}
  interval={2600}
/>
```

`loop` (default true) cycles; set false to stop on the last phrase when work completes. `size` overrides the line size. Pair with `AgentTrace` below it for the full step log.
