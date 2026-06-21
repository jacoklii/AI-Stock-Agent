Lifecycle marker for research sessions and tasks. Live states pulse a glowing dot; terminal states sit quiet.

```jsx
<StatusPill status="running" />   {/* pulses, signal green */}
<StatusPill status="open" />      {/* pulses */}
<StatusPill status="closed" />    {/* muted */}
<StatusPill status="failed" />    {/* red */}
```

Statuses: `running`, `open`, `succeeded`, `closed`, `failed`, `pending`. `running`/`open` animate the dot.
