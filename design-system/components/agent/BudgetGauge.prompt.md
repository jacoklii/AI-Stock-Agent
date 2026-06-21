The agent's weekly token budget — its self-pacing limit — as a segmented phosphor gauge. Always visible (sidebar, Home cost panel). Tone shifts green → amber → red as spend nears the cap; the leading lit segment pulses.

```jsx
<BudgetGauge spent={1_240_000} cap={2_000_000} />
<BudgetGauge spent={920_000} cap={1_000_000} compact />  {/* sidebar */}
<BudgetGauge spent={310_000} cap={null} />               {/* uncapped */}
```

`compact` tightens the bar for the sidebar. `cap={null}` shows spend with no fill ("uncapped").
