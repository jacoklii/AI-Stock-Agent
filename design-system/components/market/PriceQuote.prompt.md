One instrument line for watchlists, brief sets, and quote tables: symbol + optional name on the left, an inline sparkline, then price and signed change. Up/down sets the color and the ▲/▼ arrow.

```jsx
<PriceQuote symbol="NVDA" name="NVIDIA" price={131.26} changePct={2.41} series={spark} />
<PriceQuote symbol="^VIX" price={13.4} changePct={-1.8} showSpark={false} />
<PriceQuote symbol="TSM" price={188.0} changePct={0.0} flash="up" />
```

Set `flash="up"|"down"` to pulse the row background on a tick (clear it after the animation). All mono, tabular-aligned.
