const { StatusPill, OriginBadge, AgentStatus } = window.AIStockAgentDesignSystem_ea6e23;

/* ResearchList — the unified feed of sessions, open first. Each row is interactive: click to
 * open its full detail in the side panel (IDE-style). Live rows narrate themselves inline. */
function ResearchRow({ s, selected, onSelect }) {
  const when = s.status === "closed" ? `closed ${s.closedAt.split(" · ")[0]}` : `active ${s.activeAgo || "now"}`;
  return (
    <div className={`rl__row ${selected ? "rl__row--sel" : ""}`} onClick={() => onSelect(s.id)}>
      <div className="rl__main">
        <div className="rl__top">
          <span className="rl__topic">{s.topic}</span>
          <span className="rl__badges"><OriginBadge initiatedBy={s.origin} /><StatusPill status={s.status} /></span>
        </div>
        {s.live ? (
          <div className="rl__live"><AgentStatus phrases={s.statusPhrases} interval={2300} size="12px" /></div>
        ) : (
          <p className="rl__summary">{s.summary}</p>
        )}
        <div className="rl__meta">
          <span>{s.openedAt}</span><span className="rl__dot">·</span><span>{when}</span>
          {s.telemetry && (<><span className="rl__dot">·</span><span>{s.telemetry.sources} sources</span><span className="rl__dot">·</span><span>{s.telemetry.inTok} in</span></>)}
        </div>
      </div>
      <span className="rl__chev"><window.Icon name="chevron-right" size={16} /></span>
    </div>
  );
}

function ResearchList({ sessions, selectedId, onSelect }) {
  window.useStyle("kit-rl", `
    .rl__head{ display:flex; align-items:baseline; justify-content:space-between; margin:26px 2px 10px; }
    .rl__h{ font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-strong); }
    .rl__count{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
    .rl{ display:flex; flex-direction:column; gap:8px; }
    .rl__row{ display:flex; align-items:center; gap:12px; padding:14px 14px; background:var(--surface-panel);
      border:1px solid var(--border-default); border-radius:var(--radius-md); cursor:pointer;
      transition:border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out); }
    .rl__row:hover{ border-color:var(--border-strong); background:var(--surface-raised); }
    .rl__row--sel{ border-color:var(--accent); }
    .rl__main{ flex:1; min-width:0; }
    .rl__top{ display:flex; align-items:center; gap:10px; }
    .rl__topic{ font-family:var(--font-display); font-size:14px; font-weight:600; color:var(--text-strong); }
    .rl__badges{ display:inline-flex; gap:7px; margin-left:auto; flex:none; }
    .rl__summary{ font-family:var(--font-serif); font-size:14px; line-height:1.5; color:var(--text-muted); margin:7px 0 0; }
    .rl__live{ margin:8px 0 0; }
    .rl__meta{ display:flex; align-items:center; gap:7px; margin-top:9px; font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
    .rl__dot{ opacity:.5; }
    .rl__chev{ flex:none; color:var(--text-dim); display:flex; }
    .rl__row:hover .rl__chev{ color:var(--accent); }
  `);
  const open = sessions.filter((s) => s.status === "open");
  const closed = sessions.filter((s) => s.status === "closed");
  return (
    <div>
      <div className="rl__head"><span className="rl__h">Your research</span><span className="rl__count">{open.length} open · {closed.length} done</span></div>
      <div className="rl">
        {open.map((s) => <ResearchRow key={s.id} s={s} selected={s.id === selectedId} onSelect={onSelect} />)}
        {closed.map((s) => <ResearchRow key={s.id} s={s} selected={s.id === selectedId} onSelect={onSelect} />)}
      </div>
    </div>
  );
}
Object.assign(window, { ResearchList });
