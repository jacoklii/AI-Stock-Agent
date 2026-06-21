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
.asa-badge{
  display:inline-flex; align-items:center; gap:5px; height:auto; padding:0;
  border:0; background:transparent; color:var(--_fg);
  font-family:var(--font-mono); font-size:var(--text-2xs); font-weight:var(--weight-semibold);
  letter-spacing:.04em; white-space:nowrap; text-transform:none;
}
.asa-badge--caps{ text-transform:uppercase; letter-spacing:.1em; }
.asa-badge__dot{ width:5px; height:5px; border-radius:var(--radius-full); background:currentColor; }
`;

const TONES = {
  neutral: { fg: "var(--text-muted)", bg: "var(--surface-hover)", bd: "var(--border-default)" },
  signal: { fg: "var(--signal-400)", bg: "var(--up-bg)", bd: "color-mix(in oklch, var(--signal-500), transparent 60%)" },
  amber: { fg: "var(--amber-500)", bg: "var(--amber-bg)", bd: "color-mix(in oklch, var(--amber-500), transparent 60%)" },
  blue: { fg: "var(--link)", bg: "transparent", bd: "transparent" },
  clear: { fg: "var(--text-muted)", bg: "transparent", bd: "var(--border-strong)" },
  red: { fg: "var(--down-500)", bg: "var(--red-bg)", bd: "color-mix(in oklch, var(--red-500), transparent 55%)" },
};

/**
 * Badge — a compact label/tag. Carries coverage tiers, research origin, and any short marker.
 * Pick a `tone`; set `dot` for a leading status dot, `caps` for uppercase tracking.
 */
export function Badge({ tone = "neutral", dot = false, caps = false, className = "", children, ...rest }) {
  useStyle("asa-badge-css", CSS);
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`asa-badge ${caps ? "asa-badge--caps" : ""} ${className}`}
      style={{ "--_fg": t.fg, "--_bg": t.bg, "--_bd": t.bd }}
      {...rest}
    >
      {dot && <span className="asa-badge__dot" aria-hidden />}
      {children}
    </span>
  );
}

/* Coverage-tier helper — maps the four ARCHITECTURE.md tiers to badge tones. */
const TIER_TONE = { watchlist: "signal", industry_critical: "amber", discovered: "neutral", archived: "neutral" };
export function TierBadge({ tier = "discovered", ...rest }) {
  return (
    <Badge tone={TIER_TONE[tier] || "neutral"} caps {...rest}>
      {tier}
    </Badge>
  );
}

/* Origin helper — who opened a research session. */
export function OriginBadge({ initiatedBy }) {
  if (initiatedBy !== "user" && initiatedBy !== "schedule") return null;
  const isUser = initiatedBy === "user";
  return (
    <Badge tone={isUser ? "clear" : "amber"} dot>
      {isUser ? "requested" : "autonomous"}
    </Badge>
  );
}
