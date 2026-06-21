const { Panel, Button, OriginBadge, AgentStatus, AgentTrace } = window.AIStockAgentDesignSystem_ea6e23;

/* LiveResearch — the hero. The open session you see first: what the agent is doing right now,
 * narrated (AgentStatus), the full step trace (AgentTrace), and the live telemetry. */
function LiveResearch({ session, onOpen }) {
  window.useStyle("kit-live", `
    .live{ }
    @media (prefers-reduced-motion: no-preference){ .live{ animation:asa-rise-in var(--dur-slow) var(--ease-out); } }
    .live__topline{ display:flex; align-items:center; gap:10px; margin-bottom:4px; }
    .live__eyebrow{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:var(--accent-quiet); }
    .live__topic{ font-family:var(--font-display); font-size:21px; font-weight:700; letter-spacing:-.01em; color:var(--text-strong); margin:0 0 14px; line-height:1.2; }
    .live__status{ display:flex; align-items:center; min-height:26px; margin-bottom:16px; }
    .live__trace{ margin-bottom:16px; }
    .live__foot{ display:flex; align-items:center; gap:12px; margin-top:14px; }
    .live__actions{ margin-left:auto; display:flex; gap:8px; }
  `);
  return (
    <Panel title="Working now" live className="live"
      aside={<span>opened {session.openedAt.split(" · ")[1]}</span>}>
      <div className="live__topline"><span className="live__eyebrow">active research</span><OriginBadge initiatedBy={session.origin} /></div>
      <h2 className="live__topic">{session.topic}</h2>

      <div className="live__status">
        <AgentStatus phrases={session.statusPhrases} interval={2500} size="14px" />
      </div>

      <div className="live__trace">
        <AgentTrace steps={session.trace} />
      </div>

      <window.Telemetry t={session.telemetry} />

      <div className="live__foot">
        <div className="live__actions">
          <Button variant="secondary" size="sm" onClick={() => onOpen(session.id)}>Open full trace</Button>
          <Button variant="ghost" size="sm">Pause</Button>
        </div>
      </div>
    </Panel>
  );
}
Object.assign(window, { LiveResearch });
