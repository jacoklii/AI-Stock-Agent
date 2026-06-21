The signal-vs-noise marker — a 0–1 significance score as a 5-segment phosphor bar plus the value. Color steps with the ingest thresholds: neutral below 0.4, amber 0.4–0.7, red above 0.7.

```jsx
<SignificanceMeter value={0.82} />            {/* red, 5 bars lit */}
<SignificanceMeter value={0.55} showLabel />  {/* amber, "SIG 0.55" */}
<SignificanceMeter value={0.2} />             {/* neutral */}
```

Use it on news/article rows to show how big a deal an event is. `showLabel` prefixes a caps "SIG".
