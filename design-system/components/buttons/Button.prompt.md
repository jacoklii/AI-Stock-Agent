The terminal action control — mono-labelled, square radius, phosphor-green glow on the primary hover. Use for any click action; one `primary` per view (Research, Run brief, Send).

```jsx
<Button variant="primary" onClick={openResearch}>Research</Button>
<Button variant="secondary" size="sm">Redirect</Button>
<Button variant="ghost" size="sm">dismiss</Button>
<Button variant="danger" size="sm">Close session</Button>
<Button variant="primary" icon={<span>&#9656;</span>}>Run brief now</Button>
```

Variants: `primary` (bright signal fill, dark text), `secondary` (outline, default), `ghost` (quiet text button), `danger` (red outline for destructive/close). Sizes: `md` (default, 34px), `sm` (27px). Passes through all native button props (`onClick`, `disabled`, `type`).
