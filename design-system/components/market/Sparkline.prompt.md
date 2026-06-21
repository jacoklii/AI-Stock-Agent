A compact phosphor price trace for inline trend at a glance. Auto-colors green when the series ends up, red when down; fills a faint area, draws itself in on mount, and pulses the leading-edge dot.

```jsx
<Sparkline data={[101, 103, 102, 106, 109, 108, 112]} />
<Sparkline data={prices} width={120} height={36} area={false} />
<Sparkline data={prices} color="var(--blue-500)" draw={false} liveDot={false} />
```

Pass `data` oldest→newest (≥2 points). Size with `width`/`height`. The default look (area + draw + liveDot) suits dashboards; turn them off for dense tables.
