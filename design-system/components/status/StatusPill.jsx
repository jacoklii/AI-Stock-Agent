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
.asa-status{
  display:inline-flex; align-items:center; gap:6px; height:20px; padding:0 8px 0 7px;
  border-radius:var(--radius-full); border:1px solid var(--_bd, var(--border-default));
  background:var(--_bg, transparent); color:var(--_fg, var(--text-muted));
  font-family:var(--font-mono); font-size:var(--text-2xs); font-weight:var(--weight-semibold);
  text-transform:uppercase; letter-spacing:.08em; white-space:nowrap;
}
.asa-status__dot{ width:6px; height:6px; border-radius:var(--radius-full); background:currentColor; }
.asa-status--live .asa-status__dot{ animation:asa-pulse 1.8s var(--ease-in-out) infinite; }
`;

const MAP = {
  // agent (researcher) lifecycle
  researching: { fg: "var(--status-running)", bg: "var(--up-bg)", bd: "color-mix(in oklch, var(--signal-500), transparent 60%)", live: true },
  running: { fg: "var(--status-running)", bg: "var(--up-bg)", bd: "color-mix(in oklch, var(--signal-500), transparent 60%)", live: true },
  open: { fg: "var(--status-open)", bg: "var(--up-bg)", bd: "color-mix(in oklch, var(--signal-500), transparent 60%)", live: true },
  briefed: { fg: "var(--status-success)", bg: "var(--up-bg)", bd: "color-mix(in oklch, var(--signal-500), transparent 60%)", live: false },
  succeeded: { fg: "var(--status-success)", bg: "var(--up-bg)", bd: "color-mix(in oklch, var(--signal-500), transparent 60%)", live: false },
  // scraper (cheap sensor net) — swept & stored, not researched by the agent
  swept: { fg: "var(--text-muted)", bg: "var(--surface-hover)", bd: "var(--border-default)", live: false },
  closed: { fg: "var(--text-muted)", bg: "var(--surface-hover)", bd: "var(--border-default)", live: false },
  failed: { fg: "var(--status-failed)", bg: "var(--red-bg)", bd: "color-mix(in oklch, var(--red-500), transparent 55%)", live: false },
  queued: { fg: "var(--text-dim)", bg: "transparent", bd: "var(--border-default)", live: false },
  pending: { fg: "var(--text-dim)", bg: "transparent", bd: "var(--border-default)", live: false },
};

/**
 * StatusPill — research/task lifecycle marker. Live states (researching, running, open) pulse
 * their dot. `swept` marks what the cheap scraper stored vs. what the agent actually researched.
 */
export function StatusPill({ status = "pending", className = "", ...rest }) {
  useStyle("asa-status-css", CSS);
  const m = MAP[status] || MAP.pending;
  return (
    <span
      className={`asa-status ${m.live ? "asa-status--live" : ""} ${className}`}
      style={{ "--_fg": m.fg, "--_bg": m.bg, "--_bd": m.bd }}
      {...rest}
    >
      <span className="asa-status__dot" aria-hidden />
      {status}
    </span>
  );
}
