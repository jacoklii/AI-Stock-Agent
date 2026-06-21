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
.asa-im{ display:flex; flex-direction:column; gap:15px; }
.asa-im__note{ font-family:var(--font-mono); font-size:10px; line-height:1.55; color:var(--text-dim); }
.asa-im__group{ display:flex; flex-direction:column; }
.asa-im__ghead{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); margin:0 0 6px; display:flex; align-items:center; gap:7px; }
.asa-im__ghead .n{ color:var(--text-muted); }
.asa-im__row{ display:flex; align-items:flex-start; gap:11px; padding:10px 0; border-bottom:1px solid var(--border-default); }
.asa-im__row:last-child{ border-bottom:0; }
.asa-im__glyph{ flex:none; font-family:var(--font-mono); font-size:12px; line-height:1.5; width:13px; text-align:center; color:var(--_ec); }
.asa-im__main{ flex:1; min-width:0; }
.asa-im__top{ display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.asa-im__name{ font-family:var(--font-sans); font-size:13px; font-weight:600; color:var(--text-strong); }
.asa-im__tkr{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
.asa-im__kind{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); }
.asa-im__because{ font-family:var(--font-serif); font-size:13px; line-height:1.55; color:var(--text-body); margin:5px 0 0; }
.asa-im__right{ flex:none; display:flex; flex-direction:column; align-items:flex-end; gap:5px; width:72px; padding-top:1px; }
.asa-im__effect{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:var(--_ec); font-weight:600; white-space:nowrap; }
.asa-im__prob{ display:flex; align-items:center; gap:6px; }
.asa-im__track{ width:34px; height:4px; border-radius:999px; background:var(--surface-inset); overflow:hidden; }
.asa-im__fill{ display:block; height:100%; background:var(--text-muted); border-radius:999px; }
.asa-im__pval{ font-family:var(--font-mono); font-size:10px; font-weight:600; color:var(--text-muted); font-variant-numeric:tabular-nums; }
`;

const EFFECT = {
  tailwind: { glyph: "▲", color: "var(--up-500)", word: "tailwind" },
  headwind: { glyph: "▼", color: "var(--down-500)", word: "headwind" },
  mixed:    { glyph: "▬", color: "var(--ink-3)", word: "mixed read" },
};

const GROUP_ORDER = ["industry", "stock", "fund"];
const GROUP_LABEL = { industry: "Industries", stock: "Stocks", fund: "Funds & ETFs" };

const DEFAULT_NOTE =
  "only the names and sectors most probable to move on these findings — read as patterns to weigh, not calls to make.";

/**
 * ImpactMap — the analytical read-through of a research task. Maps the findings to the stocks,
 * funds, and industries they most probably move: a direction of effect (tailwind / headwind /
 * mixed), a probability the change actually plays out, and the one-line reasoning that links the
 * finding to the effect (data + interpretation). Shows only the high-probability links so the
 * pattern is easy to see. It describes exposure — never a buy/sell/hold call.
 */
export function ImpactMap({
  items = [],
  note,
  groupByKind = true,
  className = "",
  ...rest
}) {
  useStyle("asa-im-css", CSS);
  if (!items || items.length === 0) return null;
  const noteText = note === undefined ? DEFAULT_NOTE : note;

  const groups = groupByKind
    ? GROUP_ORDER.map((k) => [k, items.filter((i) => i.kind === k)]).filter(([, v]) => v.length)
    : [[null, items]];

  const renderRow = (it, i) => {
    const eff = EFFECT[it.effect] || EFFECT.mixed;
    const p = Math.max(0, Math.min(1, it.probability == null ? 0 : it.probability));
    return (
      <div className="asa-im__row" style={{ "--_ec": eff.color }} key={(it.ticker || it.name || "") + i}>
        <span className="asa-im__glyph" aria-hidden>{eff.glyph}</span>
        <div className="asa-im__main">
          <div className="asa-im__top">
            <span className="asa-im__name">{it.name}</span>
            {it.ticker && <span className="asa-im__tkr">{it.ticker}</span>}
            {!groupByKind && it.kind && <span className="asa-im__kind">{it.kind}</span>}
          </div>
          {it.because && <p className="asa-im__because">{it.because}</p>}
        </div>
        <div className="asa-im__right">
          <span className="asa-im__effect">{eff.word}</span>
          <span className="asa-im__prob" title={`probability ${p.toFixed(2)}`}>
            <span className="asa-im__track"><span className="asa-im__fill" style={{ width: `${Math.round(p * 100)}%` }} /></span>
            <span className="asa-im__pval">{p.toFixed(2)}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`asa-im ${className}`} {...rest}>
      {noteText && <div className="asa-im__note">{noteText}</div>}
      {groups.map(([k, rows]) => (
        <div className="asa-im__group" key={k || "all"}>
          {k && <div className="asa-im__ghead">{GROUP_LABEL[k] || k}<span className="n">· {rows.length}</span></div>}
          {rows.map(renderRow)}
        </div>
      ))}
    </div>
  );
}
