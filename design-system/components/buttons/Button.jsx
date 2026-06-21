import React from "react";

/* Inject a component's CSS once into <head>. Lets primitives carry hover/active/focus
 * states without a build step, while still reading the design-system tokens. */
function useStyle(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const CSS = `
.asa-btn{
  --_bg:var(--surface-raised); --_fg:var(--text-strong); --_bd:var(--border-strong);
  display:inline-flex; align-items:center; justify-content:center; gap:var(--space-2);
  font-family:var(--font-mono); font-weight:var(--weight-medium);
  letter-spacing:var(--tracking-data); line-height:1; white-space:nowrap;
  border:1px solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-md); cursor:pointer; position:relative;
  transition:background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.asa-btn:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
.asa-btn:active{ transform:translateY(1px); }
.asa-btn[disabled]{ opacity:.4; cursor:not-allowed; transform:none; }

.asa-btn--md{ height:34px; padding:0 var(--space-4); font-size:var(--text-sm); }
.asa-btn--sm{ height:27px; padding:0 var(--space-3); font-size:var(--text-xs); }

.asa-btn--primary{ --_bg:var(--accent); --_fg:var(--text-on-signal); --_bd:var(--accent); font-weight:var(--weight-semibold); }
.asa-btn--primary:hover:not([disabled]){ --_bg:var(--accent-hover); --_bd:var(--accent-hover); box-shadow:var(--shadow-panel); }

.asa-btn--secondary{ --_bg:var(--surface-panel); --_fg:var(--text-strong); --_bd:var(--border-strong); }
.asa-btn--secondary:hover:not([disabled]){ --_bg:var(--surface-hover); --_bd:var(--accent); --_fg:var(--accent-quiet); }

.asa-btn--ghost{ --_bg:transparent; --_fg:var(--text-muted); --_bd:transparent; }
.asa-btn--ghost:hover:not([disabled]){ --_bg:var(--surface-hover); --_fg:var(--text-strong); }

.asa-btn--danger{ --_bg:var(--surface-panel); --_fg:var(--down-500); --_bd:color-mix(in oklch, var(--red-500), transparent 55%); }
.asa-btn--danger:hover:not([disabled]){ --_bg:var(--red-bg); --_bd:var(--red-500); }

.asa-btn__icon{ display:inline-flex; width:1em; height:1em; }
`;

/**
 * Button — the terminal action control. Square-ish, mono-labelled, glows on hover when primary.
 */
export function Button({
  variant = "secondary",
  size = "md",
  icon = null,
  iconRight = null,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...rest
}) {
  useStyle("asa-button-css", CSS);
  return (
    <button
      type={type}
      disabled={disabled}
      className={`asa-btn asa-btn--${variant} asa-btn--${size} ${className}`}
      {...rest}
    >
      {icon && <span className="asa-btn__icon">{icon}</span>}
      {children}
      {iconRight && <span className="asa-btn__icon">{iconRight}</span>}
    </button>
  );
}
