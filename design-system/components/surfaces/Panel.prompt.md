The terminal surface that frames every snapshot, list, and section. A caps header bar with a live phosphor dot, an optional right-aligned aside, and a bordered body. This is the workhorse layout container — the old app called it "SnapshotCard".

```jsx
<Panel title="Working now" live>
  <TaskList tasks={running} />
</Panel>

<Panel title="Today's digest" aside={<FreshnessStamp iso={generatedAt} label="generated" />}>
  <Prose>{snapshot}</Prose>
</Panel>

<Panel title="Live state" noPad glow>{/* table */}</Panel>
```

Props: `title`, `aside`, `live` (pulse the dot for streaming state), `glow` (mark the active panel), `flush` (no shadow), `scan` (one scanline sweep), `noPad` (table/list bodies). Renders a `<section>`; passes through HTML attrs.
