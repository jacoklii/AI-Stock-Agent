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
.asa-trace{ display:flex; flex-direction:column; }
.asa-trace__step{ position:relative; display:grid; grid-template-columns:18px 1fr; gap:10px; padding:0 0 14px; }
.asa-trace__step:last-child{ padding-bottom:0; }
/* connector line */
.asa-trace__rail{ position:relative; display:flex; justify-content:center; }
.asa-trace__rail::before{ content:""; position:absolute; top:14px; bottom:-14px; width:1.5px; background:var(--border-strong); }
.asa-trace__step:last-child .asa-trace__rail::before{ display:none; }
.asa-trace__node{ position:relative; z-index:1; width:13px; height:13px; margin-top:2px; border-radius:var(--radius-full);
  background:var(--surface-panel); border:1.5px solid var(--border-strong); display:flex; align-items:center; justify-content:center; }
.asa-trace__node svg{ width:8px; height:8px; stroke:var(--text-on-signal); stroke-width:3; }
/* states */
.asa-trace__step--done .asa-trace__node{ background:var(--accent); border-color:var(--accent); }
.asa-trace__step--active .asa-trace__node{ border-color:var(--accent); }
.asa-trace__step--active .asa-trace__node::after{ content:""; width:6px; height:6px; border-radius:var(--radius-full); background:var(--accent); animation:asa-pulse 1.6s var(--ease-in-out) infinite; }
.asa-trace__step--pending .asa-trace__node{ opacity:.6; }

.asa-trace__body{ min-width:0; }
.asa-trace__label{ font-family:var(--font-display); font-size:var(--text-sm); font-weight:var(--weight-semibold); color:var(--text-strong); }
.asa-trace__step--pending .asa-trace__label{ color:var(--text-dim); font-weight:var(--weight-regular); }
.asa-trace__meta{ display:flex; flex-wrap:wrap; align-items:center; gap:5px 10px; margin-top:5px;
  font-family:var(--font-mono); font-size:var(--text-2xs); color:var(--text-dim); }
.asa-trace__chip{ display:inline-flex; align-items:center; gap:4px; padding:0; border:0;
  background:transparent; color:var(--text-muted); }
.asa-trace__chip--tool{ color:var(--accent-quiet); }
.asa-trace__chip--src{ color:var(--link); }
.asa-trace__chip--reuse{ color:var(--text-muted); }
.asa-trace__tok{ font-variant-numeric:tabular-nums; }
.asa-trace__time{ margin-left:auto; white-space:nowrap; }
`;

const Check = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden><path d="M2.5 6.5 L5 9 L9.5 3.5" /></svg>
);

/**
 * AgentTrace — the transparency log. A vertical list of the agent's steps with full visibility:
 * the tool used, sources touched, input/output tokens, timestamp, and any cross-platform reuse
 * ("reused from …"). Done steps get a check, the active step pulses, pending steps sit dim.
 */
export function AgentTrace({ steps = [], className = "", ...rest }) {
  useStyle("asa-trace-css", CSS);
  return (
    <div className={`asa-trace ${className}`} {...rest}>
      {steps.map((s, idx) => {
        const status = s.status || "done";
        return (
          <div className={`asa-trace__step asa-trace__step--${status}`} key={idx}>
            <div className="asa-trace__rail">
              <span className="asa-trace__node">{status === "done" && <Check />}</span>
            </div>
            <div className="asa-trace__body">
              <div className="asa-trace__label">{s.label}</div>
              {(s.tool || s.sources || s.inTok != null || s.outTok != null || s.reuse || s.at) && (
                <div className="asa-trace__meta">
                  {s.tool && <span className="asa-trace__chip asa-trace__chip--tool">{s.tool}</span>}
                  {(s.sources || []).map((src) => (
                    <span className="asa-trace__chip asa-trace__chip--src" key={src}>{src}</span>
                  ))}
                  {s.reuse && <span className="asa-trace__chip asa-trace__chip--reuse">reused · {s.reuse}</span>}
                  {s.inTok != null && <span className="asa-trace__tok">{s.inTok} in</span>}
                  {s.outTok != null && <span className="asa-trace__tok">{s.outTok} out</span>}
                  {s.at && <span className="asa-trace__time">{s.at}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
