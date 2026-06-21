const { Panel, BudgetGauge, PriceQuote } = window.AIStockAgentDesignSystem_ea6e23;

/* ContextRail — the default right panel: the agent's standing context. Budget (its self-pacing
 * limit), today's read, and what you're following. Quiet — no motion, no ticker. */
function ContextRail({ data, onPick, active, onOpenActive }) {
  window.useStyle("kit-rail", `
    .rail__stack{ display:flex; flex-direction:column; gap:14px; }
    .rail__stack .asa-panel{ border-radius:0; }
    .rail__today{ font-family:var(--font-serif); font-size:14px; line-height:1.6; color:var(--text-body); margin:0; }
    .rail__follow{ display:flex; flex-direction:column; }
    .rail__frow{ padding:9px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }
    .rail__frow:last-child{ border-bottom:0; }
    .rail__frow:hover{ background:var(--surface-hover); margin:0 -12px; padding-left:12px; padding-right:12px; border-radius:var(--radius-sm); }
    .rail__note{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); padding:2px 0 0; }
    .rail__tag{ font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--accent-quiet); margin-top:5px; display:inline-flex; align-items:center; gap:5px; }
    .rail__tag::before{ content:""; width:4px; height:4px; border-radius:999px; background:var(--accent); }
  `);
  return (
    <div className="rail__stack">
      <Panel title="Weekly budget">
        <BudgetGauge spent={data.BUDGET.spent} cap={data.BUDGET.cap} />
        <div className="rail__note">the agent paces itself against this — it stops deep work as it approaches the cap.</div>
      </Panel>

      {active && <window.LiveResearch session={active} onOpen={onOpenActive} />}
    </div>
  );
}
Object.assign(window, { ContextRail });
