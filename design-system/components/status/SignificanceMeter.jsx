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
.asa-sig{ display:inline-flex; align-items:center; gap:7px; font-family:var(--font-mono); }
.asa-sig__bars{ display:inline-flex; gap:2px; align-items:flex-end; height:14px; }
.asa-sig__bar{ width:3px; border-radius:1px; background:var(--surface-inset); transition:background var(--dur-base) var(--ease-out); }
.asa-sig__bar--on{ background:var(--_c); }
.asa-sig__val{ font-size:var(--text-xs); font-weight:var(--weight-bold); color:var(--_c); font-variant-numeric:tabular-nums; }
.asa-sig__label{ font-size:var(--text-3xs); text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); }
`;

const HEIGHTS = [5, 8, 11, 14, 17];

/**
 * SignificanceMeter — a 0–1 "does this actually matter" score as a 5-segment bar + value. Ranks
 * the Signals band, geopolitical events and findings so significance is felt, and marks the
 * threshold at which the scraper's findings escalate to a deep-research session. Color steps from
 * neutral (low) through amber to red (high).
 */
export function SignificanceMeter({ value = 0, showLabel = false, className = "", ...rest }) {
  useStyle("asa-sig-css", CSS);
  const v = Math.max(0, Math.min(1, value));
  const color = v >= 0.7 ? "var(--red-500)" : v >= 0.4 ? "var(--amber-500)" : "var(--text-muted)";
  const lit = Math.round(v * 5);
  return (
    <span className={`asa-sig ${className}`} style={{ "--_c": color }} title={`significance ${v.toFixed(2)}`} {...rest}>
      {showLabel && <span className="asa-sig__label">sig</span>}
      <span className="asa-sig__bars" aria-hidden>
        {HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`asa-sig__bar ${i < lit ? "asa-sig__bar--on" : ""}`}
            style={{ height: `${h}px` }}
          />
        ))}
      </span>
      <span className="asa-sig__val">{v.toFixed(2)}</span>
    </span>
  );
}
