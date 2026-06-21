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
.asa-spark{ display:inline-block; vertical-align:middle; line-height:0; }
.asa-spark__line{ fill:none; stroke:var(--_c); stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.asa-spark__area{ fill:url(#asa-spark-grad-var); opacity:.14; }
.asa-spark--draw .asa-spark__line{ stroke-dasharray:var(--_len); stroke-dashoffset:var(--_len); animation:asa-dash 1.1s var(--ease-out) forwards; }
.asa-spark__dot{ fill:var(--_c); }
.asa-spark__dot--live{ animation:asa-pulse 1.8s var(--ease-in-out) infinite; transform-origin:center; transform-box:fill-box; }
`;

/**
 * Sparkline — a compact phosphor price trace. Auto-colors up (green) / down (red) from the
 * series direction, optionally fills the area, draws itself in, and pulses the leading dot.
 */
export function Sparkline({
  data = [],
  width = 96,
  height = 28,
  color,
  area = true,
  draw = true,
  liveDot = true,
  className = "",
  ...rest
}) {
  useStyle("asa-spark-css", CSS);
  const pts = data.filter((n) => typeof n === "number" && isFinite(n));
  if (pts.length < 2) return <span className={`asa-spark ${className}`} style={{ width, height }} />;

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const stepX = w / (pts.length - 1);
  const xy = pts.map((v, i) => [pad + i * stepX, pad + h - ((v - min) / span) * h]);
  const d = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${d} L${xy[xy.length - 1][0].toFixed(1)},${height - pad} L${xy[0][0].toFixed(1)},${height - pad} Z`;
  const up = pts[pts.length - 1] >= pts[0];
  const c = color || (up ? "var(--up-500)" : "var(--down-500)");
  // approx path length for the draw-in dash
  let len = 0;
  for (let i = 1; i < xy.length; i++) len += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]);
  const gid = "asa-spark-grad-var";
  const last = xy[xy.length - 1];

  return (
    <span
      className={`asa-spark ${draw ? "asa-spark--draw" : ""} ${className}`}
      style={{ "--_c": c, "--_len": len.toFixed(0) }}
      {...rest}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="price trend">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path className="asa-spark__area" d={areaD} fill={`url(#${gid})`} />}
        <path className="asa-spark__line" d={d} />
        <circle className={`asa-spark__dot ${liveDot ? "asa-spark__dot--live" : ""}`} cx={last[0]} cy={last[1]} r="2" />
      </svg>
    </span>
  );
}
