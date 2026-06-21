import React from "react";
import { Sparkline } from "./Sparkline.jsx";

function useStyle(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const CSS = `
.asa-quote{ display:flex; align-items:center; gap:var(--space-3); font-family:var(--font-mono); }
.asa-quote__id{ display:flex; flex-direction:column; min-width:0; }
.asa-quote__sym{ font-weight:var(--weight-bold); font-size:var(--text-sm); color:var(--text-strong); letter-spacing:.02em; }
.asa-quote__name{ font-size:var(--text-2xs); color:var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
.asa-quote__nums{ margin-left:auto; display:flex; align-items:baseline; gap:var(--space-3); }
.asa-quote__price{ font-size:var(--text-sm); font-weight:var(--weight-semibold); color:var(--text-strong); font-variant-numeric:tabular-nums; }
.asa-quote__chg{ display:inline-flex; align-items:center; gap:4px; font-size:var(--text-xs); font-weight:var(--weight-semibold); font-variant-numeric:tabular-nums; min-width:64px; justify-content:flex-end; }
.asa-quote__chg--up{ color:var(--up-500); }
.asa-quote__chg--down{ color:var(--down-500); }
.asa-quote__chg--flat{ color:var(--flat-500); }
.asa-quote__arrow{ font-size:.85em; }
.asa-quote--flash-up{ animation:asa-flash-up 0.6s var(--ease-out); }
.asa-quote--flash-down{ animation:asa-flash-down 0.6s var(--ease-out); }
`;

function fmtPrice(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/**
 * PriceQuote — one instrument line: symbol + optional name, price, signed change, and an inline
 * sparkline. Up/down drives color and the ▲/▼ arrow. The whole row can flash on tick via `flash`.
 */
export function PriceQuote({
  symbol,
  name,
  price,
  changePct,
  series,
  showSpark = true,
  flash = null, // "up" | "down" | null
  className = "",
  ...rest
}) {
  useStyle("asa-quote-css", CSS);
  const dir = changePct == null ? "flat" : changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "▬";
  const flashCls = flash === "up" ? "asa-quote--flash-up" : flash === "down" ? "asa-quote--flash-down" : "";
  return (
    <div className={`asa-quote ${flashCls} ${className}`} {...rest}>
      <span className="asa-quote__id">
        <span className="asa-quote__sym">{symbol}</span>
        {name && <span className="asa-quote__name">{name}</span>}
      </span>
      {showSpark && series && series.length > 1 && (
        <Sparkline data={series} width={72} height={22} color={dir === "down" ? "var(--down-500)" : "var(--up-500)"} draw={false} />
      )}
      <span className="asa-quote__nums">
        <span className="asa-quote__price">{fmtPrice(price)}</span>
        <span className={`asa-quote__chg asa-quote__chg--${dir}`}>
          <span className="asa-quote__arrow" aria-hidden>{arrow}</span>
          {fmtPct(changePct)}
        </span>
      </span>
    </div>
  );
}
