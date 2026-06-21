/* Shared helpers for the research-desk UI kit — injected style, Lucide icon, formatters,
 * and a small telemetry grid (the agent's "full visibility" numbers). */
const { useEffect, useRef, useState } = React;

function useStyle(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/* Lucide icon as a React component. Upgrades the <i> to an SVG after mount. */
function Icon({ name, size = 16, className = "", style = {} }) {
  const ref = useRef(null);
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [name]);
  return <i ref={ref} data-lucide={name} className={className} style={{ width: size, height: size, display: "inline-flex", ...style }} />;
}

function fmtPrice(n) { return n == null ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtPct(n) { return n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`; }

/* Telemetry — the transparency grid. Every cell is a mono label + value the user can see. */
function Telemetry({ t, compact = false }) {
  useStyle("kit-telemetry", `
    .tlm{ display:grid; grid-template-columns:repeat(auto-fit, minmax(50px, 1fr)); gap:1px; background:var(--border-default);
      border:1px solid var(--border-default); border-radius:var(--radius-md); overflow:hidden; }
    .tlm__cell{ background:var(--surface-panel); padding:7px 7px; }
    .tlm__cell.compact{ padding:6px 7px; }
    .tlm__k{ font-family:var(--font-mono); font-size:8px; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); white-space:nowrap; }
    .tlm__v{ font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; margin-top:2px; }
  `);
  const cells = [
    ["turn", t.maxTurns ? `${t.turn}/${t.maxTurns}` : t.turn],
    ["tools", t.tools],
    ["sources", t.sources],
    ["tokens in", t.inTok],
    ["tokens out", t.outTok],
    ["elapsed", t.elapsed],
  ].filter(([, v]) => v != null);
  return (
    <div className="tlm">
      {cells.map(([k, v]) => (
        <div className={`tlm__cell ${compact ? "compact" : ""}`} key={k}>
          <div className="tlm__k">{k}</div>
          <div className="tlm__v">{v}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { useStyle, Icon, fmtPrice, fmtPct, Telemetry });
