const { Button, StatusPill, OriginBadge, AgentStatus, AgentTrace, SignificanceMeter, ImpactMap } = window.AIStockAgentDesignSystem_ea6e23;

/* DetailPanel — the IDE-style detail that slides into the right panel when you open a research.
 * Full visibility: live status (if open), the step trace, every source, the findings prose,
 * telemetry, cross-platform reuse, and related topics you can spin into new research. */
function DetailPanel({ session, onClose, onSpawn, onAddToWatchlist, watchlistTickers }) {
  window.useStyle("kit-detail", `
    .dt{ }
    @media (prefers-reduced-motion: no-preference){ .dt{ animation:asa-rise-in var(--dur-base) var(--ease-out); } }
    .dt__head{ position:sticky; top:0; background:var(--surface-raised); border-bottom:1px solid var(--border-default);
      padding:13px 16px; display:flex; align-items:flex-start; gap:10px; z-index:2; }
    .dt__htext{ flex:1; min-width:0; }
    .dt__eyebrow{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    .dt__topic{ font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text-strong); line-height:1.25; }
    .dt__close{ flex:none; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;
      color:var(--text-muted); border:1px solid var(--border-default); border-radius:var(--radius-md); background:var(--surface-panel); }
    .dt__close:hover{ color:var(--text-strong); border-color:var(--border-strong); }
    .dt__body{ padding:16px; display:flex; flex-direction:column; gap:18px; }
    .dt__sec h4{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-muted); margin:0 0 10px; }
    .dt__status{ display:flex; align-items:center; }
    .dt__findings{ font-family:var(--font-serif); font-size:15px; line-height:1.65; color:var(--text-body); margin:0; }
    .dt__src{ display:flex; align-items:flex-start; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }
    .dt__src:last-child{ border-bottom:0; }
    .dt__src:hover .dt__src-title{ color:var(--accent-quiet); }
    .dt__src-fav{ flex:none; width:16px; height:16px; border-radius:3px; background:var(--surface-inset); color:var(--text-muted);
      display:flex; align-items:center; justify-content:center; margin-top:1px; }
    .dt__src-main{ flex:1; min-width:0; }
    .dt__src-title{ font-family:var(--font-sans); font-size:13px; color:var(--text-strong); line-height:1.35; }
    .dt__src-meta{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; }
    .dt__src-meta a, .dt__src-dom{ color:var(--link); }
    .dt__sig{ flex:none; margin-top:1px; }
    .dt__chips{ display:flex; flex-wrap:wrap; gap:7px; }
    .dt__chip{ font-family:var(--font-mono); font-size:11px; color:var(--accent-quiet); cursor:pointer; }
    .dt__chip:hover{ color:var(--accent); text-decoration:underline; text-underline-offset:3px; }
    .dt__actions{ display:flex; gap:8px; flex-wrap:wrap; }
    .dt__surfnote{ font-family:var(--font-mono); font-size:10px; line-height:1.5; color:var(--text-dim); margin:-2px 0 11px; }
    .dt__surf{ display:flex; flex-direction:column; gap:0; border-top:1px solid var(--border-default); }
    .dt__surfrow{ display:flex; flex-direction:column; gap:7px; padding:11px 0; background:transparent;
      border:0; border-bottom:1px solid var(--border-default); }
    .dt__surftop{ display:flex; align-items:baseline; gap:9px; }
    .dt__surfsym{ font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--text-strong); }
    .dt__surfname{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted); }
    .dt__surfwhy{ font-family:var(--font-serif); font-size:13px; line-height:1.55; color:var(--text-body); margin:0; }
    .dt__surffoot{ display:flex; align-items:center; gap:10px; margin-top:1px; }
    .dt__surfon{ margin-left:auto; font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--accent-quiet);
      display:inline-flex; align-items:center; gap:5px; }
    .dt__surfon::before{ content:""; width:5px; height:5px; border-radius:999px; background:var(--accent); }
    .dt__surf .asa-btn{ margin-left:auto; }
  `);
  const live = session.status === "open";
  return (
    <div className="dt">
      <div className="dt__head">
        <div className="dt__htext">
          <div className="dt__eyebrow"><OriginBadge initiatedBy={session.origin} /><StatusPill status={session.status} /></div>
          <div className="dt__topic">{session.topic}</div>
        </div>
        <div className="dt__close" onClick={onClose} title="Close"><window.Icon name="x" size={15} /></div>
      </div>

      <div className="dt__body">
        {live && (
          <div className="dt__sec">
            <div className="dt__status"><AgentStatus phrases={session.statusPhrases || window.DATA.ASK_PHRASES} interval={2400} size="13px" /></div>
          </div>
        )}

        <div className="dt__sec">
          <h4>Telemetry · full visibility</h4>
          <window.Telemetry t={session.telemetry} compact />
        </div>

        <div className="dt__sec">
          <h4>Step trace</h4>
          <AgentTrace steps={session.trace} />
        </div>

        {session.summary && (
          <div className="dt__sec">
            <h4>{live ? "Working findings" : "Findings"}</h4>
            <p className="dt__findings">{session.summary}</p>
          </div>
        )}

        {session.impact && session.impact.length > 0 && (
          <div className="dt__sec">
            <h4>Likely affected · what the findings move</h4>
            <ImpactMap items={session.impact} />
          </div>
        )}

        {session.sources && session.sources.length > 0 && (
          <div className="dt__sec">
            <h4>Sources · {session.sources.length}</h4>
            {session.sources.map((src, i) => (
              <div className="dt__src" key={i}>
                <span className="dt__src-fav"><window.Icon name="link" size={10} /></span>
                <div className="dt__src-main">
                  <div className="dt__src-title">{src.title}</div>
                  <div className="dt__src-meta"><span className="dt__src-dom">{src.domain}</span> · {src.at}</div>
                </div>
                <span className="dt__sig"><SignificanceMeter value={src.sig} /></span>
              </div>
            ))}
          </div>
        )}

        {session.surfaced && session.surfaced.length > 0 && (
          <div className="dt__sec">
            <h4>Names surfaced · {session.surfaced.length}</h4>
            <div className="dt__surfnote">found in this research and ranked by exposure · the agent stores high-significance names on its own; confirm the rest</div>
            <div className="dt__surf">
              {session.surfaced.map((n) => {
                const on = watchlistTickers && watchlistTickers.has(n.ticker);
                return (
                  <div className="dt__surfrow" key={n.ticker}>
                    <div className="dt__surftop"><span className="dt__surfsym">{n.ticker}</span><span className="dt__surfname">{n.name}</span></div>
                    <p className="dt__surfwhy">{n.why}</p>
                    <div className="dt__surffoot">
                      <SignificanceMeter value={n.sig} showLabel />
                      {on ? (
                        <span className="dt__surfon">{n.addedBy === "agent" ? "added by agent" : "on watchlist"}</span>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => onAddToWatchlist && onAddToWatchlist(n.ticker)}>Add to watchlist</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {session.related && session.related.length > 0 && (
          <div className="dt__sec">
            <h4>Related topics</h4>
            <div className="dt__chips">
              {session.related.map((r) => (
                <span className="dt__chip" key={r} onClick={() => onSpawn(r)}>{r}</span>
              ))}
            </div>
          </div>
        )}

        <div className="dt__sec">
          <h4>Actions</h4>
          <div className="dt__actions">
            <Button variant="primary" size="sm" onClick={() => onSpawn(`Follow-up on ${session.topic}`)}>Ask a follow-up</Button>
            <Button variant="secondary" size="sm">Re-run</Button>
            <Button variant={live ? "danger" : "ghost"} size="sm">{live ? "Close session" : "Reopen"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { DetailPanel });
