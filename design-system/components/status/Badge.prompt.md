A compact mono label/tag. The base `Badge` takes a `tone`; `TierBadge` and `OriginBadge` are domain helpers built on it.

```jsx
<Badge tone="blue" dot>3 sources</Badge>     {/* plain blue link text, no bubble */}
<Badge tone="signal" caps>watchlist</Badge>
<TierBadge tier="industry_critical" />   {/* amber */}
<TierBadge tier="watchlist" />           {/* signal green */}
<OriginBadge initiatedBy="user" />       {/* clear outline · "requested" */}
<OriginBadge initiatedBy="schedule" />   {/* amber · "autonomous" */}
```

Tones: `neutral`, `signal`, `amber`, `blue` (plain blue link text — no fill), `clear` (outline-only bubble, no color), `red`. `dot` adds a status dot; `caps` uppercases. Coverage tiers map: watchlist→signal, industry_critical→amber, discovered/archived→neutral.
