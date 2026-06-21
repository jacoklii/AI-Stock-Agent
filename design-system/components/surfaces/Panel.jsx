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
.asa-panel{
  position:relative; background:transparent;
}

.asa-panel__head{
  display:flex; align-items:center; justify-content:space-between; gap:var(--space-3);
  padding:var(--space-2) 0; min-height:34px;
  border-top:1px solid var(--border-strong); border-bottom:1px solid var(--border-strong);
}
.asa-panel__title{
  display:inline-flex; align-items:center; gap:var(--space-2);
  font:var(--type-label); text-transform:uppercase; letter-spacing:var(--tracking-caps);
  color:var(--text-muted);
}
.asa-panel__title::before{
  content:""; width:6px; height:6px; border-radius:var(--radius-full);
  background:var(--border-strong);
}
.asa-panel--live .asa-panel__title::before{ background:var(--accent); animation:asa-pulse 1.8s var(--ease-in-out) infinite; }
.asa-panel__aside{ display:inline-flex; align-items:center; gap:var(--space-2); color:var(--text-dim); font-family:var(--font-mono); font-size:var(--text-2xs); }
.asa-panel__body{ padding:var(--space-3) 0; color:var(--text-body); }
.asa-panel__body--pad0{ padding:0; }
`;

/**
 * Panel — the terminal surface that frames a section. Minimal by design: a caps header with a
 * live signal dot, an optional right-aligned aside (freshness, count), and a hairline-bordered
 * body. No glow, no scan flourish — the information leads, the chrome recedes.
 */
export function Panel({
  title,
  aside = null,
  live = false,
  noPad = false,
  className = "",
  children,
  ...rest
}) {
  useStyle("asa-panel-css", CSS);
  const cls = ["asa-panel", live && "asa-panel--live", className].filter(Boolean).join(" ");
  return (
    <section className={cls} {...rest}>
      {(title || aside) && (
        <header className="asa-panel__head">
          {title && <span className="asa-panel__title">{title}</span>}
          {aside && <span className="asa-panel__aside">{aside}</span>}
        </header>
      )}
      <div className={`asa-panel__body ${noPad ? "asa-panel__body--pad0" : ""}`}>{children}</div>
    </section>
  );
}
