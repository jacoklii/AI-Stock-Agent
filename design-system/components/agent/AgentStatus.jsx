import React from "react";

const { useState, useEffect, useRef } = React;

function useStyle(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const CSS = `
.asa-astat{ display:inline-flex; align-items:center; gap:10px; min-width:0; }
.asa-astat__dots{ display:inline-flex; align-items:center; gap:4px; flex:none; }
.asa-astat__dots i{ width:6px; height:6px; border-radius:var(--radius-full); background:var(--accent); animation:asa-typing 1.1s var(--ease-in-out) infinite; }
.asa-astat__dots i:nth-child(2){ animation-delay:.16s; }
.asa-astat__dots i:nth-child(3){ animation-delay:.32s; }
.asa-astat__clip{ position:relative; overflow:hidden; min-width:0; line-height:1.4; }
.asa-astat__line{ display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  font-family:var(--font-mono); font-size:var(--_size, var(--text-sm)); color:var(--text-strong); font-weight:var(--weight-medium); }
.asa-astat__line--in{ animation:asa-status-in var(--dur-slow) var(--ease-out); }
.asa-astat__line--out{ animation:asa-status-out var(--dur-base) var(--ease-in-out) forwards; }
`;

/**
 * AgentStatus — the signature live status line. Phrases rise up from below into place, hold,
 * then rise away as the next replaces them ("Thinking…" → "Researching TSMC capacity…" →
 * "Reading 6 sources…" → "Creating report…"). Leading typing-dots show it's working.
 */
export function AgentStatus({
  phrases = [],
  interval = 2600,
  loop = true,
  dots = true,
  size,
  className = "",
  ...rest
}) {
  useStyle("asa-astat-css", CSS);
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!phrases.length) return;
    if (!loop && i >= phrases.length - 1) return;
    timer.current = setTimeout(() => setLeaving(true), interval);
    return () => clearTimeout(timer.current);
  }, [i, phrases.length, interval, loop]);

  const onAnimEnd = () => {
    if (!leaving) return;
    setLeaving(false);
    setI((n) => (n + 1) % Math.max(1, phrases.length));
  };

  if (!phrases.length) return null;
  return (
    <span className={`asa-astat ${className}`} style={size ? { "--_size": size } : undefined} {...rest}>
      {dots && (
        <span className="asa-astat__dots" aria-hidden>
          <i /><i /><i />
        </span>
      )}
      <span className="asa-astat__clip">
        <span
          key={i}
          className={`asa-astat__line ${leaving ? "asa-astat__line--out" : "asa-astat__line--in"}`}
          onAnimationEnd={onAnimEnd}
        >
          {phrases[i]}
        </span>
      </span>
    </span>
  );
}
