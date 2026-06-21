import React from "react";

function useStyle(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const CSS = `
.asa-gauge{ display:flex; flex-direction:column; gap:var(--space-2); font-family:var(--font-mono); }
.asa-gauge__top{ display:flex; align-items:baseline; justify-content:space-between; gap:var(--space-2); }
.asa-gauge__label{ font-size:var(--text-2xs); text-transform:uppercase; letter-spacing:var(--tracking-caps); color:var(--text-muted); }
.asa-gauge__val{ font-size:var(--text-2xs); color:var(--text-dim); font-variant-numeric:tabular-nums; }
.asa-gauge__val b{ color:var(--_tone); font-weight:var(--weight-bold); }
.asa-gauge__segs{ display:flex; gap:2px; }
.asa-gauge__seg{ flex:1; height:8px; border-radius:1px; background:var(--surface-inset); transition:background var(--dur-base) var(--ease-out); }
.asa-gauge__seg--on{ background:var(--_tone); }
.asa-gauge__seg--edge{ background:var(--_tone); animation:asa-pulse 1.8s var(--ease-in-out) infinite; }
.asa-gauge--compact .asa-gauge__seg{ height:6px; }
`;

function fmtTokens(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * BudgetGauge — the agent's weekly token self-pacing limit as a segmented terminal bar. Tone
 * shifts green → amber → red as spend approaches the cap; the leading lit segment pulses.
 */
export function BudgetGauge({ spent = 0, cap = null, segments = 28, compact = false, className = "", ...rest }) {
  useStyle("asa-gauge-css", CSS);
  const ratio = cap ? Math.min(1, spent / cap) : 0;
  const tone = ratio > 0.9 ? "var(--red-500)" : ratio > 0.7 ? "var(--amber-500)" : "var(--signal-500)";
  const lit = cap ? Math.round(ratio * segments) : 0;
  return (
    <div className={`asa-gauge ${compact ? "asa-gauge--compact" : ""} ${className}`} style={{ "--_tone": tone }} {...rest}>
      <div className="asa-gauge__top">
        <span className="asa-gauge__label">Weekly budget</span>
        <span className="asa-gauge__val">
          <b>{fmtTokens(spent)}</b>
          {cap != null ? ` / ${fmtTokens(cap)}` : " · uncapped"}
        </span>
      </div>
      <div className="asa-gauge__segs" aria-hidden>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={`asa-gauge__seg ${i < lit ? "asa-gauge__seg--on" : ""} ${i === lit - 1 ? "asa-gauge__seg--edge" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
