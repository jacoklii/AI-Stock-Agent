/* @ds-bundle: {"format":3,"namespace":"AIStockAgentDesignSystem_ea6e23","components":[{"name":"AgentStatus","sourcePath":"components/agent/AgentStatus.jsx"},{"name":"AgentTrace","sourcePath":"components/agent/AgentTrace.jsx"},{"name":"BudgetGauge","sourcePath":"components/agent/BudgetGauge.jsx"},{"name":"ImpactMap","sourcePath":"components/agent/ImpactMap.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"PriceQuote","sourcePath":"components/market/PriceQuote.jsx"},{"name":"Sparkline","sourcePath":"components/market/Sparkline.jsx"},{"name":"StockDetail","sourcePath":"components/market/StockDetail.jsx"},{"name":"Badge","sourcePath":"components/status/Badge.jsx"},{"name":"TierBadge","sourcePath":"components/status/Badge.jsx"},{"name":"OriginBadge","sourcePath":"components/status/Badge.jsx"},{"name":"SignificanceMeter","sourcePath":"components/status/SignificanceMeter.jsx"},{"name":"StatusPill","sourcePath":"components/status/StatusPill.jsx"},{"name":"Panel","sourcePath":"components/surfaces/Panel.jsx"}],"sourceHashes":{"components/agent/AgentStatus.jsx":"067904a68845","components/agent/AgentTrace.jsx":"8b1a1b344e83","components/agent/BudgetGauge.jsx":"c1a79bbe8dff","components/agent/ImpactMap.jsx":"726e051ec4ee","components/buttons/Button.jsx":"bdd26d18b062","components/market/PriceQuote.jsx":"d059c71f3982","components/market/Sparkline.jsx":"5f03718c30ea","components/market/StockDetail.jsx":"b323ff91cd3d","components/status/Badge.jsx":"fcf18b050a3a","components/status/SignificanceMeter.jsx":"d10247db4e67","components/status/StatusPill.jsx":"4efba4010843","components/surfaces/Panel.jsx":"a90583048f74","ui_kits/terminal/ContextRail.jsx":"b25117d76ee0","ui_kits/terminal/Desk.jsx":"7834b138795f","ui_kits/terminal/DetailPanel.jsx":"d16d3e8be063","ui_kits/terminal/IndustryDetail.jsx":"a51274bcba99","ui_kits/terminal/LeftPanel.jsx":"ef4f9234c2eb","ui_kits/terminal/LiveResearch.jsx":"e0b74d0697c5","ui_kits/terminal/ResearchList.jsx":"bdab14c3a1c8","ui_kits/terminal/Settings.jsx":"9cee437e544d","ui_kits/terminal/TodayFeed.jsx":"d26907e1fa03","ui_kits/terminal/Tweaks.jsx":"08ec40ffc4f1","ui_kits/terminal/WorldBoard.jsx":"af063fc70e12","ui_kits/terminal/data.js":"98c411e056ce","ui_kits/terminal/kit.jsx":"c769caa76631","ui_kits/terminal/tweaks-panel.jsx":"6591467622ed"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AIStockAgentDesignSystem_ea6e23 = window.AIStockAgentDesignSystem_ea6e23 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/agent/AgentStatus.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useRef
} = React;
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
function AgentStatus({
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
    setI(n => (n + 1) % Math.max(1, phrases.length));
  };
  if (!phrases.length) return null;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `asa-astat ${className}`,
    style: size ? {
      "--_size": size
    } : undefined
  }, rest), dots && /*#__PURE__*/React.createElement("span", {
    className: "asa-astat__dots",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", {
    className: "asa-astat__clip"
  }, /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `asa-astat__line ${leaving ? "asa-astat__line--out" : "asa-astat__line--in"}`,
    onAnimationEnd: onAnimEnd
  }, phrases[i])));
}
Object.assign(__ds_scope, { AgentStatus });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/AgentStatus.jsx", error: String((e && e.message) || e) }); }

// components/agent/AgentTrace.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
const Check = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 12 12",
  fill: "none",
  "aria-hidden": true
}, /*#__PURE__*/React.createElement("path", {
  d: "M2.5 6.5 L5 9 L9.5 3.5"
}));

/**
 * AgentTrace — the transparency log. A vertical list of the agent's steps with full visibility:
 * the tool used, sources touched, input/output tokens, timestamp, and any cross-platform reuse
 * ("reused from …"). Done steps get a check, the active step pulses, pending steps sit dim.
 */
function AgentTrace({
  steps = [],
  className = "",
  ...rest
}) {
  useStyle("asa-trace-css", CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `asa-trace ${className}`
  }, rest), steps.map((s, idx) => {
    const status = s.status || "done";
    return /*#__PURE__*/React.createElement("div", {
      className: `asa-trace__step asa-trace__step--${status}`,
      key: idx
    }, /*#__PURE__*/React.createElement("div", {
      className: "asa-trace__rail"
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__node"
    }, status === "done" && /*#__PURE__*/React.createElement(Check, null))), /*#__PURE__*/React.createElement("div", {
      className: "asa-trace__body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "asa-trace__label"
    }, s.label), (s.tool || s.sources || s.inTok != null || s.outTok != null || s.reuse || s.at) && /*#__PURE__*/React.createElement("div", {
      className: "asa-trace__meta"
    }, s.tool && /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__chip asa-trace__chip--tool"
    }, s.tool), (s.sources || []).map(src => /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__chip asa-trace__chip--src",
      key: src
    }, src)), s.reuse && /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__chip asa-trace__chip--reuse"
    }, "reused \xB7 ", s.reuse), s.inTok != null && /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__tok"
    }, s.inTok, " in"), s.outTok != null && /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__tok"
    }, s.outTok, " out"), s.at && /*#__PURE__*/React.createElement("span", {
      className: "asa-trace__time"
    }, s.at))));
  }));
}
Object.assign(__ds_scope, { AgentTrace });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/AgentTrace.jsx", error: String((e && e.message) || e) }); }

// components/agent/BudgetGauge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useStyle(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}
const CSS = `
.asa-gauge{ display:flex; flex-direction:column; gap:var(--space-2); font-family:var(--font-mono); }
.asa-gauge__top{ display:flex; align-items:baseline; justify-content:space-between; gap:var(--space-2); }
.asa-gauge__label{ font-size:var(--text-2xs); text-transform:uppercase; letter-spacing:var(--tracking-caps); color:var(--text-muted); }
.asa-gauge__val{ font-size:var(--text-2xs); color:var(--text-dim); font-variant-numeric:tabular-nums; }
.asa-gauge__val b{ color:var(--_tone); font-weight:var(--weight-bold); }
.asa-gauge__segs{ display:flex; gap:2px; }
.asa-gauge__seg{ flex:1; height:8px; border-radius:1px; background:var(--surface-inset); transition:background var(--dur-base) var(--ease-out); }
.asa-gauge__seg--on{ background:var(--_tone); }
.asa-gauge__seg--edge{ background:var(--_tone); animation:asa-pulse 1.8s var(--ease-in-out) infinite; }
.asa-gauge--compact .asa-gauge__seg{ height:6px; }
`;
function fmtTokens(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * BudgetGauge — the agent's weekly token self-pacing limit as a segmented terminal bar. Tone
 * shifts green → amber → red as spend approaches the cap; the leading lit segment pulses.
 */
function BudgetGauge({
  spent = 0,
  cap = null,
  segments = 28,
  compact = false,
  className = "",
  ...rest
}) {
  useStyle("asa-gauge-css", CSS);
  const ratio = cap ? Math.min(1, spent / cap) : 0;
  const tone = ratio > 0.9 ? "var(--red-500)" : ratio > 0.7 ? "var(--amber-500)" : "var(--signal-500)";
  const lit = cap ? Math.round(ratio * segments) : 0;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `asa-gauge ${compact ? "asa-gauge--compact" : ""} ${className}`,
    style: {
      "--_tone": tone
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "asa-gauge__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-gauge__label"
  }, "Weekly budget"), /*#__PURE__*/React.createElement("span", {
    className: "asa-gauge__val"
  }, /*#__PURE__*/React.createElement("b", null, fmtTokens(spent)), cap != null ? ` / ${fmtTokens(cap)}` : " · uncapped")), /*#__PURE__*/React.createElement("div", {
    className: "asa-gauge__segs",
    "aria-hidden": true
  }, Array.from({
    length: segments
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `asa-gauge__seg ${i < lit ? "asa-gauge__seg--on" : ""} ${i === lit - 1 ? "asa-gauge__seg--edge" : ""}`
  }))));
}
Object.assign(__ds_scope, { BudgetGauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/BudgetGauge.jsx", error: String((e && e.message) || e) }); }

// components/agent/ImpactMap.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  tailwind: {
    glyph: "▲",
    color: "var(--up-500)",
    word: "tailwind"
  },
  headwind: {
    glyph: "▼",
    color: "var(--down-500)",
    word: "headwind"
  },
  mixed: {
    glyph: "▬",
    color: "var(--ink-3)",
    word: "mixed read"
  }
};
const GROUP_ORDER = ["industry", "stock", "fund"];
const GROUP_LABEL = {
  industry: "Industries",
  stock: "Stocks",
  fund: "Funds & ETFs"
};
const DEFAULT_NOTE = "only the names and sectors most probable to move on these findings — read as patterns to weigh, not calls to make.";

/**
 * ImpactMap — the analytical read-through of a research task. Maps the findings to the stocks,
 * funds, and industries they most probably move: a direction of effect (tailwind / headwind /
 * mixed), a probability the change actually plays out, and the one-line reasoning that links the
 * finding to the effect (data + interpretation). Shows only the high-probability links so the
 * pattern is easy to see. It describes exposure — never a buy/sell/hold call.
 */
function ImpactMap({
  items = [],
  note,
  groupByKind = true,
  className = "",
  ...rest
}) {
  useStyle("asa-im-css", CSS);
  if (!items || items.length === 0) return null;
  const noteText = note === undefined ? DEFAULT_NOTE : note;
  const groups = groupByKind ? GROUP_ORDER.map(k => [k, items.filter(i => i.kind === k)]).filter(([, v]) => v.length) : [[null, items]];
  const renderRow = (it, i) => {
    const eff = EFFECT[it.effect] || EFFECT.mixed;
    const p = Math.max(0, Math.min(1, it.probability == null ? 0 : it.probability));
    return /*#__PURE__*/React.createElement("div", {
      className: "asa-im__row",
      style: {
        "--_ec": eff.color
      },
      key: (it.ticker || it.name || "") + i
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-im__glyph",
      "aria-hidden": true
    }, eff.glyph), /*#__PURE__*/React.createElement("div", {
      className: "asa-im__main"
    }, /*#__PURE__*/React.createElement("div", {
      className: "asa-im__top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-im__name"
    }, it.name), it.ticker && /*#__PURE__*/React.createElement("span", {
      className: "asa-im__tkr"
    }, it.ticker), !groupByKind && it.kind && /*#__PURE__*/React.createElement("span", {
      className: "asa-im__kind"
    }, it.kind)), it.because && /*#__PURE__*/React.createElement("p", {
      className: "asa-im__because"
    }, it.because)), /*#__PURE__*/React.createElement("div", {
      className: "asa-im__right"
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-im__effect"
    }, eff.word), /*#__PURE__*/React.createElement("span", {
      className: "asa-im__prob",
      title: `probability ${p.toFixed(2)}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-im__track"
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-im__fill",
      style: {
        width: `${Math.round(p * 100)}%`
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "asa-im__pval"
    }, p.toFixed(2)))));
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `asa-im ${className}`
  }, rest), noteText && /*#__PURE__*/React.createElement("div", {
    className: "asa-im__note"
  }, noteText), groups.map(([k, rows]) => /*#__PURE__*/React.createElement("div", {
    className: "asa-im__group",
    key: k || "all"
  }, k && /*#__PURE__*/React.createElement("div", {
    className: "asa-im__ghead"
  }, GROUP_LABEL[k] || k, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "\xB7 ", rows.length)), rows.map(renderRow))));
}
Object.assign(__ds_scope, { ImpactMap });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/agent/ImpactMap.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Button({
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
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    className: `asa-btn asa-btn--${variant} asa-btn--${size} ${className}`
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    className: "asa-btn__icon"
  }, icon), children, iconRight && /*#__PURE__*/React.createElement("span", {
    className: "asa-btn__icon"
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/market/Sparkline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Sparkline({
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
  const pts = data.filter(n => typeof n === "number" && isFinite(n));
  if (pts.length < 2) return /*#__PURE__*/React.createElement("span", {
    className: `asa-spark ${className}`,
    style: {
      width,
      height
    }
  });
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const stepX = w / (pts.length - 1);
  const xy = pts.map((v, i) => [pad + i * stepX, pad + h - (v - min) / span * h]);
  const d = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${d} L${xy[xy.length - 1][0].toFixed(1)},${height - pad} L${xy[0][0].toFixed(1)},${height - pad} Z`;
  const up = pts[pts.length - 1] >= pts[0];
  const c = color || (up ? "var(--up-500)" : "var(--down-500)");
  // approx path length for the draw-in dash
  let len = 0;
  for (let i = 1; i < xy.length; i++) len += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]);
  const gid = "asa-spark-grad-var";
  const last = xy[xy.length - 1];
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `asa-spark ${draw ? "asa-spark--draw" : ""} ${className}`,
    style: {
      "--_c": c,
      "--_len": len.toFixed(0)
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": "price trend"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: c
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: c,
    stopOpacity: "0"
  }))), area && /*#__PURE__*/React.createElement("path", {
    className: "asa-spark__area",
    d: areaD,
    fill: `url(#${gid})`
  }), /*#__PURE__*/React.createElement("path", {
    className: "asa-spark__line",
    d: d
  }), /*#__PURE__*/React.createElement("circle", {
    className: `asa-spark__dot ${liveDot ? "asa-spark__dot--live" : ""}`,
    cx: last[0],
    cy: last[1],
    r: "2"
  })));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/market/PriceQuote.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function fmtPct(n) {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/**
 * PriceQuote — one instrument line: symbol + optional name, price, signed change, and an inline
 * sparkline. Up/down drives color and the ▲/▼ arrow. The whole row can flash on tick via `flash`.
 */
function PriceQuote({
  symbol,
  name,
  price,
  changePct,
  series,
  showSpark = true,
  flash = null,
  // "up" | "down" | null
  className = "",
  ...rest
}) {
  useStyle("asa-quote-css", CSS);
  const dir = changePct == null ? "flat" : changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "▬";
  const flashCls = flash === "up" ? "asa-quote--flash-up" : flash === "down" ? "asa-quote--flash-down" : "";
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `asa-quote ${flashCls} ${className}`
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "asa-quote__id"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-quote__sym"
  }, symbol), name && /*#__PURE__*/React.createElement("span", {
    className: "asa-quote__name"
  }, name)), showSpark && series && series.length > 1 && /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    data: series,
    width: 72,
    height: 22,
    color: dir === "down" ? "var(--down-500)" : "var(--up-500)",
    draw: false
  }), /*#__PURE__*/React.createElement("span", {
    className: "asa-quote__nums"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-quote__price"
  }, fmtPrice(price)), /*#__PURE__*/React.createElement("span", {
    className: `asa-quote__chg asa-quote__chg--${dir}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-quote__arrow",
    "aria-hidden": true
  }, arrow), fmtPct(changePct))));
}
Object.assign(__ds_scope, { PriceQuote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/PriceQuote.jsx", error: String((e && e.message) || e) }); }

// components/status/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  neutral: {
    fg: "var(--text-muted)",
    bg: "var(--surface-hover)",
    bd: "var(--border-default)"
  },
  signal: {
    fg: "var(--signal-400)",
    bg: "var(--up-bg)",
    bd: "color-mix(in oklch, var(--signal-500), transparent 60%)"
  },
  amber: {
    fg: "var(--amber-500)",
    bg: "var(--amber-bg)",
    bd: "color-mix(in oklch, var(--amber-500), transparent 60%)"
  },
  blue: {
    fg: "var(--link)",
    bg: "transparent",
    bd: "transparent"
  },
  clear: {
    fg: "var(--text-muted)",
    bg: "transparent",
    bd: "var(--border-strong)"
  },
  red: {
    fg: "var(--down-500)",
    bg: "var(--red-bg)",
    bd: "color-mix(in oklch, var(--red-500), transparent 55%)"
  }
};

/**
 * Badge — a compact label/tag. Carries coverage tiers, research origin, and any short marker.
 * Pick a `tone`; set `dot` for a leading status dot, `caps` for uppercase tracking.
 */
function Badge({
  tone = "neutral",
  dot = false,
  caps = false,
  className = "",
  children,
  ...rest
}) {
  useStyle("asa-badge-css", CSS);
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `asa-badge ${caps ? "asa-badge--caps" : ""} ${className}`,
    style: {
      "--_fg": t.fg,
      "--_bg": t.bg,
      "--_bd": t.bd
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "asa-badge__dot",
    "aria-hidden": true
  }), children);
}

/* Coverage-tier helper — maps the four ARCHITECTURE.md tiers to badge tones. */
const TIER_TONE = {
  watchlist: "signal",
  industry_critical: "amber",
  discovered: "neutral",
  archived: "neutral"
};
function TierBadge({
  tier = "discovered",
  ...rest
}) {
  return /*#__PURE__*/React.createElement(Badge, _extends({
    tone: TIER_TONE[tier] || "neutral",
    caps: true
  }, rest), tier);
}

/* Origin helper — who opened a research session. */
function OriginBadge({
  initiatedBy
}) {
  if (initiatedBy !== "user" && initiatedBy !== "schedule") return null;
  const isUser = initiatedBy === "user";
  return /*#__PURE__*/React.createElement(Badge, {
    tone: isUser ? "clear" : "amber",
    dot: true
  }, isUser ? "requested" : "autonomous");
}
Object.assign(__ds_scope, { Badge, TierBadge, OriginBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Badge.jsx", error: String((e && e.message) || e) }); }

// components/status/SignificanceMeter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function SignificanceMeter({
  value = 0,
  showLabel = false,
  className = "",
  ...rest
}) {
  useStyle("asa-sig-css", CSS);
  const v = Math.max(0, Math.min(1, value));
  const color = v >= 0.7 ? "var(--red-500)" : v >= 0.4 ? "var(--amber-500)" : "var(--text-muted)";
  const lit = Math.round(v * 5);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `asa-sig ${className}`,
    style: {
      "--_c": color
    },
    title: `significance ${v.toFixed(2)}`
  }, rest), showLabel && /*#__PURE__*/React.createElement("span", {
    className: "asa-sig__label"
  }, "sig"), /*#__PURE__*/React.createElement("span", {
    className: "asa-sig__bars",
    "aria-hidden": true
  }, HEIGHTS.map((h, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `asa-sig__bar ${i < lit ? "asa-sig__bar--on" : ""}`,
    style: {
      height: `${h}px`
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "asa-sig__val"
  }, v.toFixed(2)));
}
Object.assign(__ds_scope, { SignificanceMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/SignificanceMeter.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  researching: {
    fg: "var(--status-running)",
    bg: "var(--up-bg)",
    bd: "color-mix(in oklch, var(--signal-500), transparent 60%)",
    live: true
  },
  running: {
    fg: "var(--status-running)",
    bg: "var(--up-bg)",
    bd: "color-mix(in oklch, var(--signal-500), transparent 60%)",
    live: true
  },
  open: {
    fg: "var(--status-open)",
    bg: "var(--up-bg)",
    bd: "color-mix(in oklch, var(--signal-500), transparent 60%)",
    live: true
  },
  briefed: {
    fg: "var(--status-success)",
    bg: "var(--up-bg)",
    bd: "color-mix(in oklch, var(--signal-500), transparent 60%)",
    live: false
  },
  succeeded: {
    fg: "var(--status-success)",
    bg: "var(--up-bg)",
    bd: "color-mix(in oklch, var(--signal-500), transparent 60%)",
    live: false
  },
  // scraper (cheap sensor net) — swept & stored, not researched by the agent
  swept: {
    fg: "var(--text-muted)",
    bg: "var(--surface-hover)",
    bd: "var(--border-default)",
    live: false
  },
  closed: {
    fg: "var(--text-muted)",
    bg: "var(--surface-hover)",
    bd: "var(--border-default)",
    live: false
  },
  failed: {
    fg: "var(--status-failed)",
    bg: "var(--red-bg)",
    bd: "color-mix(in oklch, var(--red-500), transparent 55%)",
    live: false
  },
  queued: {
    fg: "var(--text-dim)",
    bg: "transparent",
    bd: "var(--border-default)",
    live: false
  },
  pending: {
    fg: "var(--text-dim)",
    bg: "transparent",
    bd: "var(--border-default)",
    live: false
  }
};

/**
 * StatusPill — research/task lifecycle marker. Live states (researching, running, open) pulse
 * their dot. `swept` marks what the cheap scraper stored vs. what the agent actually researched.
 */
function StatusPill({
  status = "pending",
  className = "",
  ...rest
}) {
  useStyle("asa-status-css", CSS);
  const m = MAP[status] || MAP.pending;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `asa-status ${m.live ? "asa-status--live" : ""} ${className}`,
    style: {
      "--_fg": m.fg,
      "--_bg": m.bg,
      "--_bd": m.bd
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "asa-status__dot",
    "aria-hidden": true
  }), status);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Panel({
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
  return /*#__PURE__*/React.createElement("section", _extends({
    className: cls
  }, rest), (title || aside) && /*#__PURE__*/React.createElement("header", {
    className: "asa-panel__head"
  }, title && /*#__PURE__*/React.createElement("span", {
    className: "asa-panel__title"
  }, title), aside && /*#__PURE__*/React.createElement("span", {
    className: "asa-panel__aside"
  }, aside)), /*#__PURE__*/React.createElement("div", {
    className: `asa-panel__body ${noPad ? "asa-panel__body--pad0" : ""}`
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Panel.jsx", error: String((e && e.message) || e) }); }

// components/market/StockDetail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useStyle(id, css) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}
const CSS = `
.asa-sd{ display:flex; flex-direction:column; height:100%; }
@media (prefers-reduced-motion: no-preference){ .asa-sd{ animation:asa-rise-in var(--dur-base) var(--ease-out); } }

.asa-sd__head{ position:sticky; top:0; z-index:2; background:var(--surface-raised);
  border-bottom:1px solid var(--border-default); padding:13px 16px; }
.asa-sd__htop{ display:flex; align-items:flex-start; gap:10px; }
.asa-sd__id{ flex:1; min-width:0; }
.asa-sd__eyebrow{ display:flex; align-items:center; gap:8px; margin-bottom:7px; }
.asa-sd__sym{ font-family:var(--font-mono); font-size:21px; font-weight:700; color:var(--text-strong); letter-spacing:.01em; }
.asa-sd__name{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted); margin-top:2px; }
.asa-sd__close{ flex:none; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;
  color:var(--text-muted); border:1px solid var(--border-default); border-radius:var(--radius-md); background:var(--surface-panel); }
.asa-sd__close:hover{ color:var(--text-strong); border-color:var(--border-strong); }

.asa-sd__quote{ display:flex; align-items:baseline; gap:12px; margin-top:13px; }
.asa-sd__price{ font-family:var(--font-mono); font-size:24px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }
.asa-sd__chg{ font-family:var(--font-mono); font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; display:inline-flex; align-items:center; gap:4px; }
.asa-sd__chg--up{ color:var(--up-500); }
.asa-sd__chg--down{ color:var(--down-500); }
.asa-sd__chg--flat{ color:var(--flat-500); }
.asa-sd__spark{ margin-left:auto; }
.asa-sd__asof{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:11px; display:flex; align-items:center; gap:6px; }
.asa-sd__asof .dot{ width:5px; height:5px; border-radius:999px; background:var(--accent); }

.asa-sd__body{ flex:1; min-height:0; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:14px; }
.asa-sd__body > *{ flex:none; }
.asa-sd--compact .asa-sd__body{ gap:10px; }

.asa-sd__prov{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }

/* Agent summary — the synthesis baked in at the top */
.asa-sd__summary{ font-family:var(--font-serif); font-size:14px; line-height:1.62; color:var(--text-body); margin:0; }
.asa-sd__remembers{ font-family:var(--font-serif); font-size:12.5px; line-height:1.55; color:var(--text-muted); margin:12px 0 0; padding-top:11px; border-top:1px solid var(--border-default); }
.asa-sd__remembers b{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); font-weight:700; margin-right:7px; }

/* Group divider — Qualitative vs. Quantitative */
.asa-sd__group{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:var(--accent-quiet);
  padding:5px 0 7px; border-bottom:1px solid var(--border-strong); margin:6px 0 0; display:flex; align-items:baseline; gap:8px; }
.asa-sd__groupsub{ font-family:var(--font-sans); font-size:11px; text-transform:none; letter-spacing:0; color:var(--text-dim); font-weight:400; }

/* Business (qualitative prose) */
.asa-sd__business{ font-family:var(--font-serif); font-size:14px; line-height:1.6; color:var(--text-body); margin:0; }

/* Sentiment */
.asa-sd__senthead{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:11px; }
.asa-sd__sentval{ font-family:var(--font-mono); font-size:17px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--_sc); }
.asa-sd__sentlabel{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:var(--_sc); }
.asa-sd__track{ position:relative; height:6px; border-radius:999px; background:var(--surface-inset); margin:4px 0 6px; }
.asa-sd__zero{ position:absolute; top:-3px; bottom:-3px; left:50%; width:1px; background:var(--border-strong); }
.asa-sd__marker{ position:absolute; top:50%; width:11px; height:11px; border-radius:999px; background:var(--_sc);
  border:2px solid var(--surface-panel); transform:translate(-50%,-50%); box-shadow:0 1px 2px oklch(0.4 0.02 70 / 0.18);
  transition:left var(--dur-slow) var(--ease-out); }
.asa-sd__scale{ display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
.asa-sd__sentread{ font-family:var(--font-serif); font-size:14px; line-height:1.6; color:var(--text-body); margin:12px 0 0; }
.asa-sd__senttrend{ display:flex; align-items:center; gap:9px; margin-top:11px; }
.asa-sd__senttrend .lbl{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }

/* Financials table */
.asa-sd__fin{ display:flex; flex-direction:column; }
.asa-sd__finrow{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid var(--border-default); }
.asa-sd__finrow:last-child{ border-bottom:0; }
.asa-sd__fink{ font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
.asa-sd__finv{ font-family:var(--font-mono); font-size:13px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }
.asa-sd__finv--up{ color:var(--up-500); }
.asa-sd__finv--down{ color:var(--down-500); }
.asa-sd__finnote{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-left:7px; }

/* Industry */
.asa-sd__where{ display:flex; flex-direction:column; gap:5px; margin-bottom:13px; }
.asa-sd__wrow{ display:flex; align-items:baseline; gap:8px; }
.asa-sd__wk{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); min-width:64px; }
.asa-sd__wv{ font-family:var(--font-sans); font-size:13px; color:var(--text-body); }
.asa-sd__subhead{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); margin:13px 0 8px; }
.asa-sd__peers{ display:flex; flex-direction:column; }
.asa-sd__peer{ display:flex; align-items:baseline; gap:10px; padding:6px 0; border-bottom:1px solid var(--border-default); }
.asa-sd__peer:last-child{ border-bottom:0; }
.asa-sd__psym{ font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--text-strong); min-width:52px; }
.asa-sd__pname{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.asa-sd__pchg{ font-family:var(--font-mono); font-size:11px; font-weight:600; font-variant-numeric:tabular-nums; }
.asa-sd__chain{ display:flex; flex-wrap:wrap; gap:6px; }
.asa-sd__cchip{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); }
.asa-sd__cchip:not(:last-child)::after{ content:"·"; margin-left:6px; color:var(--text-dim); }

/* Findings — plain list, no significance number */
.asa-sd__feed{ display:flex; flex-direction:column; }
.asa-sd__fitem{ display:flex; align-items:flex-start; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }
.asa-sd__fitem:last-child{ border-bottom:0; }
.asa-sd__fitem:hover .asa-sd__ftitle{ color:var(--accent-quiet); }
.asa-sd__fmain{ flex:1; min-width:0; }
.asa-sd__ftitle{ font-family:var(--font-sans); font-size:13px; color:var(--text-strong); line-height:1.35; }
.asa-sd__fmeta{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; }
.asa-sd__fmeta .dom{ color:var(--link); }
.asa-sd__fat{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); flex:none; padding-top:2px; white-space:nowrap; }

/* Memory */
.asa-sd__mem{ font-family:var(--font-serif); font-size:14px; line-height:1.6; color:var(--text-body); margin:0; }

/* Actions */
.asa-sd__actions{ display:flex; flex-wrap:wrap; gap:8px; }

/* Skeleton (load-from-store state) */
.asa-sd__sk{ background:var(--surface-inset); border-radius:var(--radius-sm); height:11px; }
@media (prefers-reduced-motion: no-preference){ .asa-sd__sk{ animation:asa-pulse 1.5s var(--ease-in-out) infinite; } }
.asa-sd__skstack{ display:flex; flex-direction:column; gap:9px; }
`;
function fmtPrice(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function fmtPct(n) {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function dirOf(n) {
  return n == null ? "flat" : n > 0 ? "up" : n < 0 ? "down" : "flat";
}
function sentColor(v) {
  if (v >= 0.1) return "var(--up-500)";
  if (v <= -0.1) return "var(--down-500)";
  return "var(--ink-3)";
}
function sentWord(v) {
  if (v >= 0.35) return "constructive";
  if (v >= 0.1) return "leaning positive";
  if (v <= -0.35) return "bearish";
  if (v <= -0.1) return "leaning negative";
  return "mixed";
}
function Sk({
  w = "100%",
  h = 11
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__sk",
    style: {
      width: w,
      height: h,
      display: "block"
    }
  });
}

/**
 * StockDetail — the watchlist drill-down. Click a Following name and this fills the panel. The
 * agent's summary leads (its synthesis, the reports behind it, and what it remembers about the
 * name), then the record splits into two clear halves: QUALITATIVE — what the business is, where
 * it sits in its industry, and the sentiment read — and QUANTITATIVE — financials, metrics and
 * ratios. Sections carry "as of …" freshness stamps (the record is pulled from the store) and a
 * calm skeleton while loading. Reads & observations only — never a buy/sell/hold or valuation call.
 */
function StockDetail({
  stock,
  loading = false,
  density = "comfortable",
  showProvenance = true,
  onClose,
  onResearch,
  onSetAlert,
  onRemove,
  onOpenSource,
  className = "",
  ...rest
}) {
  useStyle("asa-sd-css", CSS);
  if (!stock) return null;
  const s = stock;
  const qdir = dirOf(s.changePct);
  const arrow = qdir === "up" ? "▲" : qdir === "down" ? "▼" : "▬";
  const sent = s.sentiment || {};
  const sc = sentColor(sent.value ?? 0);
  const prov = t => showProvenance && t ? /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__prov"
  }, "as of ", t) : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `asa-sd ${density === "compact" ? "asa-sd--compact" : ""} ${className}`
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__htop"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__id"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__sym"
  }, s.ticker), s.tier && /*#__PURE__*/React.createElement(__ds_scope.TierBadge, {
    tier: s.tier
  })), s.name && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__name"
  }, s.name, s.exchange ? ` · ${s.exchange}` : "")), onClose && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__close",
    onClick: onClose,
    title: "Close"
  }, window.Icon ? /*#__PURE__*/React.createElement(window.Icon, {
    name: "x",
    size: 15
  }) : "✕")), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__quote"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__price"
  }, fmtPrice(s.price)), /*#__PURE__*/React.createElement("span", {
    className: `asa-sd__chg asa-sd__chg--${qdir}`
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      fontSize: ".85em"
    }
  }, arrow), fmtPct(s.changePct)), s.series && s.series.length > 1 && /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__spark"
  }, /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    data: s.series,
    width: 104,
    height: 30,
    draw: false,
    liveDot: false
  }))), s.quoteAt && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__asof"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "live quote \xB7 ", s.quoteAt)), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__body"
  }, /*#__PURE__*/React.createElement(__ds_scope.Panel, {
    title: "Agent summary",
    aside: prov(s.summaryAsOf),
    live: true
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__skstack"
  }, /*#__PURE__*/React.createElement(Sk, null), /*#__PURE__*/React.createElement(Sk, {
    w: "90%"
  }), /*#__PURE__*/React.createElement(Sk, {
    w: "70%"
  })) : /*#__PURE__*/React.createElement("div", null, s.summary && /*#__PURE__*/React.createElement("p", {
    className: "asa-sd__summary"
  }, s.summary), s.findings && s.findings.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__feed",
    style: {
      marginTop: s.summary ? 13 : 0
    }
  }, s.findings.map((f, i) => /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__fitem",
    key: i,
    onClick: () => onOpenSource && onOpenSource(f)
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__fmain"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__ftitle"
  }, f.title), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__fmeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dom"
  }, f.domain))), /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__fat"
  }, f.at)))), s.memory && /*#__PURE__*/React.createElement("p", {
    className: "asa-sd__remembers"
  }, /*#__PURE__*/React.createElement("b", null, "Remembers"), s.memory))), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__group"
  }, "Qualitative", /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__groupsub"
  }, "the business, its industry, the sentiment")), (loading || s.business) && /*#__PURE__*/React.createElement(__ds_scope.Panel, {
    title: "The business",
    aside: prov(s.businessAsOf)
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__skstack"
  }, /*#__PURE__*/React.createElement(Sk, null), /*#__PURE__*/React.createElement(Sk, {
    w: "80%"
  })) : /*#__PURE__*/React.createElement("p", {
    className: "asa-sd__business"
  }, s.business)), (loading || s.industry) && /*#__PURE__*/React.createElement(__ds_scope.Panel, {
    title: "Industry & position",
    aside: prov(s.industry && s.industry.asOf)
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__skstack"
  }, /*#__PURE__*/React.createElement(Sk, {
    w: "60%"
  }), /*#__PURE__*/React.createElement(Sk, {
    w: "45%"
  }), /*#__PURE__*/React.createElement(Sk, null)) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__where"
  }, s.industry.sector && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__wrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__wk"
  }, "sector"), /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__wv"
  }, s.industry.sector)), s.industry.subIndustry && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__wrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__wk"
  }, "sub-ind."), /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__wv"
  }, s.industry.subIndustry)), s.industry.position && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__wrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__wk"
  }, "position"), /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__wv"
  }, s.industry.position))), s.industry.peers && s.industry.peers.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__subhead"
  }, "Peers"), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__peers"
  }, s.industry.peers.map(p => {
    const pd = dirOf(p.changePct);
    return /*#__PURE__*/React.createElement("div", {
      className: "asa-sd__peer",
      key: p.ticker
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-sd__psym"
    }, p.ticker), /*#__PURE__*/React.createElement("span", {
      className: "asa-sd__pname"
    }, p.name), /*#__PURE__*/React.createElement("span", {
      className: `asa-sd__pchg asa-sd__chg--${pd}`
    }, fmtPct(p.changePct)));
  }))), s.industry.supplyChain && s.industry.supplyChain.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__subhead"
  }, "Supply-chain neighbors"), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__chain"
  }, s.industry.supplyChain.map(c => /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__cchip",
    key: c
  }, c)))))), /*#__PURE__*/React.createElement(__ds_scope.Panel, {
    title: "Sentiment",
    aside: prov(sent.asOf)
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__skstack"
  }, /*#__PURE__*/React.createElement(Sk, {
    w: "40%",
    h: 16
  }), /*#__PURE__*/React.createElement(Sk, null), /*#__PURE__*/React.createElement(Sk, {
    w: "70%"
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      "--_sc": sc
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__senthead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__sentlabel"
  }, sentWord(sent.value ?? 0)), sent.sources != null && /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__prov"
  }, sent.sources, " sources")), sent.read && /*#__PURE__*/React.createElement("p", {
    className: "asa-sd__sentread"
  }, sent.read), sent.trend && sent.trend.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__senttrend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "tone, last 30 days"), /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    data: sent.trend,
    width: 120,
    height: 24,
    color: sc,
    area: true,
    draw: false,
    liveDot: false
  })))), /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__group"
  }, "Quantitative", /*#__PURE__*/React.createElement("span", {
    className: "asa-sd__groupsub"
  }, "financials, metrics, ratios")), (loading || s.financials && s.financials.length > 0) && /*#__PURE__*/React.createElement(__ds_scope.Panel, {
    title: "Financials",
    aside: prov(s.financialsAsOf)
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__skstack"
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement(Sk, {
    key: i
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__fin"
  }, s.financials.map(r => {
    const d = r.dir || "";
    return /*#__PURE__*/React.createElement("div", {
      className: "asa-sd__finrow",
      key: r.label
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-sd__fink"
    }, r.label), /*#__PURE__*/React.createElement("span", {
      className: `asa-sd__finv ${d === "up" ? "asa-sd__finv--up" : d === "down" ? "asa-sd__finv--down" : ""}`
    }, r.value, r.note && /*#__PURE__*/React.createElement("span", {
      className: "asa-sd__finnote"
    }, r.note)));
  }))), (loading || s.ratios && s.ratios.length > 0) && /*#__PURE__*/React.createElement(__ds_scope.Panel, {
    title: "Valuation & ratios",
    aside: prov(s.ratiosAsOf)
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__skstack"
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement(Sk, {
    key: i
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__fin"
  }, s.ratios.map(r => {
    const d = r.dir || "";
    return /*#__PURE__*/React.createElement("div", {
      className: "asa-sd__finrow",
      key: r.label
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-sd__fink"
    }, r.label), /*#__PURE__*/React.createElement("span", {
      className: `asa-sd__finv ${d === "up" ? "asa-sd__finv--up" : d === "down" ? "asa-sd__finv--down" : ""}`
    }, r.value, r.note && /*#__PURE__*/React.createElement("span", {
      className: "asa-sd__finnote"
    }, r.note)));
  }))), !loading && /*#__PURE__*/React.createElement("div", {
    className: "asa-sd__actions"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "sm",
    onClick: () => onResearch && onResearch(s)
  }, "Research this name"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => onSetAlert && onSetAlert(s)
  }, s.alert ? `Alert · ${s.alert}` : "Set alert"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => onRemove && onRemove(s)
  }, "Remove"))));
}
Object.assign(__ds_scope, { StockDetail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/StockDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/ContextRail.jsx
try { (() => {
const {
  Panel,
  BudgetGauge,
  PriceQuote
} = window.AIStockAgentDesignSystem_ea6e23;

/* ContextRail — the default right panel: the agent's standing context. Budget (its self-pacing
 * limit), today's read, and what you're following. Quiet — no motion, no ticker. */
function ContextRail({
  data,
  onPick,
  active,
  onOpenActive
}) {
  window.useStyle("kit-rail", `
    .rail__stack{ display:flex; flex-direction:column; gap:14px; }
    .rail__stack .asa-panel{ border-radius:0; }
    .rail__today{ font-family:var(--font-serif); font-size:14px; line-height:1.6; color:var(--text-body); margin:0; }
    .rail__follow{ display:flex; flex-direction:column; }
    .rail__frow{ padding:9px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }
    .rail__frow:last-child{ border-bottom:0; }
    .rail__frow:hover{ background:var(--surface-hover); margin:0 -12px; padding-left:12px; padding-right:12px; border-radius:var(--radius-sm); }
    .rail__note{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); padding:2px 0 0; }
    .rail__tag{ font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--accent-quiet); margin-top:5px; display:inline-flex; align-items:center; gap:5px; }
    .rail__tag::before{ content:""; width:4px; height:4px; border-radius:999px; background:var(--accent); }
  `);
  return /*#__PURE__*/React.createElement("div", {
    className: "rail__stack"
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Weekly budget"
  }, /*#__PURE__*/React.createElement(BudgetGauge, {
    spent: data.BUDGET.spent,
    cap: data.BUDGET.cap
  }), /*#__PURE__*/React.createElement("div", {
    className: "rail__note"
  }, "the agent paces itself against this \u2014 it stops deep work as it approaches the cap.")), active && /*#__PURE__*/React.createElement(window.LiveResearch, {
    session: active,
    onOpen: onOpenActive
  }));
}
Object.assign(window, {
  ContextRail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/ContextRail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Desk.jsx
try { (() => {
// Desk — the single terminal. One view: a permanent World surveillance spine in the center,
// a Coverage rail (watchlist + sessions) on the left, and the Agent (live research + budget,
// or a drilled-in detail) on the right. A persistent ask bar lets you talk to the agent at any
// time. Settings is the ONLY separate view — reached from the topbar gear. No tab-switching.

const {
  Button,
  BudgetGauge,
  StockDetail,
  Panel
} = window.AIStockAgentDesignSystem_ea6e23;
const {
  useState: useStateD,
  useEffect: useEffectD,
  useRef: useRefD
} = React;
function Desk() {
  window.useStyle("kit-desk", `
    .desk{ display:flex; flex-direction:column; height:100vh; overflow:hidden; }

    /* ---- Top bar — thin, time & date only (no logo) ---- */
    .desk__topbar{ flex:none; height:32px; display:flex; align-items:center; gap:14px; padding:0 16px;
      border-bottom:1px solid var(--border-strong); background:var(--surface-panel); }
    .desk__date{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); letter-spacing:.02em; }
    .desk__spacer{ flex:1; }
    .desk__clock{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); letter-spacing:.04em; font-variant-numeric:tabular-nums; }

    /* ---- Shell: nav rail + three columns ---- */
    .desk__shell{ flex:1; display:flex; min-height:0; min-width:0; }
    .desk__nav{ flex:none; width:50px; border-right:1px solid var(--border-default); background:var(--surface-panel);
      display:flex; flex-direction:column; align-items:center; padding:10px 0; gap:4px; }
    .desk__navbtn{ width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-md);
      cursor:pointer; color:var(--text-muted); border:1px solid transparent; background:transparent;
      transition:background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out); }
    .desk__navbtn:hover{ background:var(--surface-hover); color:var(--text-strong); }
    .desk__navbtn--on{ background:var(--signal-soft); color:var(--accent); border-color:color-mix(in oklch, var(--accent), transparent 65%); }
    .desk__navspacer{ flex:1; }
    .desk__settings{ flex:1; display:flex; min-height:0; }

    .desk__center{ flex:1; display:flex; flex-direction:column; min-width:0; min-height:0; }
    .desk__world{ flex:1; min-height:0; min-width:0; }

    /* ---- Persistent ask bar ---- */
    .desk__ask{ flex:none; border-top:1px solid var(--border-default); background:var(--surface-panel); padding:10px 22px 12px; }
    .desk__askcontrols{ max-width:880px; margin:0 auto 8px; display:flex; align-items:center; gap:12px; }
    .desk__ctrlabel{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); letter-spacing:.04em; }
    .desk__ctrseg{ display:flex; border:1px solid var(--border-default); border-radius:var(--radius-sm); overflow:hidden; }
    .desk__ctrsbtn{ font-family:var(--font-mono); font-size:10px; color:var(--text-muted); padding:3px 9px; background:transparent;
      border:none; border-right:1px solid var(--border-default); cursor:pointer; transition:background var(--dur-fast), color var(--dur-fast); }
    .desk__ctrsbtn:last-child{ border-right:0; }
    .desk__ctrsbtn:hover{ background:var(--surface-hover); color:var(--text-strong); }
    .desk__ctrsbtn--on{ background:var(--surface-raised); color:var(--text-strong); font-weight:600; }
    .desk__ctrturns{ display:flex; align-items:center; gap:5px; margin-left:auto; }
    .desk__ctrnum{ font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-body); min-width:20px; text-align:center; font-variant-numeric:tabular-nums; }
    .desk__ctrstep{ display:flex; align-items:center; justify-content:center; width:18px; height:18px; border:1px solid var(--border-default);
      border-radius:var(--radius-sm); cursor:pointer; background:transparent; color:var(--text-dim); font-size:12px; line-height:1;
      transition:background var(--dur-fast), color var(--dur-fast); }
    .desk__ctrstep:hover{ background:var(--surface-hover); color:var(--text-strong); }
    .desk__askwrap{ max-width:880px; margin:0 auto; display:flex; gap:10px; align-items:center; }
    .desk__askfield{ flex:1; display:flex; align-items:center; gap:10px; height:42px; padding:0 14px;
      background:var(--surface-inset); border:1px solid var(--border-strong); border-radius:var(--radius-md); }
    .desk__askfield:focus-within{ border-color:var(--accent); }
    .desk__askfield svg{ stroke:var(--text-dim); flex:none; }
    .desk__askinput{ flex:1; border:0; background:transparent; color:var(--text-strong); font-family:var(--font-sans); font-size:14px; }
    .desk__askinput:focus{ outline:none; }
    .desk__askinput::placeholder{ color:var(--text-dim); }

    /* ---- Left-panel detail (a picked stock or industry opens here) ---- */
    .desk__leftdetail{ flex:none; width:360px; border-right:1px solid var(--border-default); background:var(--surface-panel); display:flex; flex-direction:column; min-height:0; }

    /* ---- Center detail (full info opens here — middle panel, per spec) ---- */
    .desk__detail{ flex:1; min-height:0; display:flex; justify-content:center; background:var(--bg-app); }
    .desk__detail > *{ width:min(840px, 100%); height:100%; border-left:1px solid var(--border-default); border-right:1px solid var(--border-default); }

    /* ---- Agent rail — strictly agent state; collapsible ---- */
    .desk__agent{ flex:none; width:360px; border-left:1px solid var(--border-default); background:var(--bg-app); display:flex; flex-direction:column; min-height:0; }
    .desk__agenthead{ flex:none; display:flex; align-items:center; gap:9px; height:40px; padding:0 12px 0 16px; border-bottom:1px solid var(--border-default); background:var(--surface-panel); }
    .desk__agenttitle{ font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--text-strong); }
    .desk__agentsub{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
    .desk__agentcollapse{ margin-left:auto; width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-default); border-radius:var(--radius-sm); background:transparent; color:var(--text-muted); cursor:pointer; transition:background var(--dur-fast), color var(--dur-fast); }
    .desk__agentcollapse:hover{ background:var(--surface-hover); color:var(--text-strong); }
    .desk__agentstack{ flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:14px; padding:14px; }
    .desk__agentscroll{ flex:1; min-height:0; overflow-y:auto; }
    .desk__budgetnote{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:2px; }
    .desk__agentstrip{ flex:none; width:40px; border-left:1px solid var(--border-default); background:var(--surface-panel); display:flex; flex-direction:column; align-items:center; gap:12px; padding:12px 0; cursor:pointer; color:var(--text-muted); transition:background var(--dur-fast), color var(--dur-fast); }
    .desk__agentstrip:hover{ background:var(--surface-hover); color:var(--text-strong); }
    .desk__agentstriplabel{ writing-mode:vertical-rl; font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.16em; }
  `);
  const D = window.DATA;
  const [extra, setExtra] = useStateD([]);
  const [selectedId, setSelectedId] = useStateD(null);
  const [picked, setPicked] = useStateD(null);
  const [pickedIndustry, setPickedIndustry] = useStateD(null);
  const [loadingStock, setLoadingStock] = useStateD(false);
  const [following, setFollowing] = useStateD(D.FOLLOWING);
  const [draft, setDraft] = useStateD("");
  const [navPage, setNavPage] = useStateD("terminal");
  const [agentOpen, setAgentOpen] = useStateD(true);
  const [sidePanel, setSidePanel] = useStateD("watchlist");
  const openSide = id => {
    setPicked(null);
    setPickedIndustry(null);
    if (navPage === "settings") {
      setNavPage("terminal");
      setSidePanel(id);
      return;
    }
    setSidePanel(cur => cur === id ? null : id);
  };
  const [chatDepth, setChatDepth] = useStateD("standard");
  const [chatTurns, setChatTurns] = useStateD(18);
  const [now, setNow] = useStateD(() => new Date());
  useEffectD(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const fmtDate = d => d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const fmtClock = d => {
    const p = n => String(n).padStart(2, "0");
    return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
  };
  const loadTimer = useRefD(null);
  const askRef = useRefD(null);
  const watchlistTickers = new Set(following.map(f => f.ticker));

  // Resolve a ticker to its full store record (watchlist names + agent-discovered candidates).
  const recordByTicker = {};
  following.forEach(f => {
    recordByTicker[f.ticker] = f;
  });
  Object.values(D.CANDIDATES || {}).forEach(c => {
    if (!recordByTicker[c.ticker]) recordByTicker[c.ticker] = c;
  });
  const hasRecord = ticker => !!recordByTicker[ticker];
  const pickStock = stock => {
    setSelectedId(null);
    setPickedIndustry(null);
    setPicked(stock);
    setLoadingStock(true);
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => setLoadingStock(false), 480);
  };
  const pickStockByTicker = ticker => {
    const r = recordByTicker[ticker];
    if (r) pickStock(r);
  };
  const pickIndustry = ind => {
    setPicked(null);
    setSelectedId(null);
    setPickedIndustry(ind);
  };
  useEffectD(() => () => clearTimeout(loadTimer.current), []);
  const selectSession = id => {
    setPicked(null);
    setPickedIndustry(null);
    setSelectedId(id);
    setAgentOpen(true);
  };
  const researchStock = stock => {
    setNavPage("terminal");
    setSidePanel("chat");
    setDraft(`${stock.ticker} (${stock.name}) — `);
    setTimeout(() => {
      const el = askRef.current;
      if (el) {
        el.focus();
        const v = el.value;
        try {
          el.setSelectionRange(v.length, v.length);
        } catch (e) {}
      }
    }, 30);
  };
  const researchIndustry = ind => {
    setNavPage("terminal");
    setSidePanel("chat");
    setDraft(`${ind.name} — `);
    setTimeout(() => {
      const el = askRef.current;
      if (el) {
        el.focus();
        const v = el.value;
        try {
          el.setSelectionRange(v.length, v.length);
        } catch (e) {}
      }
    }, 30);
  };

  // Open research from a surveillance statement — drops the topic into the chat composer.
  const researchTopic = topic => {
    setNavPage("terminal");
    setSidePanel("chat");
    setDraft(`${topic} `);
    setTimeout(() => {
      const el = askRef.current;
      if (el) {
        el.focus();
        const v = el.value;
        try {
          el.setSelectionRange(v.length, v.length);
        } catch (e) {}
      }
    }, 30);
  };
  const addToWatchlist = ticker => {
    setFollowing(prev => prev.some(f => f.ticker === ticker) ? prev : [...prev, {
      ...(D.CANDIDATES[ticker] || {}),
      addedBy: "you"
    }]);
  };
  const sessions = [...extra, ...D.SESSIONS];
  const allById = {
    [D.ACTIVE.id]: D.ACTIVE,
    ...Object.fromEntries(sessions.map(s => [s.id, s]))
  };
  const selected = selectedId != null ? allById[selectedId] : null;
  const spawn = topic => {
    const t = (topic || "").trim();
    if (!t) return;
    const id = Date.now();
    const ns = {
      id,
      topic: t,
      origin: "user",
      status: "open",
      live: true,
      openedAt: "Jun 17 · now",
      activeAgo: "now",
      statusPhrases: D.ASK_PHRASES,
      telemetry: {
        turn: 1,
        maxTurns: chatTurns,
        tools: 1,
        sources: 0,
        inTok: "0.6k",
        outTok: "0.0k",
        elapsed: "0s"
      },
      trace: [{
        label: "Reconstructing what I already know",
        tool: "memory.read",
        reuse: "Watchlist",
        inTok: "0.6k",
        outTok: "0.0k",
        at: "now",
        status: "active"
      }, {
        label: "Search for primary sources",
        status: "pending"
      }, {
        label: "Read & cross-check",
        status: "pending"
      }, {
        label: "Score significance & answer with citations",
        status: "pending"
      }],
      summary: "",
      related: ["Set an alert on this", "Add the names to Following"]
    };
    setExtra(e => [ns, ...e]);
    setPicked(null);
    setSelectedId(id);
    setDraft("");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "desk"
  }, /*#__PURE__*/React.createElement("div", {
    className: "desk__topbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "desk__date"
  }, fmtDate(now)), /*#__PURE__*/React.createElement("span", {
    className: "desk__spacer"
  }), /*#__PURE__*/React.createElement("span", {
    className: "desk__clock"
  }, fmtClock(now))), /*#__PURE__*/React.createElement("div", {
    className: "desk__shell"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "desk__nav"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Research sessions",
    className: `desk__navbtn ${navPage === "terminal" && sidePanel === "research" ? "desk__navbtn--on" : ""}`,
    onClick: () => openSide("research")
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "search",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Watchlist & industries",
    className: `desk__navbtn ${navPage === "terminal" && sidePanel === "watchlist" ? "desk__navbtn--on" : ""}`,
    onClick: () => openSide("watchlist")
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "layers",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Chat",
    className: `desk__navbtn ${navPage === "terminal" && sidePanel === "chat" ? "desk__navbtn--on" : ""}`,
    onClick: () => openSide("chat")
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "message-square",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "News & events",
    className: `desk__navbtn ${navPage === "terminal" && sidePanel === "news" ? "desk__navbtn--on" : ""}`,
    onClick: () => openSide("news")
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "newspaper",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "desk__navspacer"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Settings",
    className: `desk__navbtn ${navPage === "settings" ? "desk__navbtn--on" : ""}`,
    onClick: () => setNavPage(p => p === "settings" ? "terminal" : "settings")
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "settings",
    size: 18
  }))), navPage === "settings" ? /*#__PURE__*/React.createElement(window.Settings, {
    following: following,
    setFollowing: setFollowing
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, picked ? /*#__PURE__*/React.createElement("div", {
    className: "desk__leftdetail"
  }, /*#__PURE__*/React.createElement(StockDetail, {
    stock: picked,
    loading: loadingStock,
    onClose: () => setPicked(null),
    onResearch: researchStock,
    onSetAlert: () => {},
    onRemove: () => setPicked(null),
    onOpenSource: () => {}
  })) : pickedIndustry ? /*#__PURE__*/React.createElement("div", {
    className: "desk__leftdetail"
  }, /*#__PURE__*/React.createElement(window.IndustryDetail, {
    industry: pickedIndustry,
    onClose: () => setPickedIndustry(null),
    onPickStock: pickStockByTicker,
    onResearch: researchIndustry,
    hasRecord: hasRecord
  })) : sidePanel ? /*#__PURE__*/React.createElement(window.LeftPanel, {
    tab: sidePanel,
    following: following,
    sessions: sessions,
    active: D.ACTIVE,
    industries: D.INDUSTRIES,
    news: D.NEWS,
    onPick: pickStock,
    onSelect: selectSession,
    onPickIndustry: pickIndustry,
    draft: draft,
    setDraft: setDraft,
    spawn: spawn,
    depth: chatDepth,
    setDepth: setChatDepth,
    turns: chatTurns,
    setTurns: setChatTurns,
    askRef: askRef,
    suggestions: [...new Set(sessions.flatMap(s => s.related || []))].slice(0, 4)
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: "desk__center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "desk__world"
  }, /*#__PURE__*/React.createElement(window.WorldBoard, {
    data: D.WORLD,
    news: D.NEWS,
    industries: D.INDUSTRIES,
    following: following,
    onOpenIndustry: pickIndustry,
    onPickStock: pickStock,
    onResearch: researchTopic
  }))), agentOpen ? /*#__PURE__*/React.createElement("aside", {
    className: "desk__agent"
  }, /*#__PURE__*/React.createElement("div", {
    className: "desk__agenthead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "desk__agenttitle"
  }, "Agent"), /*#__PURE__*/React.createElement("span", {
    className: "desk__agentsub"
  }, selected ? "research" : "live state"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "desk__agentcollapse",
    title: "Collapse",
    onClick: () => setAgentOpen(false)
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "chevrons-right",
    size: 15
  }))), selected ? /*#__PURE__*/React.createElement("div", {
    className: "desk__agentscroll"
  }, /*#__PURE__*/React.createElement(window.DetailPanel, {
    session: selected,
    onClose: () => setSelectedId(null),
    onSpawn: spawn,
    onAddToWatchlist: addToWatchlist,
    watchlistTickers: watchlistTickers
  })) : /*#__PURE__*/React.createElement("div", {
    className: "desk__agentstack"
  }, /*#__PURE__*/React.createElement(window.LiveResearch, {
    session: D.ACTIVE,
    onOpen: selectSession
  }), /*#__PURE__*/React.createElement(Panel, {
    title: "Weekly token budget"
  }, /*#__PURE__*/React.createElement(BudgetGauge, {
    spent: D.BUDGET.spent,
    cap: D.BUDGET.cap
  }), /*#__PURE__*/React.createElement("div", {
    className: "desk__budgetnote"
  }, "the agent paces itself against this \u2014 it stops deep work as it approaches the cap.")))) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "desk__agentstrip",
    title: "Show agent",
    onClick: () => setAgentOpen(true)
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "chevrons-left",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    className: "desk__agentstriplabel"
  }, "Agent")))));
}
Object.assign(window, {
  Desk
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Desk.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/DetailPanel.jsx
try { (() => {
const {
  Button,
  StatusPill,
  OriginBadge,
  AgentStatus,
  AgentTrace,
  SignificanceMeter,
  ImpactMap
} = window.AIStockAgentDesignSystem_ea6e23;

/* DetailPanel — the IDE-style detail that slides into the right panel when you open a research.
 * Full visibility: live status (if open), the step trace, every source, the findings prose,
 * telemetry, cross-platform reuse, and related topics you can spin into new research. */
function DetailPanel({
  session,
  onClose,
  onSpawn,
  onAddToWatchlist,
  watchlistTickers
}) {
  window.useStyle("kit-detail", `
    .dt{ }
    @media (prefers-reduced-motion: no-preference){ .dt{ animation:asa-rise-in var(--dur-base) var(--ease-out); } }
    .dt__head{ position:sticky; top:0; background:var(--surface-raised); border-bottom:1px solid var(--border-default);
      padding:13px 16px; display:flex; align-items:flex-start; gap:10px; z-index:2; }
    .dt__htext{ flex:1; min-width:0; }
    .dt__eyebrow{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    .dt__topic{ font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text-strong); line-height:1.25; }
    .dt__close{ flex:none; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;
      color:var(--text-muted); border:1px solid var(--border-default); border-radius:var(--radius-md); background:var(--surface-panel); }
    .dt__close:hover{ color:var(--text-strong); border-color:var(--border-strong); }
    .dt__body{ padding:16px; display:flex; flex-direction:column; gap:18px; }
    .dt__sec h4{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-muted); margin:0 0 10px; }
    .dt__status{ display:flex; align-items:center; }
    .dt__findings{ font-family:var(--font-serif); font-size:15px; line-height:1.65; color:var(--text-body); margin:0; }
    .dt__src{ display:flex; align-items:flex-start; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }
    .dt__src:last-child{ border-bottom:0; }
    .dt__src:hover .dt__src-title{ color:var(--accent-quiet); }
    .dt__src-fav{ flex:none; width:16px; height:16px; border-radius:3px; background:var(--surface-inset); color:var(--text-muted);
      display:flex; align-items:center; justify-content:center; margin-top:1px; }
    .dt__src-main{ flex:1; min-width:0; }
    .dt__src-title{ font-family:var(--font-sans); font-size:13px; color:var(--text-strong); line-height:1.35; }
    .dt__src-meta{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; }
    .dt__src-meta a, .dt__src-dom{ color:var(--link); }
    .dt__sig{ flex:none; margin-top:1px; }
    .dt__chips{ display:flex; flex-wrap:wrap; gap:7px; }
    .dt__chip{ font-family:var(--font-mono); font-size:11px; color:var(--accent-quiet); cursor:pointer; }
    .dt__chip:hover{ color:var(--accent); text-decoration:underline; text-underline-offset:3px; }
    .dt__actions{ display:flex; gap:8px; flex-wrap:wrap; }
    .dt__surfnote{ font-family:var(--font-mono); font-size:10px; line-height:1.5; color:var(--text-dim); margin:-2px 0 11px; }
    .dt__surf{ display:flex; flex-direction:column; gap:0; border-top:1px solid var(--border-default); }
    .dt__surfrow{ display:flex; flex-direction:column; gap:7px; padding:11px 0; background:transparent;
      border:0; border-bottom:1px solid var(--border-default); }
    .dt__surftop{ display:flex; align-items:baseline; gap:9px; }
    .dt__surfsym{ font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--text-strong); }
    .dt__surfname{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted); }
    .dt__surfwhy{ font-family:var(--font-serif); font-size:13px; line-height:1.55; color:var(--text-body); margin:0; }
    .dt__surffoot{ display:flex; align-items:center; gap:10px; margin-top:1px; }
    .dt__surfon{ margin-left:auto; font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--accent-quiet);
      display:inline-flex; align-items:center; gap:5px; }
    .dt__surfon::before{ content:""; width:5px; height:5px; border-radius:999px; background:var(--accent); }
    .dt__surf .asa-btn{ margin-left:auto; }
  `);
  const live = session.status === "open";
  return /*#__PURE__*/React.createElement("div", {
    className: "dt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt__htext"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt__eyebrow"
  }, /*#__PURE__*/React.createElement(OriginBadge, {
    initiatedBy: session.origin
  }), /*#__PURE__*/React.createElement(StatusPill, {
    status: session.status
  })), /*#__PURE__*/React.createElement("div", {
    className: "dt__topic"
  }, session.topic)), /*#__PURE__*/React.createElement("div", {
    className: "dt__close",
    onClick: onClose,
    title: "Close"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "x",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dt__body"
  }, live && /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt__status"
  }, /*#__PURE__*/React.createElement(AgentStatus, {
    phrases: session.statusPhrases || window.DATA.ASK_PHRASES,
    interval: 2400,
    size: "13px"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Telemetry \xB7 full visibility"), /*#__PURE__*/React.createElement(window.Telemetry, {
    t: session.telemetry,
    compact: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Step trace"), /*#__PURE__*/React.createElement(AgentTrace, {
    steps: session.trace
  })), session.summary && /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, live ? "Working findings" : "Findings"), /*#__PURE__*/React.createElement("p", {
    className: "dt__findings"
  }, session.summary)), session.impact && session.impact.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Likely affected \xB7 what the findings move"), /*#__PURE__*/React.createElement(ImpactMap, {
    items: session.impact
  })), session.sources && session.sources.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Sources \xB7 ", session.sources.length), session.sources.map((src, i) => /*#__PURE__*/React.createElement("div", {
    className: "dt__src",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "dt__src-fav"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "link",
    size: 10
  })), /*#__PURE__*/React.createElement("div", {
    className: "dt__src-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt__src-title"
  }, src.title), /*#__PURE__*/React.createElement("div", {
    className: "dt__src-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dt__src-dom"
  }, src.domain), " \xB7 ", src.at)), /*#__PURE__*/React.createElement("span", {
    className: "dt__sig"
  }, /*#__PURE__*/React.createElement(SignificanceMeter, {
    value: src.sig
  }))))), session.surfaced && session.surfaced.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Names surfaced \xB7 ", session.surfaced.length), /*#__PURE__*/React.createElement("div", {
    className: "dt__surfnote"
  }, "found in this research and ranked by exposure \xB7 the agent stores high-significance names on its own; confirm the rest"), /*#__PURE__*/React.createElement("div", {
    className: "dt__surf"
  }, session.surfaced.map(n => {
    const on = watchlistTickers && watchlistTickers.has(n.ticker);
    return /*#__PURE__*/React.createElement("div", {
      className: "dt__surfrow",
      key: n.ticker
    }, /*#__PURE__*/React.createElement("div", {
      className: "dt__surftop"
    }, /*#__PURE__*/React.createElement("span", {
      className: "dt__surfsym"
    }, n.ticker), /*#__PURE__*/React.createElement("span", {
      className: "dt__surfname"
    }, n.name)), /*#__PURE__*/React.createElement("p", {
      className: "dt__surfwhy"
    }, n.why), /*#__PURE__*/React.createElement("div", {
      className: "dt__surffoot"
    }, /*#__PURE__*/React.createElement(SignificanceMeter, {
      value: n.sig,
      showLabel: true
    }), on ? /*#__PURE__*/React.createElement("span", {
      className: "dt__surfon"
    }, n.addedBy === "agent" ? "added by agent" : "on watchlist") : /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => onAddToWatchlist && onAddToWatchlist(n.ticker)
    }, "Add to watchlist")));
  }))), session.related && session.related.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Related topics"), /*#__PURE__*/React.createElement("div", {
    className: "dt__chips"
  }, session.related.map(r => /*#__PURE__*/React.createElement("span", {
    className: "dt__chip",
    key: r,
    onClick: () => onSpawn(r)
  }, r)))), /*#__PURE__*/React.createElement("div", {
    className: "dt__sec"
  }, /*#__PURE__*/React.createElement("h4", null, "Actions"), /*#__PURE__*/React.createElement("div", {
    className: "dt__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: () => onSpawn(`Follow-up on ${session.topic}`)
  }, "Ask a follow-up"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Re-run"), /*#__PURE__*/React.createElement(Button, {
    variant: live ? "danger" : "ghost",
    size: "sm"
  }, live ? "Close session" : "Reopen")))));
}
Object.assign(window, {
  DetailPanel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/DetailPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/IndustryDetail.jsx
try { (() => {
// IndustryDetail — the deep industry research surface, opened in the right (agent) panel when you
// pick an industry. This is where the scraper + agent go deep: what the industry actually is
// (qualitative), the numbers (quantitative), the supply chain in tiers, the current news & events
// affecting it with sources, and each constituent name with sentiment + key fundamentals. Mirrors
// StockDetail's structure so the panel feels like one surface. Reads & observations only.
// Exports window.IndustryDetail.

const {
  Panel: IDPanel,
  Button: IDButton,
  SignificanceMeter: IDSig
} = window.AIStockAgentDesignSystem_ea6e23;
const ID_CSS = `
  .asa-id{ display:flex; flex-direction:column; height:100%; }
  @media (prefers-reduced-motion: no-preference){ .asa-id{ animation:asa-rise-in var(--dur-base) var(--ease-out); } }

  .asa-id__head{ position:sticky; top:0; z-index:2; background:var(--surface-raised);
    border-bottom:1px solid var(--border-default); padding:14px 16px; }
  .asa-id__htop{ display:flex; align-items:flex-start; gap:10px; }
  .asa-id__id{ flex:1; min-width:0; }
  .asa-id__eyebrow{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.14em; color:var(--accent-quiet); margin-bottom:6px; display:inline-flex; align-items:center; gap:7px; }
  .asa-id__name{ font-family:var(--font-display); font-size:19px; font-weight:700; letter-spacing:-.01em; line-height:1.2; color:var(--text-strong); margin:0; }
  .asa-id__sector{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted); margin-top:4px; }
  .asa-id__close{ flex:none; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;
    color:var(--text-muted); border:1px solid var(--border-default); border-radius:var(--radius-md); background:var(--surface-panel); }
  .asa-id__close:hover{ color:var(--text-strong); border-color:var(--border-strong); }
  .asa-id__meta{ display:flex; align-items:center; gap:9px; margin-top:12px; }
  .asa-id__bias{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.06em; }
  .asa-id__bias-tailwind{ color:var(--up-500); }
  .asa-id__bias-headwind{ color:var(--down-500); }
  .asa-id__bias-mixed{ color:var(--text-muted); }
  .asa-id__move{ font-family:var(--font-mono); font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
  .asa-id__move--up{ color:var(--up-500); }
  .asa-id__move--down{ color:var(--down-500); }
  .asa-id__move--flat{ color:var(--text-dim); }
  .asa-id__asof{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; }

  .asa-id__body{ flex:1; min-height:0; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:14px; }
  .asa-id__body > *{ flex:none; }
  .asa-id__prov{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }

  .asa-id__qual{ font-family:var(--font-serif); font-size:14px; line-height:1.62; color:var(--text-body); margin:0; }
  .asa-id__happening{ font-family:var(--font-serif); font-size:13.5px; line-height:1.6; color:var(--text-body); margin:0; }

  /* metric grid */
  .asa-id__metrics{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--border-default); border:0; border-top:1px solid var(--border-default); border-bottom:1px solid var(--border-default); }
  .asa-id__metric{ background:var(--surface-panel); padding:9px 11px; }
  .asa-id__mk{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.06em; color:var(--text-dim); }
  .asa-id__mv{ font-family:var(--font-mono); font-size:14px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; margin-top:3px; }
  .asa-id__mv--up{ color:var(--up-500); }
  .asa-id__mv--down{ color:var(--down-500); }
  .asa-id__mnote{ font-family:var(--font-mono); font-size:8px; color:var(--text-dim); margin-left:6px; }

  /* drivers */
  .asa-id__drivers{ display:flex; flex-direction:column; }
  .asa-id__driver{ display:grid; grid-template-columns:auto 1fr; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-default); }
  .asa-id__driver:last-child{ border-bottom:0; }
  .asa-id__dtag{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; align-self:start; }
  .asa-id__dtag-tailwind{ color:var(--up-500); }
  .asa-id__dtag-headwind{ color:var(--down-500); }
  .asa-id__dtag-mixed{ color:var(--text-muted); }
  .asa-id__dmain{ min-width:0; }
  .asa-id__dlabel{ font-family:var(--font-sans); font-size:13px; font-weight:600; color:var(--text-strong); }
  .asa-id__dnote{ font-family:var(--font-serif); font-size:12.5px; line-height:1.5; color:var(--text-muted); margin-top:2px; }

  /* supply chain tiers */
  .asa-id__chain{ display:flex; flex-direction:column; gap:0; }
  .asa-id__tier{ padding:10px 0; border-bottom:1px solid var(--border-default); }
  .asa-id__tier:last-child{ border-bottom:0; }
  .asa-id__tierlbl{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--accent-quiet); margin-bottom:7px; display:flex; align-items:center; gap:7px; }
  .asa-id__tierlbl svg{ stroke:var(--text-dim); }
  .asa-id__chips{ display:flex; flex-wrap:wrap; gap:6px; }
  .asa-id__chip{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); }
  .asa-id__chip:not(:last-child)::after{ content:"·"; margin-left:6px; color:var(--text-dim); }

  /* news */
  .asa-id__news{ display:flex; flex-direction:column; }
  .asa-id__nitem{ padding:10px 0; border-bottom:1px solid var(--border-default); }
  .asa-id__nitem:last-child{ border-bottom:0; }
  .asa-id__ntags{ display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .asa-id__nkind{ font-family:var(--font-mono); font-size:8px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); }
  .asa-id__nat{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-left:auto; }
  .asa-id__ntopic{ font-family:var(--font-sans); font-size:13px; font-weight:600; line-height:1.35; color:var(--text-strong); text-decoration:none; display:block; }
  .asa-id__ntopic:hover{ color:var(--accent-quiet); }
  .asa-id__nexcerpt{ font-family:var(--font-serif); font-size:12.5px; line-height:1.5; color:var(--text-muted); margin:4px 0 5px; text-wrap:pretty; }
  .asa-id__nsrc{ font-family:var(--font-mono); font-size:9px; color:var(--link); display:inline-flex; align-items:center; gap:4px; }

  /* constituents */
  .asa-id__cons{ display:flex; flex-direction:column; }
  .asa-id__con{ padding:11px 0; border-bottom:1px solid var(--border-default); }
  .asa-id__con:last-child{ border-bottom:0; }
  .asa-id__con--click{ cursor:pointer; }
  .asa-id__con--click:hover{ margin:0 -10px; padding-left:10px; padding-right:10px; border-radius:var(--radius-sm); background:var(--surface-hover); }
  .asa-id__ctop{ display:flex; align-items:center; gap:9px; margin-bottom:6px; }
  .asa-id__csym{ font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-strong); }
  .asa-id__cname{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .asa-id__cchg{ font-family:var(--font-mono); font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }
  .asa-id__cchg--up{ color:var(--up-500); }
  .asa-id__cchg--down{ color:var(--down-500); }
  .asa-id__cchg--flat{ color:var(--text-dim); }
  .asa-id__cchev{ flex:none; color:var(--text-dim); display:flex; }
  .asa-id__con--click:hover .asa-id__cchev{ color:var(--accent); }
  .asa-id__csent{ display:flex; align-items:center; gap:7px; margin-bottom:7px; }
  .asa-id__csentlbl{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.06em; color:var(--_sc); }
  .asa-id__csentval{ font-family:var(--font-mono); font-size:10px; color:var(--_sc); font-variant-numeric:tabular-nums; }
  .asa-id__cmetrics{ display:flex; gap:0; border:0; border-top:1px solid var(--border-default); border-bottom:1px solid var(--border-default); margin-bottom:7px; }
  .asa-id__cmetric{ flex:1; padding:5px 8px; border-right:1px solid var(--border-default); }
  .asa-id__cmetric:last-child{ border-right:0; }
  .asa-id__cmk{ font-family:var(--font-mono); font-size:8px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-dim); }
  .asa-id__cmv{ font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; margin-top:2px; }
  .asa-id__cnote{ font-family:var(--font-serif); font-size:12.5px; line-height:1.5; color:var(--text-body); margin:0; }

  .asa-id__read{ font-family:var(--font-serif); font-size:14px; line-height:1.62; color:var(--text-body); margin:0; }
  .asa-id__actions{ display:flex; flex-wrap:wrap; gap:8px; }
`;
function idDir(n) {
  return n == null ? "flat" : n > 0 ? "up" : n < 0 ? "down" : "flat";
}
function idPct(n) {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function idSentColor(v) {
  if (v >= 0.1) return "var(--up-500)";
  if (v <= -0.1) return "var(--down-500)";
  return "var(--ink-3)";
}
function idSentWord(v) {
  if (v >= 0.35) return "constructive";
  if (v >= 0.1) return "leaning positive";
  if (v <= -0.35) return "bearish";
  if (v <= -0.1) return "leaning negative";
  return "mixed";
}
function IndustryDetail({
  industry,
  onClose,
  onPickStock,
  onResearch,
  hasRecord
}) {
  window.useStyle("asa-id-css", ID_CSS);
  if (!industry) return null;
  const ind = industry;
  const mdir = idDir(ind.movePct);
  const sc = ind.supplyChain || {};
  const prov = t => t ? /*#__PURE__*/React.createElement("span", {
    className: "asa-id__prov"
  }, "as of ", t) : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "asa-id"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__htop"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__id"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__eyebrow"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "building-2",
    size: 11
  }), "Industry research"), /*#__PURE__*/React.createElement("h2", {
    className: "asa-id__name"
  }, ind.name), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__sector"
  }, ind.sector)), onClose && /*#__PURE__*/React.createElement("div", {
    className: "asa-id__close",
    onClick: onClose,
    title: "Close"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "x",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: `asa-id__bias asa-id__bias-${ind.bias}`
  }, ind.bias), /*#__PURE__*/React.createElement("span", {
    className: `asa-id__move asa-id__move--${mdir}`
  }, idPct(ind.movePct), " today"), /*#__PURE__*/React.createElement("span", {
    className: "asa-id__asof"
  }, "researched ", ind.researchedAt))), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__body"
  }, /*#__PURE__*/React.createElement(IDPanel, {
    title: "What this industry is"
  }, /*#__PURE__*/React.createElement("p", {
    className: "asa-id__qual"
  }, ind.overview)), /*#__PURE__*/React.createElement(IDPanel, {
    title: "What's happening now",
    aside: prov(ind.asOf)
  }, /*#__PURE__*/React.createElement("p", {
    className: "asa-id__happening"
  }, ind.whatsHappening)), ind.metrics && ind.metrics.length > 0 && /*#__PURE__*/React.createElement(IDPanel, {
    title: "The numbers"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__metrics"
  }, ind.metrics.map(m => /*#__PURE__*/React.createElement("div", {
    className: "asa-id__metric",
    key: m.label
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__mk"
  }, m.label), /*#__PURE__*/React.createElement("div", {
    className: `asa-id__mv ${m.dir === "up" ? "asa-id__mv--up" : m.dir === "down" ? "asa-id__mv--down" : ""}`
  }, m.value, m.note && /*#__PURE__*/React.createElement("span", {
    className: "asa-id__mnote"
  }, m.note)))))), ind.drivers && ind.drivers.length > 0 && /*#__PURE__*/React.createElement(IDPanel, {
    title: "What's driving it"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__drivers"
  }, ind.drivers.map(d => /*#__PURE__*/React.createElement("div", {
    className: "asa-id__driver",
    key: d.label
  }, /*#__PURE__*/React.createElement("span", {
    className: `asa-id__dtag asa-id__dtag-${d.dir}`
  }, d.dir), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__dmain"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__dlabel"
  }, d.label), d.note && /*#__PURE__*/React.createElement("div", {
    className: "asa-id__dnote"
  }, d.note)))))), (sc.upstream || sc.core || sc.downstream) && /*#__PURE__*/React.createElement(IDPanel, {
    title: "Supply chain"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__chain"
  }, sc.upstream && /*#__PURE__*/React.createElement("div", {
    className: "asa-id__tier"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__tierlbl"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "arrow-up",
    size: 11
  }), "Upstream \xB7 inputs"), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__chips"
  }, sc.upstream.map(c => /*#__PURE__*/React.createElement("span", {
    className: "asa-id__chip",
    key: c
  }, c)))), sc.core && /*#__PURE__*/React.createElement("div", {
    className: "asa-id__tier"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__tierlbl"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "circle-dot",
    size: 11
  }), "Core \xB7 the industry"), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__chips"
  }, sc.core.map(c => /*#__PURE__*/React.createElement("span", {
    className: "asa-id__chip",
    key: c
  }, c)))), sc.downstream && /*#__PURE__*/React.createElement("div", {
    className: "asa-id__tier"
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__tierlbl"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "arrow-down",
    size: 11
  }), "Downstream \xB7 demand"), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__chips"
  }, sc.downstream.map(c => /*#__PURE__*/React.createElement("span", {
    className: "asa-id__chip",
    key: c
  }, c)))))), ind.news && ind.news.length > 0 && /*#__PURE__*/React.createElement(IDPanel, {
    title: `News & events · ${ind.news.length}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__news"
  }, ind.news.map((n, i) => /*#__PURE__*/React.createElement("div", {
    className: "asa-id__nitem",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__ntags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "asa-id__nkind"
  }, n.kind), /*#__PURE__*/React.createElement("span", {
    className: "asa-id__nat"
  }, n.at)), /*#__PURE__*/React.createElement("a", {
    className: "asa-id__ntopic",
    href: n.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, n.topic), n.excerpt && /*#__PURE__*/React.createElement("p", {
    className: "asa-id__nexcerpt"
  }, n.excerpt), /*#__PURE__*/React.createElement("a", {
    className: "asa-id__nsrc",
    href: n.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "link",
    size: 9
  }), n.source))))), ind.constituents && ind.constituents.length > 0 && /*#__PURE__*/React.createElement(IDPanel, {
    title: `Names in this industry · ${ind.constituents.length}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "asa-id__cons"
  }, ind.constituents.map(c => {
    const cd = idDir(c.changePct);
    const hasRec = hasRecord && hasRecord(c.ticker);
    const csc = idSentColor(c.sent ?? 0);
    return /*#__PURE__*/React.createElement("div", {
      className: `asa-id__con ${hasRec ? "asa-id__con--click" : ""}`,
      key: c.ticker,
      onClick: hasRec ? () => onPickStock && onPickStock(c.ticker) : undefined
    }, /*#__PURE__*/React.createElement("div", {
      className: "asa-id__ctop"
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-id__csym"
    }, c.ticker), /*#__PURE__*/React.createElement("span", {
      className: "asa-id__cname"
    }, c.name), /*#__PURE__*/React.createElement("span", {
      className: `asa-id__cchg asa-id__cchg--${cd}`
    }, idPct(c.changePct)), hasRec && /*#__PURE__*/React.createElement("span", {
      className: "asa-id__cchev"
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "chevron-right",
      size: 14
    }))), c.sent != null && /*#__PURE__*/React.createElement("div", {
      className: "asa-id__csent",
      style: {
        "--_sc": csc
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "asa-id__csentlbl"
    }, idSentWord(c.sent)), /*#__PURE__*/React.createElement("span", {
      className: "asa-id__csentval"
    }, "sentiment ", c.sent > 0 ? "+" : "", c.sent.toFixed(2))), c.metrics && c.metrics.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "asa-id__cmetrics"
    }, c.metrics.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      className: "asa-id__cmetric",
      key: k
    }, /*#__PURE__*/React.createElement("div", {
      className: "asa-id__cmk"
    }, k), /*#__PURE__*/React.createElement("div", {
      className: "asa-id__cmv"
    }, v)))), c.note && /*#__PURE__*/React.createElement("p", {
      className: "asa-id__cnote"
    }, c.note));
  }))), ind.agentRead && /*#__PURE__*/React.createElement(IDPanel, {
    title: "The agent's read"
  }, /*#__PURE__*/React.createElement("p", {
    className: "asa-id__read"
  }, ind.agentRead)), ind.telemetry && /*#__PURE__*/React.createElement(IDPanel, {
    title: "Last research run",
    aside: prov(ind.researchedAt)
  }, /*#__PURE__*/React.createElement(window.Telemetry, {
    t: ind.telemetry,
    compact: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "asa-id__actions"
  }, /*#__PURE__*/React.createElement(IDButton, {
    variant: "primary",
    size: "sm",
    onClick: () => onResearch && onResearch(ind)
  }, "Research this industry"), onClose && /*#__PURE__*/React.createElement(IDButton, {
    variant: "ghost",
    size: "sm",
    onClick: onClose
  }, "Close"))));
}
Object.assign(window, {
  IndustryDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/IndustryDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/LeftPanel.jsx
try { (() => {
// LeftPanel — the toggleable secondary panel beside the nav rail. Renders one of three surfaces
// depending on the active nav button: Watchlist/Industries, Research list, or Chat. The Work
// button closes it (Desk sets leftTab=null). Exports window.LeftPanel.

const {
  Button: LPButton,
  PriceQuote: LPPriceQuote
} = window.AIStockAgentDesignSystem_ea6e23;
const LP_CSS = `
  .lp{ flex:none; width:300px; border-right:1px solid var(--border-default); background:var(--surface-panel);
    display:flex; flex-direction:column; min-height:0; }
  .lp__head{ flex:none; display:flex; align-items:center; gap:9px; padding:16px 16px 13px; border-bottom:1px solid var(--border-default); }
  .lp__title{ font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-strong); }
  .lp__count{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; }
  .lp__scroll{ flex:1; overflow-y:auto; }
  .lp__covdiv{ height:1px; background:var(--border-strong); margin:0 16px; }
  .lp__covlabel{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.14em; color:var(--text-dim); padding:10px 16px; border-top:1px solid var(--border-strong); border-bottom:1px solid var(--border-strong); }
  .lp__pad{ padding:14px 16px 24px; }

  /* Watchlist / industries */
  .lp__search{ display:flex; align-items:center; gap:8px; height:36px; padding:0 11px; margin:0 0 20px;
    background:var(--surface-inset); border:1px solid var(--border-strong); border-radius:var(--radius-md);
    transition:border-color var(--dur-fast) var(--ease-out); }
  .lp__search:focus-within{ border-color:var(--accent); }
  .lp__search svg{ stroke:var(--text-dim); flex:none; }
  .lp__searchinput{ flex:1; min-width:0; border:0; background:transparent; color:var(--text-strong);
    font-family:var(--font-sans); font-size:13px; }
  .lp__searchinput:focus{ outline:none; }
  .lp__searchinput::placeholder{ color:var(--text-dim); }
  .lp__searchclear{ flex:none; display:flex; align-items:center; justify-content:center; width:20px; height:20px;
    border:0; background:transparent; color:var(--text-dim); cursor:pointer; border-radius:var(--radius-sm); }
  .lp__searchclear:hover{ background:var(--surface-hover); color:var(--text-strong); }

  .lp__section{ margin-bottom:24px; }
  .lp__section:last-child{ margin-bottom:0; }
  .lp__sectionhead{ display:flex; align-items:baseline; justify-content:space-between; font-family:var(--font-mono);
    font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); padding:8px 0;
    border-top:1px solid var(--border-strong); border-bottom:1px solid var(--border-strong); margin-bottom:8px; }
  .lp__sectioncount{ color:var(--text-dim); letter-spacing:.04em; }
  .lp__empty{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); padding:14px 2px; }

  .lp__indrow{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:11px 0;
    border-bottom:1px solid var(--border-default); cursor:pointer; }
  .lp__indrow:last-child{ border-bottom:0; }
  .lp__indrow:hover{ background:var(--surface-hover); margin:0 -10px; padding-left:10px; padding-right:10px; border-radius:var(--radius-sm); }
  .lp__indname{ font-family:var(--font-sans); font-size:13px; font-weight:500; color:var(--text-body); }
  .lp__indrow--active .lp__indname{ color:var(--accent-quiet); font-weight:600; }
  .lp__indcount{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); font-variant-numeric:tabular-nums; }
  .lp__row{ padding:10px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }

  /* World domain index */
  .lp__worldhint{ font-family:var(--font-serif); font-size:13px; line-height:1.55; color:var(--text-muted); margin:0 0 16px; }
  .lp__domain{ display:block; width:100%; text-align:left; background:transparent; border:0;
    border-bottom:1px solid var(--border-default); padding:13px 0; margin:0; cursor:pointer;
    transition:background var(--dur-fast) var(--ease-out); }
  .lp__domain:hover{ background:var(--surface-hover); margin:0 -16px; padding-left:16px; padding-right:16px; }
  .lp__domaintop{ display:flex; align-items:center; gap:9px; margin-bottom:7px; }
  .lp__domainnum{ font-family:var(--font-mono); font-size:10px; color:var(--accent-quiet); font-variant-numeric:tabular-nums; }
  .lp__domainname{ font-family:var(--font-display); font-size:14px; font-weight:600; color:var(--text-strong); flex:1; }
  .lp__domainchev{ color:var(--text-dim); display:flex; }
  .lp__domain:hover .lp__domainchev{ color:var(--accent); }
  .lp__domainsubs{ display:flex; flex-wrap:wrap; gap:5px; }
  .lp__domainsub{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); }
  .lp__domainsub:not(:last-child)::after{ content:"·"; margin-left:5px; opacity:.5; }
  .lp__row:last-child{ border-bottom:0; }
  .lp__row:hover{ background:var(--surface-hover); margin:0 -10px; padding-left:10px; padding-right:10px; border-radius:var(--radius-sm); }
  .lp__sub{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-top:4px; }
  .lp__tag{ font-family:var(--font-mono); font-size:9px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent-quiet); margin-top:4px; display:inline-flex; align-items:center; gap:5px; }
  .lp__tag::before{ content:""; width:4px; height:4px; border-radius:999px; background:var(--accent); }

  /* Research */
  .lp__rlhead{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); padding:8px 0; border-top:1px solid var(--border-strong); border-bottom:1px solid var(--border-strong); margin:0 0 8px; }
  .lp__active{ border:0; border-bottom:1px solid var(--border-default); background:transparent;
    padding:0 0 16px; margin-bottom:16px; cursor:pointer; }
  .lp__activetop{ display:flex; align-items:center; gap:8px; margin-bottom:7px; }
  .lp__activekick{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--accent-quiet); display:inline-flex; align-items:center; gap:6px; }
  .lp__activekick::before{ content:""; width:6px; height:6px; border-radius:999px; background:var(--accent); animation:asa-pulse 1.6s var(--ease-out) infinite; }
  @keyframes asa-pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.35; } }
  .lp__activetopic{ font-family:var(--font-display); font-size:14px; font-weight:600; line-height:1.3; color:var(--text-strong); margin:0 0 8px; }
  .lp__activemeta{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); display:flex; gap:8px; }
  .lp__sesrow{ padding:12px 0; border-bottom:1px solid var(--border-default); cursor:pointer; }
  .lp__sesrow:hover{ background:var(--surface-hover); margin:0 -10px; padding-left:10px; padding-right:10px; border-radius:var(--radius-sm); }
  .lp__sestop{ display:flex; align-items:flex-start; gap:8px; }
  .lp__sestopic{ font-family:var(--font-display); font-size:13px; font-weight:600; line-height:1.3; color:var(--text-strong); flex:1; }
  .lp__seschev{ flex:none; color:var(--text-dim); display:flex; margin-top:1px; }
  .lp__sesrow:hover .lp__seschev{ color:var(--accent); }
  .lp__sesmeta{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-top:7px; display:flex; align-items:center; gap:7px; }
  .lp__statusdot{ width:6px; height:6px; border-radius:999px; }
  .lp__statusdot--open{ background:var(--up-500); }
  .lp__statusdot--closed{ background:var(--text-dim); }

  /* Chat */
  .lp__chat{ display:flex; flex-direction:column; height:100%; }
  .lp__chatscroll{ flex:1; overflow-y:auto; padding:16px; }
  .lp__chatintro{ font-family:var(--font-serif); font-size:14px; line-height:1.55; color:var(--text-muted); margin:0 0 18px; }
  .lp__suglabel{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); margin:0 0 9px; }
  .lp__sug{ display:flex; flex-direction:column; gap:7px; }
  .lp__sugbtn{ text-align:left; font-family:var(--font-sans); font-size:13px; color:var(--text-body); line-height:1.4;
    background:var(--surface-inset); border:1px solid var(--border-default); border-radius:var(--radius-sm); padding:9px 11px; cursor:pointer;
    transition:border-color var(--dur-fast), background var(--dur-fast); }
  .lp__sugbtn:hover{ border-color:var(--border-strong); background:var(--surface-hover); }
  .lp__composer{ flex:none; border-top:1px solid var(--border-default); background:var(--surface-panel); padding:12px 14px 14px; }
  .lp__ctrls{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .lp__ctrllabel{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .lp__seg{ display:flex; border:1px solid var(--border-default); border-radius:var(--radius-sm); overflow:hidden; }
  .lp__segbtn{ font-family:var(--font-mono); font-size:10px; color:var(--text-muted); padding:3px 8px; background:transparent;
    border:none; border-right:1px solid var(--border-default); cursor:pointer; transition:background var(--dur-fast), color var(--dur-fast); }
  .lp__segbtn:last-child{ border-right:0; }
  .lp__segbtn:hover{ background:var(--surface-hover); color:var(--text-strong); }
  .lp__segbtn--on{ background:var(--surface-raised); color:var(--text-strong); font-weight:600; }
  .lp__turns{ display:flex; align-items:center; gap:5px; margin-left:auto; }
  .lp__step{ display:flex; align-items:center; justify-content:center; width:18px; height:18px; border:1px solid var(--border-default);
    border-radius:var(--radius-sm); cursor:pointer; background:transparent; color:var(--text-dim); font-size:12px; line-height:1; }
  .lp__step:hover{ background:var(--surface-hover); color:var(--text-strong); }
  .lp__num{ font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-body); min-width:20px; text-align:center; font-variant-numeric:tabular-nums; }
  .lp__field{ display:flex; align-items:flex-end; gap:9px; border:1px solid var(--border-strong); border-radius:var(--radius-md);
    background:var(--surface-inset); padding:9px 10px; }
  .lp__field:focus-within{ border-color:var(--accent); }
  .lp__textarea{ flex:1; border:0; background:transparent; resize:none; color:var(--text-strong); font-family:var(--font-sans);
    font-size:14px; line-height:1.45; max-height:120px; }
  .lp__textarea:focus{ outline:none; }
  .lp__textarea::placeholder{ color:var(--text-dim); }

  /* Industries surface */
  .lp__indintro{ font-family:var(--font-serif); font-size:13px; line-height:1.55; color:var(--text-muted); margin:0 0 16px; }
  .lp__indcard{ display:block; width:100%; text-align:left; background:transparent; border:0;
    border-bottom:1px solid var(--border-default); padding:12px 0; margin:0; cursor:pointer;
    transition:background var(--dur-fast) var(--ease-out); }
  .lp__indcard:hover{ background:var(--surface-hover); margin:0 -16px; padding-left:16px; padding-right:16px; }
  .lp__indcardtop{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .lp__indcardname{ font-family:var(--font-display); font-size:13.5px; font-weight:600; color:var(--text-strong); flex:1; line-height:1.25; }
  .lp__indcardmove{ font-family:var(--font-mono); font-size:11px; font-weight:600; font-variant-numeric:tabular-nums; }
  .lp__indcardmove--up{ color:var(--up-500); }
  .lp__indcardmove--down{ color:var(--down-500); }
  .lp__indcardmove--flat{ color:var(--text-dim); }
  .lp__indcardmeta{ display:flex; align-items:center; gap:8px; }
  .lp__indcardbias{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.06em; }
  .lp__indcardbias-tailwind{ color:var(--up-500); }
  .lp__indcardbias-headwind{ color:var(--down-500); }
  .lp__indcardbias-mixed{ color:var(--text-muted); }
  .lp__indcardnames{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-left:auto; }
  .lp__indcardstate{ font-family:var(--font-serif); font-size:12px; line-height:1.5; color:var(--text-muted); margin:0 0 7px; text-wrap:pretty;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

  /* News surface */
  .lp__newsintro{ font-family:var(--font-serif); font-size:13px; line-height:1.55; color:var(--text-muted); margin:0 0 14px; }
  .lp__newsitem{ padding:11px 0; border-bottom:1px solid var(--border-default); }
  .lp__newsitem:last-child{ border-bottom:0; }
  .lp__newstags{ display:flex; align-items:center; gap:8px; margin-bottom:5px; }
  .lp__newskind{ font-family:var(--font-mono); font-size:8px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); }
  .lp__newsrel{ font-family:var(--font-mono); font-size:8px; text-transform:uppercase; letter-spacing:.1em; }
  .lp__newsrel--used{ color:var(--accent-quiet); }
  .lp__newsrel--related{ color:var(--text-muted); }
  .lp__newsat{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-left:auto; }
  .lp__newstopic{ font-family:var(--font-sans); font-size:13px; font-weight:600; line-height:1.35; color:var(--text-strong); text-decoration:none; display:block; }
  .lp__newstopic:hover{ color:var(--accent-quiet); }
  .lp__newsexcerpt{ font-family:var(--font-serif); font-size:12px; line-height:1.5; color:var(--text-muted); margin:4px 0 5px; text-wrap:pretty; }
  .lp__newssrc{ font-family:var(--font-mono); font-size:9px; color:var(--link); display:inline-flex; align-items:center; gap:4px; }
`;
function WorldNav() {
  const domains = [{
    id: "finance",
    num: "01",
    name: "Finance",
    subs: ["US dollar & currencies", "Bond market", "Commodities"]
  }, {
    id: "macro",
    num: "02",
    name: "Macroeconomics",
    subs: ["State of economies", "Growth", "Employment", "Inflation & rates"]
  }, {
    id: "geopolitics",
    num: "03",
    name: "Geopolitics",
    subs: ["Global events", "Tech & manufacturing origin"]
  }, {
    id: "industries",
    num: "04",
    name: "Industries",
    subs: ["Sectors", "Qualitative & quantitative"]
  }];
  const jump = id => window.dispatchEvent(new CustomEvent("world-jump", {
    detail: id
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "lp__pad"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lp__worldhint"
  }, "The agent's standing coverage. The board is swept continuously by the scraper \u2014 jump to a domain."), domains.map(d => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp__domain",
    key: d.id,
    onClick: () => jump(d.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__domaintop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__domainnum"
  }, d.num), /*#__PURE__*/React.createElement("span", {
    className: "lp__domainname"
  }, d.name), /*#__PURE__*/React.createElement("span", {
    className: "lp__domainchev"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "chevron-right",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lp__domainsubs"
  }, d.subs.map(s => /*#__PURE__*/React.createElement("span", {
    className: "lp__domainsub",
    key: s
  }, s))))));
}
function WatchlistPanel({
  following,
  industries,
  onPick,
  onPickIndustry
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const matches = following.filter(f => !q || f.name.toLowerCase().includes(q) || f.ticker.toLowerCase().includes(q) || (f.industry && f.industry.subIndustry || "").toLowerCase().includes(q) || (f.industry && f.industry.sector || "").toLowerCase().includes(q));
  const inds = industries || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "lp__pad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__search"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "search",
    size: 14
  }), /*#__PURE__*/React.createElement("input", {
    className: "lp__searchinput",
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search names, tickers, industries\u2026"
  }), query && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp__searchclear",
    "aria-label": "Clear search",
    onClick: () => setQuery("")
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "x",
    size: 13
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lp__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__sectionhead"
  }, /*#__PURE__*/React.createElement("span", null, "Stocks"), /*#__PURE__*/React.createElement("span", {
    className: "lp__sectioncount"
  }, matches.length)), matches.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "lp__empty"
  }, "No names match \u201C", query, "\u201D.") : matches.map(c => /*#__PURE__*/React.createElement("div", {
    className: "lp__row",
    key: c.id,
    onClick: () => onPick(c)
  }, /*#__PURE__*/React.createElement(LPPriceQuote, {
    symbol: c.ticker,
    name: c.name,
    price: c.price,
    changePct: c.changePct,
    series: c.series
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp__sub"
  }, c.industry && c.industry.subIndustry || ""), c.tier === "discovered" && /*#__PURE__*/React.createElement("div", {
    className: "lp__tag"
  }, "discovered \xB7 added ", c.addedBy === "agent" ? "by agent" : "by you")))), /*#__PURE__*/React.createElement("div", {
    className: "lp__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__sectionhead"
  }, /*#__PURE__*/React.createElement("span", null, "Industries you follow"), /*#__PURE__*/React.createElement("span", {
    className: "lp__sectioncount"
  }, inds.length)), /*#__PURE__*/React.createElement("p", {
    className: "lp__indintro"
  }, "What each industry is and the state the agent reads in it right now \u2014 open one for the full research."), inds.map(ind => {
    const md = ind.movePct > 0 ? "up" : ind.movePct < 0 ? "down" : "flat";
    const mv = `${ind.movePct > 0 ? "+" : ind.movePct < 0 ? "−" : ""}${Math.abs(ind.movePct)}%`;
    const n = (ind.constituents || []).length;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "lp__indcard",
      key: ind.id,
      onClick: () => onPickIndustry && onPickIndustry(ind)
    }, /*#__PURE__*/React.createElement("div", {
      className: "lp__indcardtop"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lp__indcardname"
    }, ind.name), /*#__PURE__*/React.createElement("span", {
      className: `lp__indcardmove lp__indcardmove--${md}`
    }, mv)), /*#__PURE__*/React.createElement("p", {
      className: "lp__indcardstate"
    }, ind.whatsHappening), /*#__PURE__*/React.createElement("div", {
      className: "lp__indcardmeta"
    }, /*#__PURE__*/React.createElement("span", {
      className: `lp__indcardbias lp__indcardbias-${ind.bias}`
    }, ind.bias), /*#__PURE__*/React.createElement("span", {
      className: "lp__indcardnames"
    }, n, " ", n === 1 ? "name" : "names", " \xB7 researched ", ind.researchedAt)));
  })));
}
function ResearchPanel({
  active,
  sessions,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp__pad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__rlhead"
  }, "Active now"), /*#__PURE__*/React.createElement("div", {
    className: "lp__active",
    onClick: () => onSelect(active.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__activetop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__activekick"
  }, "active research")), /*#__PURE__*/React.createElement("p", {
    className: "lp__activetopic"
  }, active.topic), /*#__PURE__*/React.createElement("div", {
    className: "lp__activemeta"
  }, /*#__PURE__*/React.createElement("span", null, "turn ", active.telemetry.turn, "/", active.telemetry.maxTurns), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, active.telemetry.sources, " sources"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, active.telemetry.elapsed))), /*#__PURE__*/React.createElement("div", {
    className: "lp__rlhead"
  }, "Sessions"), sessions.map(s => /*#__PURE__*/React.createElement("div", {
    className: "lp__sesrow",
    key: s.id,
    onClick: () => onSelect(s.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__sestop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__sestopic"
  }, s.topic), /*#__PURE__*/React.createElement("span", {
    className: "lp__seschev"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "chevron-right",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lp__sesmeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: `lp__statusdot lp__statusdot--${s.status}`
  }), /*#__PURE__*/React.createElement("span", null, s.status === "closed" ? "done" : "open"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, s.openedAt), s.telemetry && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, s.telemetry.sources, " sources"))))));
}
function IndustriesPanel({
  industries,
  onPickIndustry
}) {
  const list = industries || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "lp__pad"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lp__indintro"
  }, "Industries the scraper tracks and the agent researches in depth. Open one for its supply chain, the news affecting it, and the constituent names with sentiment & fundamentals."), list.map(ind => {
    const md = ind.movePct > 0 ? "up" : ind.movePct < 0 ? "down" : "flat";
    const mv = `${ind.movePct > 0 ? "+" : ind.movePct < 0 ? "−" : ""}${Math.abs(ind.movePct)}%`;
    const n = (ind.constituents || []).length;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "lp__indcard",
      key: ind.id,
      onClick: () => onPickIndustry(ind)
    }, /*#__PURE__*/React.createElement("div", {
      className: "lp__indcardtop"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lp__indcardname"
    }, ind.name), /*#__PURE__*/React.createElement("span", {
      className: `lp__indcardmove lp__indcardmove--${md}`
    }, mv)), /*#__PURE__*/React.createElement("div", {
      className: "lp__indcardmeta"
    }, /*#__PURE__*/React.createElement("span", {
      className: `lp__indcardbias lp__indcardbias-${ind.bias}`
    }, ind.bias), /*#__PURE__*/React.createElement("span", {
      className: "lp__indcardnames"
    }, n, " ", n === 1 ? "name" : "names", " \xB7 researched ", ind.researchedAt)));
  }));
}
function NewsPanel({
  news
}) {
  const list = news || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "lp__pad"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lp__newsintro"
  }, "The live wire \u2014 articles, reports and filings the scraper is matching against your coverage. ", /*#__PURE__*/React.createElement("em", null, "Used by agent"), " items went into active research; the rest are kept for context."), list.map(n => /*#__PURE__*/React.createElement("div", {
    className: "lp__newsitem",
    key: n.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__newstags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__newskind"
  }, n.kind), /*#__PURE__*/React.createElement("span", {
    className: `lp__newsrel lp__newsrel--${n.relevance}`
  }, n.relevance === "used" ? "used by agent" : "scraper match"), /*#__PURE__*/React.createElement("span", {
    className: "lp__newsat"
  }, n.at)), /*#__PURE__*/React.createElement("a", {
    className: "lp__newstopic",
    href: n.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, n.topic), n.excerpt && /*#__PURE__*/React.createElement("p", {
    className: "lp__newsexcerpt"
  }, n.excerpt), /*#__PURE__*/React.createElement("a", {
    className: "lp__newssrc",
    href: n.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "link",
    size: 9
  }), n.source))));
}
function ChatPanel({
  draft,
  setDraft,
  spawn,
  depth,
  setDepth,
  turns,
  setTurns,
  askRef,
  suggestions
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp__chat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__chatscroll"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lp__chatintro"
  }, "Ask your research partner anything. It reconstructs what it already knows, searches primary sources, scores significance, and answers with citations \u2014 showing every step."), /*#__PURE__*/React.createElement("div", {
    className: "lp__suglabel"
  }, "Pick up a thread"), /*#__PURE__*/React.createElement("div", {
    className: "lp__sug"
  }, suggestions.map((s, i) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp__sugbtn",
    key: i,
    onClick: () => {
      setDraft(s);
      askRef.current && askRef.current.focus();
    }
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "lp__composer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__ctrls"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__ctrllabel"
  }, "depth"), /*#__PURE__*/React.createElement("div", {
    className: "lp__seg"
  }, ["quick", "standard", "deep"].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    type: "button",
    className: `lp__segbtn${depth === d ? " lp__segbtn--on" : ""}`,
    onClick: () => setDepth(d)
  }, d))), /*#__PURE__*/React.createElement("div", {
    className: "lp__turns"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__ctrllabel"
  }, "turns"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp__step",
    onClick: () => setTurns(t => Math.max(4, t - 2))
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    className: "lp__num"
  }, turns), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp__step",
    onClick: () => setTurns(t => Math.min(32, t + 2))
  }, "+"))), /*#__PURE__*/React.createElement("div", {
    className: "lp__field"
  }, /*#__PURE__*/React.createElement("textarea", {
    ref: askRef,
    className: "lp__textarea",
    rows: 2,
    value: draft,
    placeholder: "Ask anything \u2014 it shows its work as it goes\u2026",
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        spawn(draft);
      }
    }
  }), /*#__PURE__*/React.createElement(LPButton, {
    variant: "primary",
    size: "sm",
    onClick: () => spawn(draft),
    disabled: !draft.trim()
  }, "Research"))));
}
function LeftPanel(props) {
  window.useStyle("kit-leftpanel", LP_CSS);
  const {
    tab
  } = props;
  const titles = {
    world: "World",
    watchlist: "Watchlist & industries",
    industries: "Industries",
    research: "Research",
    news: "News & events",
    chat: "Chat"
  };
  const counts = {
    world: "4 domains",
    watchlist: `${props.following.length} names`,
    industries: `${(props.industries || []).length} tracked`,
    research: `${props.sessions.length + 1} sessions`,
    news: `${(props.news || []).length} live`,
    chat: ""
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "lp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__title"
  }, titles[tab]), counts[tab] && /*#__PURE__*/React.createElement("span", {
    className: "lp__count"
  }, counts[tab])), tab === "chat" ? /*#__PURE__*/React.createElement(ChatPanel, {
    draft: props.draft,
    setDraft: props.setDraft,
    spawn: props.spawn,
    depth: props.depth,
    setDepth: props.setDepth,
    turns: props.turns,
    setTurns: props.setTurns,
    askRef: props.askRef,
    suggestions: props.suggestions
  }) : /*#__PURE__*/React.createElement("div", {
    className: "lp__scroll"
  }, tab === "world" && /*#__PURE__*/React.createElement(WorldNav, null), tab === "watchlist" && /*#__PURE__*/React.createElement(WatchlistPanel, {
    following: props.following,
    industries: props.industries,
    onPick: props.onPick,
    onPickIndustry: props.onPickIndustry
  }), tab === "industries" && /*#__PURE__*/React.createElement(IndustriesPanel, {
    industries: props.industries,
    onPickIndustry: props.onPickIndustry
  }), tab === "research" && /*#__PURE__*/React.createElement(ResearchPanel, {
    active: props.active,
    sessions: props.sessions,
    onSelect: props.onSelect
  }), tab === "news" && /*#__PURE__*/React.createElement(NewsPanel, {
    news: props.news
  })));
}
function CoverageRail(props) {
  window.useStyle("kit-leftpanel", LP_CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: "lp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp__title"
  }, "Coverage"), /*#__PURE__*/React.createElement("span", {
    className: "lp__count"
  }, props.following.length, " names \xB7 ", props.sessions.length + 1, " sessions")), /*#__PURE__*/React.createElement("div", {
    className: "lp__scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp__covlabel"
  }, "Watchlist & industries"), /*#__PURE__*/React.createElement(WatchlistPanel, {
    following: props.following,
    onPick: props.onPick
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp__covdiv"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp__covlabel"
  }, "Research sessions"), /*#__PURE__*/React.createElement(ResearchPanel, {
    active: props.active,
    sessions: props.sessions,
    onSelect: props.onSelect
  })));
}
Object.assign(window, {
  LeftPanel,
  CoverageRail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/LeftPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/LiveResearch.jsx
try { (() => {
const {
  Panel,
  Button,
  OriginBadge,
  AgentStatus,
  AgentTrace
} = window.AIStockAgentDesignSystem_ea6e23;

/* LiveResearch — the hero. The open session you see first: what the agent is doing right now,
 * narrated (AgentStatus), the full step trace (AgentTrace), and the live telemetry. */
function LiveResearch({
  session,
  onOpen
}) {
  window.useStyle("kit-live", `
    .live{ }
    @media (prefers-reduced-motion: no-preference){ .live{ animation:asa-rise-in var(--dur-slow) var(--ease-out); } }
    .live__topline{ display:flex; align-items:center; gap:10px; margin-bottom:4px; }
    .live__eyebrow{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:var(--accent-quiet); }
    .live__topic{ font-family:var(--font-display); font-size:21px; font-weight:700; letter-spacing:-.01em; color:var(--text-strong); margin:0 0 14px; line-height:1.2; }
    .live__status{ display:flex; align-items:center; min-height:26px; margin-bottom:16px; }
    .live__trace{ margin-bottom:16px; }
    .live__foot{ display:flex; align-items:center; gap:12px; margin-top:14px; }
    .live__actions{ margin-left:auto; display:flex; gap:8px; }
  `);
  return /*#__PURE__*/React.createElement(Panel, {
    title: "Working now",
    live: true,
    className: "live",
    aside: /*#__PURE__*/React.createElement("span", null, "opened ", session.openedAt.split(" · ")[1])
  }, /*#__PURE__*/React.createElement("div", {
    className: "live__topline"
  }, /*#__PURE__*/React.createElement("span", {
    className: "live__eyebrow"
  }, "active research"), /*#__PURE__*/React.createElement(OriginBadge, {
    initiatedBy: session.origin
  })), /*#__PURE__*/React.createElement("h2", {
    className: "live__topic"
  }, session.topic), /*#__PURE__*/React.createElement("div", {
    className: "live__status"
  }, /*#__PURE__*/React.createElement(AgentStatus, {
    phrases: session.statusPhrases,
    interval: 2500,
    size: "14px"
  })), /*#__PURE__*/React.createElement("div", {
    className: "live__trace"
  }, /*#__PURE__*/React.createElement(AgentTrace, {
    steps: session.trace
  })), /*#__PURE__*/React.createElement(window.Telemetry, {
    t: session.telemetry
  }), /*#__PURE__*/React.createElement("div", {
    className: "live__foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "live__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => onOpen(session.id)
  }, "Open full trace"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Pause"))));
}
Object.assign(window, {
  LiveResearch
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/LiveResearch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/ResearchList.jsx
try { (() => {
const {
  StatusPill,
  OriginBadge,
  AgentStatus
} = window.AIStockAgentDesignSystem_ea6e23;

/* ResearchList — the unified feed of sessions, open first. Each row is interactive: click to
 * open its full detail in the side panel (IDE-style). Live rows narrate themselves inline. */
function ResearchRow({
  s,
  selected,
  onSelect
}) {
  const when = s.status === "closed" ? `closed ${s.closedAt.split(" · ")[0]}` : `active ${s.activeAgo || "now"}`;
  return /*#__PURE__*/React.createElement("div", {
    className: `rl__row ${selected ? "rl__row--sel" : ""}`,
    onClick: () => onSelect(s.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "rl__main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rl__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rl__topic"
  }, s.topic), /*#__PURE__*/React.createElement("span", {
    className: "rl__badges"
  }, /*#__PURE__*/React.createElement(OriginBadge, {
    initiatedBy: s.origin
  }), /*#__PURE__*/React.createElement(StatusPill, {
    status: s.status
  }))), s.live ? /*#__PURE__*/React.createElement("div", {
    className: "rl__live"
  }, /*#__PURE__*/React.createElement(AgentStatus, {
    phrases: s.statusPhrases,
    interval: 2300,
    size: "12px"
  })) : /*#__PURE__*/React.createElement("p", {
    className: "rl__summary"
  }, s.summary), /*#__PURE__*/React.createElement("div", {
    className: "rl__meta"
  }, /*#__PURE__*/React.createElement("span", null, s.openedAt), /*#__PURE__*/React.createElement("span", {
    className: "rl__dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, when), s.telemetry && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "rl__dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, s.telemetry.sources, " sources"), /*#__PURE__*/React.createElement("span", {
    className: "rl__dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, s.telemetry.inTok, " in")))), /*#__PURE__*/React.createElement("span", {
    className: "rl__chev"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "chevron-right",
    size: 16
  })));
}
function ResearchList({
  sessions,
  selectedId,
  onSelect
}) {
  window.useStyle("kit-rl", `
    .rl__head{ display:flex; align-items:baseline; justify-content:space-between; margin:26px 2px 10px; }
    .rl__h{ font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-strong); }
    .rl__count{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
    .rl{ display:flex; flex-direction:column; gap:8px; }
    .rl__row{ display:flex; align-items:center; gap:12px; padding:14px 14px; background:var(--surface-panel);
      border:1px solid var(--border-default); border-radius:var(--radius-md); cursor:pointer;
      transition:border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out); }
    .rl__row:hover{ border-color:var(--border-strong); background:var(--surface-raised); }
    .rl__row--sel{ border-color:var(--accent); }
    .rl__main{ flex:1; min-width:0; }
    .rl__top{ display:flex; align-items:center; gap:10px; }
    .rl__topic{ font-family:var(--font-display); font-size:14px; font-weight:600; color:var(--text-strong); }
    .rl__badges{ display:inline-flex; gap:7px; margin-left:auto; flex:none; }
    .rl__summary{ font-family:var(--font-serif); font-size:14px; line-height:1.5; color:var(--text-muted); margin:7px 0 0; }
    .rl__live{ margin:8px 0 0; }
    .rl__meta{ display:flex; align-items:center; gap:7px; margin-top:9px; font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
    .rl__dot{ opacity:.5; }
    .rl__chev{ flex:none; color:var(--text-dim); display:flex; }
    .rl__row:hover .rl__chev{ color:var(--accent); }
  `);
  const open = sessions.filter(s => s.status === "open");
  const closed = sessions.filter(s => s.status === "closed");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "rl__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rl__h"
  }, "Your research"), /*#__PURE__*/React.createElement("span", {
    className: "rl__count"
  }, open.length, " open \xB7 ", closed.length, " done")), /*#__PURE__*/React.createElement("div", {
    className: "rl"
  }, open.map(s => /*#__PURE__*/React.createElement(ResearchRow, {
    key: s.id,
    s: s,
    selected: s.id === selectedId,
    onSelect: onSelect
  })), closed.map(s => /*#__PURE__*/React.createElement(ResearchRow, {
    key: s.id,
    s: s,
    selected: s.id === selectedId,
    onSelect: onSelect
  }))));
}
Object.assign(window, {
  ResearchList
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/ResearchList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Settings.jsx
try { (() => {
// Settings — profile, auth, watchlist, AI agent, notifications, display.
// Exported as window.Settings; mounted in Desk when navPage === "settings".

const {
  Button,
  TierBadge
} = window.AIStockAgentDesignSystem_ea6e23;
const {
  useState: useStateSett,
  useRef: useRefSett
} = React;

// ── small shared primitives ──────────────────────────────────────────────────

function Tog({
  on,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-pressed": on,
    className: `sett__tog ${on ? "sett__tog--on" : "sett__tog--off"}`,
    onClick: () => onChange(!on)
  }, /*#__PURE__*/React.createElement("span", {
    className: `sett__togknob${on ? " sett__togknob--on" : ""}`
  }));
}
function Seg({
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "sett__seg"
  }, options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const l = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      type: "button",
      className: `sett__segbtn${value === v ? " sett__segbtn--on" : ""}`,
      onClick: () => onChange(v)
    }, l);
  }));
}
function BlurField({
  id,
  value,
  revealed,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "sett__blurwrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: `sett__blurval${revealed ? " sett__blurval--on" : ""}`
  }, value), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "sett__eyebtn",
    onClick: () => onToggle(id),
    title: revealed ? "Hide" : "Reveal"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: revealed ? "eye-off" : "eye",
    size: 13
  })));
}
function SRow({
  label,
  hint,
  children,
  noBorder
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `sett__row${noBorder ? " sett__row--nb" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "sett__rl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sett__rlname"
  }, label), hint && /*#__PURE__*/React.createElement("span", {
    className: "sett__rlhint"
  }, hint)), /*#__PURE__*/React.createElement("div", {
    className: "sett__rc"
  }, children));
}
function Sec({
  id,
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "sett-" + id,
    className: "sett__sec"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sett__sech"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "sett__secbody"
  }, children));
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const SETT_CSS = `
  .sett{ display:flex; flex:1; min-height:0; overflow:hidden; background:var(--bg-app); }

  /* Docs-style plain text sidenav */
  .sett__sidenav{ flex:none; width:160px; border-right:1px solid var(--border-default);
    background:var(--surface-panel); padding:28px 0 22px; display:flex; flex-direction:column;
    gap:1px; overflow-y:auto; }
  .sett__snavhead{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.14em;
    color:var(--text-dim); padding:0 20px 14px; }
  .sett__snavitem{ display:block; padding:7px 20px;
    font-family:var(--font-sans); font-size:13px; color:var(--text-muted);
    background:transparent; border:none; cursor:pointer; text-align:left; width:100%;
    transition:color var(--dur-fast) var(--ease-out); }
  .sett__snavitem:hover{ color:var(--text-strong); }
  .sett__snavitem--active{ color:var(--text-strong); font-weight:600; }

  .sett__scroll{ flex:1; overflow-y:auto; }
  .sett__content{ max-width:620px; padding:32px 44px 64px; display:flex; flex-direction:column; gap:36px; }

  .sett__sec{ display:flex; flex-direction:column; }
  .sett__sech{ font-family:var(--font-sans); font-size:15px; font-weight:600; color:var(--text-strong);
    margin:0; padding-bottom:13px; border-bottom:1px solid var(--border-strong); }
  .sett__secbody{ display:flex; flex-direction:column; }

  .sett__row{ display:flex; align-items:center; justify-content:space-between; gap:24px;
    padding:12px 0; border-bottom:1px solid var(--border-default); min-height:48px; }
  .sett__row--nb{ border-bottom:0; }
  .sett__rl{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .sett__rlname{ font-family:var(--font-sans); font-size:13px; color:var(--text-body); line-height:1.4; }
  .sett__rlhint{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); line-height:1.5; }
  .sett__rlhint--err{ color:var(--down-500); }
  .sett__rc{ flex:none; display:flex; align-items:center; gap:8px; }
  .sett__val{ font-family:var(--font-mono); font-size:12px; color:var(--text-muted); }

  .sett__avatarrow{ display:flex; align-items:center; gap:16px; padding:16px 0 20px;
    border-bottom:1px solid var(--border-default); }
  .sett__avatar{ width:48px; height:48px; border-radius:999px; background:var(--accent);
    display:flex; align-items:center; justify-content:center; flex:none;
    font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--bg-app); letter-spacing:.04em; }
  .sett__avname{ font-family:var(--font-sans); font-size:15px; font-weight:600; color:var(--text-strong); }
  .sett__avsub{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; }

  .sett__verified{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase;
    letter-spacing:.1em; color:var(--up-500); border:1px solid var(--up-500);
    border-radius:var(--radius-xs); padding:2px 5px; }

  .sett__blurwrap{ display:inline-flex; align-items:center; gap:7px; }
  .sett__blurval{ font-family:var(--font-mono); font-size:12px; color:var(--text-body);
    filter:blur(4px); user-select:none; transition:filter var(--dur-base) var(--ease-out); }
  .sett__blurval--on{ filter:none; user-select:text; }
  .sett__eyebtn{ display:flex; align-items:center; justify-content:center; width:22px; height:22px;
    background:transparent; border:1px solid var(--border-default); border-radius:var(--radius-sm);
    color:var(--text-dim); cursor:pointer; }
  .sett__eyebtn:hover{ color:var(--text-strong); border-color:var(--border-strong); }

  .sett__input{ font-family:var(--font-sans); font-size:13px; color:var(--text-strong);
    background:var(--surface-inset); border:1px solid var(--border-strong);
    border-radius:var(--radius-sm); padding:6px 10px; width:220px;
    transition:border-color var(--dur-fast) var(--ease-out); }
  .sett__input:focus{ outline:none; border-color:var(--accent); }

  .sett__tog{ width:36px; height:20px; border-radius:999px; border:none; cursor:pointer;
    display:flex; align-items:center; padding:0 3px; flex:none;
    transition:background var(--dur-base) var(--ease-out); }
  .sett__tog--on{ background:var(--accent); }
  .sett__tog--off{ background:var(--surface-inset); border:1px solid var(--border-strong); }
  .sett__togknob{ width:14px; height:14px; border-radius:999px; background:var(--surface-panel);
    flex:none; box-shadow:0 1px 3px oklch(0.4 0.02 70 / 0.2);
    transition:transform var(--dur-base) var(--ease-out); }
  .sett__togknob--on{ transform:translateX(16px); }

  .sett__seg{ display:flex; border:1px solid var(--border-strong); border-radius:var(--radius-sm); overflow:hidden; }
  .sett__segbtn{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); padding:5px 12px;
    background:transparent; border:none; border-right:1px solid var(--border-default); cursor:pointer;
    transition:background var(--dur-fast), color var(--dur-fast); }
  .sett__segbtn:last-child{ border-right:0; }
  .sett__segbtn:hover{ background:var(--surface-hover); color:var(--text-strong); }
  .sett__segbtn--on{ background:var(--surface-raised); color:var(--text-strong); font-weight:600; }

  .sett__range{ -webkit-appearance:none; appearance:none; height:4px;
    background:var(--surface-inset); border-radius:999px; cursor:pointer; width:120px; outline:none; }
  .sett__range::-webkit-slider-thumb{ -webkit-appearance:none; width:14px; height:14px;
    border-radius:999px; background:var(--accent); cursor:pointer; }
  .sett__range::-moz-range-thumb{ width:14px; height:14px; border-radius:999px;
    background:var(--accent); border:none; cursor:pointer; }

  /* Auth */
  .sett__authcard{ background:var(--surface-raised); border:1px solid var(--border-default);
    border-radius:var(--radius-md); padding:20px 20px 18px; display:flex; flex-direction:column; gap:14px; }
  .sett__authcardhead{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase;
    letter-spacing:.12em; color:var(--text-muted); margin-bottom:2px; }
  .sett__authinputrow{ display:flex; flex-direction:column; gap:5px; }
  .sett__authlabel{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .sett__authdivider{ display:flex; align-items:center; gap:12px; }
  .sett__authdivider::before,.sett__authdivider::after{ content:""; flex:1; height:1px; background:var(--border-default); }
  .sett__authdividertext{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .sett__authcards{ display:flex; flex-direction:column; gap:10px; margin-top:2px; }

  /* Watchlist table */
  .sett__wltable{ margin:10px 0 0; display:flex; flex-direction:column; }
  .sett__wlhead{ display:grid; grid-template-columns:56px 1fr auto auto 26px; gap:12px; align-items:center;
    padding:0 0 7px; border-bottom:1px solid var(--border-default);
    font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
  .sett__wlrow{ display:grid; grid-template-columns:56px 1fr auto auto 26px; gap:12px;
    align-items:center; padding:9px 0; border-bottom:1px solid var(--border-default); }
  .sett__wlrow:last-child{ border-bottom:0; }
  .sett__wlticker{ font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-strong); }
  .sett__wlname{ font-family:var(--font-sans); font-size:12px; color:var(--text-muted);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sett__wlalert{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
  .sett__wlremove{ display:flex; align-items:center; justify-content:center; width:22px; height:22px;
    background:transparent; border:none; color:var(--text-dim); cursor:pointer;
    border-radius:var(--radius-sm); transition:background var(--dur-fast), color var(--dur-fast); }
  .sett__wlremove:hover{ background:var(--surface-hover); color:var(--down-500); }
`;

// ── main component ────────────────────────────────────────────────────────────

function Settings({
  following,
  setFollowing
}) {
  window.useStyle("kit-settings", SETT_CSS);
  const [revealed, setRevealed] = useStateSett({});
  const scrollRef = useRefSett(null);

  // Profile
  const [displayName, setDisplayName] = useStateSett("James Chen");
  const [email, setEmail] = useStateSett("james.chen@icloud.com");
  const [password, setPassword] = useStateSett("trader2024");
  const [phone, setPhone] = useStateSett("+1 (646) 555-0182");

  // Credential gate — each field's edit box only appears after verifying the current password
  const [unlocked, setUnlocked] = useStateSett({
    email: false,
    password: false,
    phone: false
  });
  const [gateOpen, setGateOpen] = useStateSett(null);
  const [gatePw, setGatePw] = useStateSett("");
  const [gateErr, setGateErr] = useStateSett(false);
  const maskUser = e => {
    const at = e.indexOf("@");
    return at < 0 ? e : "•".repeat(at) + e.slice(at);
  };
  const maskPhone = p => {
    const total = (p.match(/\d/g) || []).length;
    let seen = 0;
    return p.replace(/\d/g, () => ++seen > total - 4 ? p.replace(/\D/g, "").slice(-4)[seen - 1 - (total - 4)] : "•");
  };

  // Auth
  const [twoFA, setTwoFA] = useStateSett(true);

  // Watchlist
  const [autoAdd, setAutoAdd] = useStateSett(true);
  const [proposeFirst, setProposeFirst] = useStateSett(false);

  // Agent
  const [researchDepth, setResearchDepth] = useStateSett("standard");
  const [researchSchedule, setResearchSchedule] = useStateSett("daily");

  // Notifications
  const [alertChannel, setAlertChannel] = useStateSett("email");
  const [priceAlertPct, setPriceAlertPct] = useStateSett(5);
  const [dailyDigest, setDailyDigest] = useStateSett(true);
  const [weeklyDigest, setWeeklyDigest] = useStateSett(false);

  // Display
  const [refreshInterval, setRefreshInterval] = useStateSett("15m");
  const toggleReveal = id => setRevealed(r => ({
    ...r,
    [id]: !r[id]
  }));
  const openGate = field => {
    setGateOpen(field);
    setGatePw("");
    setGateErr(false);
  };
  const cancelGate = () => {
    setGateOpen(null);
    setGatePw("");
    setGateErr(false);
  };
  const lockField = field => setUnlocked(u => ({
    ...u,
    [field]: false
  }));
  const submitGate = field => {
    if (gatePw === password) {
      setUnlocked(u => ({
        ...u,
        [field]: true
      }));
      setGateOpen(null);
      setGatePw("");
      setGateErr(false);
    } else setGateErr(true);
  };
  const credControls = (field, value, setValue, masked, type = "text") => {
    if (unlocked[field]) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
      className: "sett__input",
      type: type,
      value: value,
      style: {
        width: "180px"
      },
      onChange: e => setValue(e.target.value)
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => lockField(field)
    }, "Lock"));
    if (gateOpen === field) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
      className: "sett__input",
      type: "password",
      placeholder: "Current password",
      style: {
        width: "140px"
      },
      autoFocus: true,
      value: gatePw,
      onChange: e => {
        setGatePw(e.target.value);
        setGateErr(false);
      },
      onKeyDown: e => {
        if (e.key === "Enter") submitGate(field);
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: () => submitGate(field)
    }, "Unlock"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: cancelGate
    }, "Cancel"));
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "sett__val"
    }, masked), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => openGate(field)
    }, "Edit"));
  };
  const credHint = (field, base) => gateOpen === field ? gateErr ? "Incorrect password — try again" : "Enter your current password (demo: trader2024)" : base;
  const removeStock = ticker => setFollowing(prev => prev.filter(f => f.ticker !== ticker));
  const initials = displayName.split(" ").map(w => w[0]).slice(0, 2).join("");
  return /*#__PURE__*/React.createElement("div", {
    className: "sett"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sett__scroll",
    ref: scrollRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "sett__content"
  }, /*#__PURE__*/React.createElement(Sec, {
    id: "profile",
    title: "Profile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sett__avatarrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sett__avatar"
  }, initials), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sett__avname"
  }, displayName), /*#__PURE__*/React.createElement("div", {
    className: "sett__avsub"
  }, "Personal workspace"))), /*#__PURE__*/React.createElement(SRow, {
    label: "Display name",
    hint: "Shown in session history and alerts"
  }, /*#__PURE__*/React.createElement("input", {
    className: "sett__input",
    value: displayName,
    onChange: e => setDisplayName(e.target.value)
  })), /*#__PURE__*/React.createElement(SRow, {
    label: "Password",
    hint: credHint("password", "Used to sign in to your account")
  }, credControls("password", password, setPassword, "••••••••••••")), /*#__PURE__*/React.createElement(SRow, {
    label: "Email",
    hint: credHint("email", "Used for alerts and digest")
  }, credControls("email", email, setEmail, maskUser(email))), /*#__PURE__*/React.createElement(SRow, {
    label: "Phone",
    hint: credHint("phone", "Optional · SMS alerts")
  }, credControls("phone", phone, setPhone, maskPhone(phone))), /*#__PURE__*/React.createElement(SRow, {
    label: "Timezone",
    hint: "Affects digest delivery and alert timestamps",
    noBorder: true
  }, /*#__PURE__*/React.createElement("span", {
    className: "sett__val"
  }, "America/New_York (UTC\u22124)"))), /*#__PURE__*/React.createElement(Sec, {
    id: "auth",
    title: "Authentication"
  }, /*#__PURE__*/React.createElement(SRow, {
    label: "API key",
    hint: "Secret key \u2014 treat like a password"
  }, /*#__PURE__*/React.createElement(BlurField, {
    id: "apikey",
    value: "asa_live_k8x2m9p4q1r7n3t6w5y0",
    revealed: revealed.apikey,
    onToggle: toggleReveal
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Regenerate")), /*#__PURE__*/React.createElement(SRow, {
    label: "Two-factor authentication",
    hint: twoFA ? "Enabled · authenticator app" : "Disabled · your account is less secure",
    noBorder: true
  }, /*#__PURE__*/React.createElement(Tog, {
    on: twoFA,
    onChange: setTwoFA
  }))), /*#__PURE__*/React.createElement(Sec, {
    id: "watchlist",
    title: "Watchlist"
  }, /*#__PURE__*/React.createElement(SRow, {
    label: "Agent can auto-add discoveries",
    hint: "High-significance names found in research are stored without asking you first"
  }, /*#__PURE__*/React.createElement(Tog, {
    on: autoAdd,
    onChange: setAutoAdd
  })), /*#__PURE__*/React.createElement(SRow, {
    label: "Propose before adding",
    hint: "Show candidates in the research panel for your confirmation, regardless of significance",
    noBorder: true
  }, /*#__PURE__*/React.createElement(Tog, {
    on: proposeFirst,
    onChange: setProposeFirst
  }))), /*#__PURE__*/React.createElement(Sec, {
    id: "agent",
    title: "AI Agent"
  }, /*#__PURE__*/React.createElement(SRow, {
    label: "Research depth",
    hint: "How many sources and turns per task \xB7 change per-session from the chat bar"
  }, /*#__PURE__*/React.createElement(Seg, {
    value: researchDepth,
    onChange: setResearchDepth,
    options: [{
      value: "quick",
      label: "Quick"
    }, {
      value: "standard",
      label: "Standard"
    }, {
      value: "deep",
      label: "Deep"
    }]
  })), /*#__PURE__*/React.createElement(SRow, {
    label: "Research schedule",
    hint: "When the agent runs autonomous sessions without a prompt from you",
    noBorder: true
  }, /*#__PURE__*/React.createElement(Seg, {
    value: researchSchedule,
    onChange: setResearchSchedule,
    options: [{
      value: "manual",
      label: "Manual"
    }, {
      value: "daily",
      label: "Daily"
    }, {
      value: "weekly",
      label: "Weekly"
    }]
  }))), /*#__PURE__*/React.createElement(Sec, {
    id: "notifications",
    title: "Notifications"
  }, /*#__PURE__*/React.createElement(SRow, {
    label: "Alert delivery",
    hint: "How the agent reaches you for price moves and high-significance findings"
  }, /*#__PURE__*/React.createElement(Seg, {
    value: alertChannel,
    onChange: setAlertChannel,
    options: [{
      value: "off",
      label: "Off"
    }, {
      value: "email",
      label: "Email"
    }, {
      value: "push",
      label: "Push"
    }, {
      value: "both",
      label: "Both"
    }]
  })), /*#__PURE__*/React.createElement(SRow, {
    label: "Price alert threshold",
    hint: `Alerts on moves beyond ±${priceAlertPct}% in a trading session`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "9px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      color: "var(--text-dim)",
      minWidth: "24px"
    }
  }, "2%"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "sett__range",
    min: 2,
    max: 15,
    step: 1,
    value: priceAlertPct,
    onChange: e => setPriceAlertPct(+e.target.value)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      color: "var(--text-dim)",
      minWidth: "28px"
    }
  }, priceAlertPct, "%"))), /*#__PURE__*/React.createElement(SRow, {
    label: "Daily digest",
    hint: "A brief summary of what the agent found, delivered each morning"
  }, /*#__PURE__*/React.createElement(Tog, {
    on: dailyDigest,
    onChange: setDailyDigest
  })), /*#__PURE__*/React.createElement(SRow, {
    label: "Weekly summary",
    hint: "A deeper look at the week's research, delivered Sunday",
    noBorder: true
  }, /*#__PURE__*/React.createElement(Tog, {
    on: weeklyDigest,
    onChange: setWeeklyDigest
  }))), /*#__PURE__*/React.createElement(Sec, {
    id: "display",
    title: "Display"
  }, /*#__PURE__*/React.createElement(SRow, {
    label: "Quote data refresh",
    hint: "How often the watchlist price data updates in the background",
    noBorder: true
  }, /*#__PURE__*/React.createElement(Seg, {
    value: refreshInterval,
    onChange: setRefreshInterval,
    options: [{
      value: "off",
      label: "Off"
    }, {
      value: "15m",
      label: "15m"
    }, {
      value: "1h",
      label: "1h"
    }]
  }))))));
}
Object.assign(window, {
  Settings
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/TodayFeed.jsx
try { (() => {
// TodayFeed — the main/center view. "Today's update" hero (the full current research of the day)
// followed by today's live surface: articles, reports, filings and clips the agent used or that
// the semantic scraper matched. Each card is ephemeral — research it to keep it, else it clears.
// Exports window.TodayUpdate and window.NewsFeed.

const {
  Button: TFButton
} = window.AIStockAgentDesignSystem_ea6e23;
const TODAY_CSS = `
  .tf{ max-width:880px; margin:0 auto; padding:26px 28px 60px; }

  /* ---- Today's update hero ---- */
  .tu{ border-bottom:1px solid var(--border-strong); padding-bottom:26px; margin-bottom:26px; }
  .tu__eyebrow{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .tu__kicker{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:var(--accent-quiet); }
  .tu__dot{ width:5px; height:5px; border-radius:999px; background:var(--accent); }
  .tu__date{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); letter-spacing:.04em; }
  .tu__gen{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; }
  .tu__headline{ font-family:var(--font-display); font-size:34px; font-weight:700; letter-spacing:-.015em;
    line-height:1.1; color:var(--text-strong); margin:0 0 16px; text-wrap:balance; }
  .tu__lede{ font-family:var(--font-serif); font-size:18px; line-height:1.55; color:var(--text-body); margin:0 0 22px; max-width:680px; text-wrap:pretty; }
  .tu__threads{ display:flex; flex-direction:column; gap:0; }
  .tu__thread{ display:grid; grid-template-columns:26px 1fr; gap:14px; padding:14px 0; border-top:1px solid var(--border-default); }
  .tu__thread:first-child{ border-top:0; }
  .tu__tnum{ font-family:var(--font-mono); font-size:11px; color:var(--accent-quiet); padding-top:3px; font-variant-numeric:tabular-nums; }
  .tu__ttext{ font-family:var(--font-serif); font-size:15px; line-height:1.55; color:var(--text-muted); margin:0; text-wrap:pretty; }

  /* ---- News feed ---- */
  .nf__head{ display:flex; align-items:baseline; gap:12px; margin:0 0 16px; }
  .nf__h{ font-family:var(--font-display); font-size:17px; font-weight:700; color:var(--text-strong); }
  .nf__sub{ font-family:var(--font-mono); font-size:11px; color:var(--text-dim); }
  .nf__note{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; display:flex; align-items:center; gap:6px; }
  .nf{ display:flex; flex-direction:column; gap:16px; }

  .nc{ display:grid; grid-template-columns:172px 1fr; gap:18px; padding:16px; background:var(--surface-panel);
    border:1px solid var(--border-default); border-radius:var(--radius-md);
    transition:border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out); }
  .nc:hover{ border-color:var(--border-strong); }
  .nc--saved{ border-color:color-mix(in oklch, var(--up-500), transparent 55%); }

  .nc__media{ position:relative; aspect-ratio:4/3; border:1px solid var(--border-default); border-radius:var(--radius-sm); overflow:hidden;
    background:repeating-linear-gradient(135deg, var(--surface-inset), var(--surface-inset) 7px, var(--surface-raised) 7px, var(--surface-raised) 14px);
    display:flex; align-items:flex-end; }
  .nc__medialabel{ font-family:var(--font-mono); font-size:9px; color:var(--text-muted); letter-spacing:.04em;
    background:color-mix(in oklch, var(--bg-app), transparent 8%); padding:4px 6px; margin:7px; border-radius:var(--radius-xs); position:relative; z-index:1; }
  .nc__play{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--text-muted); }
  .nc__playdot{ width:38px; height:38px; border-radius:999px; background:color-mix(in oklch, var(--bg-app), transparent 8%);
    border:1px solid var(--border-strong); display:flex; align-items:center; justify-content:center; color:var(--text-strong); }

  .nc__body{ display:flex; flex-direction:column; min-width:0; }
  .nc__tags{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-bottom:9px; }
  .nc__rel{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; }
  .nc__rel--used{ color:var(--accent-quiet); }
  .nc__rel--related{ color:var(--text-muted); }
  .nc__kind{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
  .nc__topic{ font-family:var(--font-display); font-size:17px; font-weight:600; line-height:1.25; color:var(--text-strong);
    margin:0 0 8px; text-decoration:none; display:inline-flex; align-items:flex-start; gap:7px; text-wrap:pretty; }
  .nc__topic:hover{ color:var(--accent-quiet); }
  .nc__topic svg{ flex:none; margin-top:4px; opacity:.5; }
  .nc__topic:hover svg{ opacity:1; }
  .nc__meta{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .nc__metaicon{ display:inline-flex; align-items:center; gap:5px; }
  .nc__metaicon svg{ stroke:var(--text-dim); }
  .nc__sep{ opacity:.4; }
  .nc__excerpt{ font-family:var(--font-serif); font-size:14px; line-height:1.55; color:var(--text-muted); margin:0 0 14px; text-wrap:pretty; }
  .nc__foot{ display:flex; align-items:center; gap:10px; margin-top:auto; }
  .nc__src{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .nc__actions{ margin-left:auto; display:flex; align-items:center; gap:8px; }
  .nc__expire{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); display:inline-flex; align-items:center; gap:5px; }
  .nc__saved{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:var(--up-500); display:inline-flex; align-items:center; gap:5px; }
`;
function TodayUpdate({
  today
}) {
  window.useStyle("kit-today", TODAY_CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: "tu"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tu__eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tu__dot"
  }), /*#__PURE__*/React.createElement("span", {
    className: "tu__kicker"
  }, "Today's update"), /*#__PURE__*/React.createElement("span", {
    className: "tu__date"
  }, today.date), /*#__PURE__*/React.createElement("span", {
    className: "tu__gen"
  }, "generated ", today.generatedAt)), /*#__PURE__*/React.createElement("h1", {
    className: "tu__headline"
  }, today.headline), /*#__PURE__*/React.createElement("p", {
    className: "tu__lede"
  }, today.body), /*#__PURE__*/React.createElement("div", {
    className: "tu__threads"
  }, (today.threads || []).map((t, i) => /*#__PURE__*/React.createElement("div", {
    className: "tu__thread",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "tu__tnum"
  }, String(i + 1).padStart(2, "0")), /*#__PURE__*/React.createElement("p", {
    className: "tu__ttext"
  }, t)))));
}
function NewsCard({
  item,
  saved,
  onResearch,
  onSave
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `nc${saved ? " nc--saved" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "nc__media"
  }, item.media === "video" && /*#__PURE__*/React.createElement("span", {
    className: "nc__play"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nc__playdot"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "play",
    size: 15
  }))), /*#__PURE__*/React.createElement("span", {
    className: "nc__medialabel"
  }, item.mediaLabel)), /*#__PURE__*/React.createElement("div", {
    className: "nc__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nc__tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: `nc__rel nc__rel--${item.relevance}`
  }, item.relevance === "used" ? "used in today's research" : "semantically related"), /*#__PURE__*/React.createElement("span", {
    className: "nc__kind"
  }, item.kind)), /*#__PURE__*/React.createElement("a", {
    className: "nc__topic",
    href: item.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, item.topic, /*#__PURE__*/React.createElement(window.Icon, {
    name: "external-link",
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    className: "nc__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nc__metaicon"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "layers",
    size: 11
  }), item.industry), /*#__PURE__*/React.createElement("span", {
    className: "nc__sep"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "nc__metaicon"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "globe",
    size: 11
  }), item.macro)), /*#__PURE__*/React.createElement("p", {
    className: "nc__excerpt"
  }, item.excerpt), /*#__PURE__*/React.createElement("div", {
    className: "nc__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nc__src"
  }, item.source, " \xB7 ", item.at), /*#__PURE__*/React.createElement("div", {
    className: "nc__actions"
  }, saved ? /*#__PURE__*/React.createElement("span", {
    className: "nc__saved"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "check",
    size: 12
  }), "saved to database") : /*#__PURE__*/React.createElement("span", {
    className: "nc__expire"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "clock",
    size: 11
  }), "clears at end of day"), /*#__PURE__*/React.createElement(TFButton, {
    variant: "ghost",
    size: "sm",
    onClick: () => onResearch(item)
  }, "Research"), /*#__PURE__*/React.createElement(TFButton, {
    variant: saved ? "secondary" : "primary",
    size: "sm",
    onClick: () => onSave(item.id)
  }, saved ? "Saved" : "Save")))));
}
function NewsFeed({
  news,
  saved,
  onResearch,
  onSave
}) {
  const usedCount = news.filter(n => n.relevance === "used").length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "nf__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nf__h"
  }, "Today's surface"), /*#__PURE__*/React.createElement("span", {
    className: "nf__sub"
  }, news.length, " items \xB7 ", usedCount, " used by the agent"), /*#__PURE__*/React.createElement("span", {
    className: "nf__note"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "clock",
    size: 11
  }), "not stored unless you research it")), /*#__PURE__*/React.createElement("div", {
    className: "nf"
  }, news.map(item => /*#__PURE__*/React.createElement(NewsCard, {
    key: item.id,
    item: item,
    saved: !!saved[item.id],
    onResearch: onResearch,
    onSave: onSave
  }))));
}
function TodayMain({
  today,
  news,
  saved,
  onResearch,
  onSave
}) {
  window.useStyle("kit-today", TODAY_CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: "tf"
  }, /*#__PURE__*/React.createElement(TodayUpdate, {
    today: today
  }), /*#__PURE__*/React.createElement(NewsFeed, {
    news: news,
    saved: saved,
    onResearch: onResearch,
    onSave: onSave
  }));
}
Object.assign(window, {
  TodayUpdate,
  NewsFeed,
  NewsCard,
  TodayMain
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/TodayFeed.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Tweaks.jsx
try { (() => {
/* Expressive tweak layer for the research desk.
 * Everything in this kit reads from CSS custom-property tokens, so each control here
 * rewrites a *family* of tokens at :root and the whole desk re-skins in one move —
 * no per-element pixel-pushing. Three knobs that change the feel:
 *   · Mood    — the surface + ink palette (warm paper / cool slate / dark carbon)
 *   · Accent  — the brand hue, rotated across the signal ramp + tints + selection
 *   · Edges   — the radius character (squared instrument ↔ soft paper)
 */
const {
  useEffect: useEffectTwk
} = React;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "paper",
  "accent": "#5b9270",
  "edges": "default"
} /*EDITMODE-END*/;

/* ---- Mood: rewrite the paper + ink + line ramps; semantics cascade from them. ---- */
const MOODS = {
  paper: {},
  // ships as-is — warm off-white
  slate: {
    "--paper-0": "oklch(0.995 0.003 250)",
    "--paper-50": "oklch(0.985 0.004 250)",
    "--paper-100": "oklch(0.969 0.006 250)",
    "--paper-200": "oklch(0.945 0.008 250)",
    "--paper-300": "oklch(0.924 0.010 250)",
    "--paper-400": "oklch(0.890 0.012 250)",
    "--paper-500": "oklch(0.845 0.014 250)",
    "--paper-600": "oklch(0.780 0.014 250)",
    "--ink-1": "oklch(0.275 0.022 258)",
    "--ink-2": "oklch(0.415 0.022 258)",
    "--ink-3": "oklch(0.550 0.020 258)",
    "--ink-4": "oklch(0.670 0.016 258)",
    "--line-1": "oklch(0.905 0.010 252)",
    "--line-2": "oklch(0.850 0.014 252)",
    "--grid": "oklch(0.935 0.008 252)"
  },
  carbon: {
    "--paper-0": "oklch(0.255 0.008 75)",
    "--paper-50": "oklch(0.288 0.009 75)",
    "--paper-100": "oklch(0.212 0.008 75)",
    "--paper-200": "oklch(0.318 0.010 75)",
    "--paper-300": "oklch(0.182 0.007 75)",
    "--paper-400": "oklch(0.372 0.010 75)",
    "--paper-500": "oklch(0.442 0.012 75)",
    "--paper-600": "oklch(0.520 0.012 75)",
    "--ink-1": "oklch(0.948 0.008 80)",
    "--ink-2": "oklch(0.832 0.009 80)",
    "--ink-3": "oklch(0.672 0.010 80)",
    "--ink-4": "oklch(0.560 0.010 80)",
    "--line-1": "oklch(0.345 0.008 78)",
    "--line-2": "oklch(0.432 0.010 78)",
    "--grid": "oklch(0.300 0.006 80)",
    // On dark surfaces the quiet accent + on-accent text need to flip lighter.
    "--text-on-signal": "oklch(0.99 0.003 85)",
    "--shadow-panel": "0 1px 2px oklch(0 0 0 / 0.30), 0 2px 8px -1px oklch(0 0 0 / 0.40)",
    "--shadow-raised": "0 2px 8px oklch(0 0 0 / 0.40), 0 18px 40px -14px oklch(0 0 0 / 0.55)"
  }
};

/* ---- Accent: one hue drives the whole signal ramp (chroma/lightness held). ---- */
const ACCENT_HUE = {
  "#5b9270": 153,
  // Sage  — the default
  "#4d7ec9": 250,
  // Cobalt
  "#a07b3c": 68,
  // Amber
  "#b06a52": 35 // Terracotta
};
const ACCENT_SWATCHES = Object.keys(ACCENT_HUE);
function accentVars(hex, mood) {
  const h = ACCENT_HUE[hex] ?? 153;
  const vars = {
    "--signal-300": `oklch(0.86 0.050 ${h})`,
    "--signal-400": `oklch(0.74 0.072 ${h})`,
    "--signal-500": `oklch(0.605 0.090 ${h})`,
    "--signal-600": `oklch(0.520 0.088 ${h})`,
    "--signal-700": `oklch(0.440 0.078 ${h})`,
    "--signal-soft": `oklch(0.605 0.090 ${h} / 0.14)`,
    "--selection-bg": `oklch(0.605 0.090 ${h} / 0.18)`
  };
  // In carbon the "quiet" text accent would be too dark on dark — lift it.
  if (mood === "carbon") vars["--accent-quiet"] = `oklch(0.760 0.072 ${h})`;
  return vars;
}

/* ---- Edges: squared instrument ↔ soft paper. ---- */
const EDGES = {
  sharp: {
    "--radius-xs": "0px",
    "--radius-sm": "0px",
    "--radius-md": "1px",
    "--radius-lg": "2px",
    "--radius-full": "999px"
  },
  default: {},
  soft: {
    "--radius-xs": "5px",
    "--radius-sm": "8px",
    "--radius-md": "12px",
    "--radius-lg": "18px",
    "--radius-full": "999px"
  }
};
function TweakLayer() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  useEffectTwk(() => {
    const vars = {
      ...(MOODS[t.mood] || {}),
      ...accentVars(t.accent, t.mood),
      ...(EDGES[t.edges] || {})
    };
    let el = document.getElementById("tweak-overrides");
    if (!el) {
      el = document.createElement("style");
      el.id = "tweak-overrides";
      document.head.appendChild(el);
    }
    const body = Object.entries(vars).map(([k, v]) => `${k}:${v};`).join("");
    el.textContent = `:root{${body}}`;
  }, [t.mood, t.accent, t.edges]);
  return /*#__PURE__*/React.createElement(window.TweaksPanel, {
    title: "Tweaks"
  }, /*#__PURE__*/React.createElement(window.TweakSection, {
    label: "Mood"
  }), /*#__PURE__*/React.createElement(window.TweakRadio, {
    label: "Surface",
    value: t.mood,
    options: ["paper", "slate", "carbon"],
    onChange: v => setTweak("mood", v)
  }), /*#__PURE__*/React.createElement(window.TweakSection, {
    label: "Accent"
  }), /*#__PURE__*/React.createElement(window.TweakColor, {
    label: "Brand hue",
    value: t.accent,
    options: ACCENT_SWATCHES,
    onChange: v => setTweak("accent", v)
  }), /*#__PURE__*/React.createElement(window.TweakSection, {
    label: "Edges"
  }), /*#__PURE__*/React.createElement(window.TweakRadio, {
    label: "Radius",
    value: t.edges,
    options: ["sharp", "default", "soft"],
    onChange: v => setTweak("edges", v)
  }));
}
Object.assign(window, {
  TweakLayer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Tweaks.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/WorldBoard.jsx
try { (() => {
// WorldBoard — the unified surveillance view, the center of the terminal. Read like an intelligence
// dossier, not a dashboard: the information leads, the UI recedes. It opens with the agent's
// OVERVIEW synthesizing every domain it swept, then walks the research database's domains in order —
// Geopolitics (with the news & events inside each), Macroeconomics, Industry trends, General market.
// Every statement is a fact first; click it to expand the agent's full read, the propagation chain,
// the reports behind it, the names it threads to, and a way into research. Exports window.WorldBoard.

const {
  Sparkline: WBSparkline
} = window.AIStockAgentDesignSystem_ea6e23;
const {
  useEffect: useEffectWB,
  useRef: useRefWB,
  useState: useStateWB
} = React;

// Significance is shown as a TIME HORIZON, never a number: what matters NOW vs. what's BUILDING and
// will matter ahead. No one cares about a 0.74 — they care whether to act on it now or watch it.
function HorizonTag({
  horizon
}) {
  const h = horizon === "ahead" ? "ahead" : "now";
  const label = h === "ahead" ? "Building" : "Now";
  return /*#__PURE__*/React.createElement("span", {
    className: `wb__hz wb__hz--${h}`
  }, label);
}
const WB_CSS = `
  .wb{ display:block; height:100%; overflow-y:auto; background:var(--bg-app); }

  /* ===== Overview band ===== */
  .wb__ov{ padding:24px 28px 20px; border-bottom:1px solid var(--border-strong); background:var(--surface-panel); }
  .wb__ovmeta{ display:flex; align-items:baseline; gap:12px; margin-bottom:14px; }
  .wb__ovlabel{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.2em; color:var(--accent-quiet);
    display:inline-flex; align-items:center; gap:8px; }
  .wb__ovlabel::before{ content:""; width:6px; height:6px; border-radius:999px; background:var(--accent); animation:asa-pulse 1.6s var(--ease-out) infinite; }
  .wb__ovwhen{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); }
  .wb__ovretain{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; white-space:nowrap; }
  .wb__ovtitle{ font-family:var(--font-display); font-size:clamp(20px, 2.1vw, 27px); font-weight:700; letter-spacing:-.018em; line-height:1.2; color:var(--text-strong);
    margin:0 0 14px; max-width:840px; text-wrap:pretty; }
  .wb__ovbody{ font-family:var(--font-serif); font-size:15px; line-height:1.65; color:var(--text-body); margin:0 0 12px; max-width:840px; text-wrap:pretty; }
  .wb__ovctx{ font-family:var(--font-serif); font-size:14px; line-height:1.62; color:var(--text-muted); margin:0; max-width:824px; text-wrap:pretty; }

  /* aspects — the overview of all aspects found, one declarative line each, click to jump */
  .wb__aspects{ display:flex; flex-direction:column; margin-top:20px; border-top:1px solid var(--border-default); }
  .wb__aspect{ display:grid; grid-template-columns:128px 60px 1fr; gap:14px; align-items:baseline; text-align:left;
    padding:11px 4px; border:0; border-bottom:1px solid var(--border-default); background:transparent; cursor:pointer; width:100%; }
  .wb__aspectdomain{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
  .wb__aspectline{ font-family:var(--font-serif); font-size:13.5px; line-height:1.5; color:var(--text-body); text-wrap:pretty; }

  /* horizon — significance as time, not a number; plain text, no box */
  .wb__hz{ font-family:var(--font-mono); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; white-space:nowrap; }
  .wb__hz--now{ color:var(--red-500); }
  .wb__hz--ahead{ color:var(--accent-quiet); }
  .wb__hzgroup{ margin-bottom:6px; }
  .wb__hzhead{ display:flex; align-items:baseline; gap:10px; padding:18px 4px 8px; }
  .wb__hzsub{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); letter-spacing:.02em; }

  /* ===== Tape ribbon ===== */
  .wb__tape{ display:flex; border-bottom:1px solid var(--border-default); background:var(--surface-raised); overflow-x:auto; }
  .wb__tapecell{ flex:1; min-width:124px; padding:10px 16px; border-right:1px solid var(--border-default); display:flex; flex-direction:column; gap:3px; }
  .wb__tapecell:last-child{ border-right:0; }
  .wb__tapelabel{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-dim); }
  .wb__taperow{ display:flex; align-items:baseline; gap:8px; }
  .wb__tapeval{ font-family:var(--font-mono); font-size:15px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }
  .wb__tapedelta{ font-family:var(--font-mono); font-size:10px; font-weight:600; font-variant-numeric:tabular-nums; }

  /* ===== Reading column ===== */
  .wb__inner{ max-width:900px; margin:0 auto; padding:14px 28px 80px; }
  .wb__sec{ scroll-margin-top:14px; padding-top:30px; }
  .wb__sechead{ display:flex; align-items:baseline; gap:12px; margin:0 0 6px; }
  .wb__seckick{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:var(--accent-quiet); }
  .wb__sectitle{ font-family:var(--font-display); font-size:21px; font-weight:700; letter-spacing:-.01em; color:var(--text-strong); }
  .wb__secaside{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; align-self:center; }
  .wb__secintro{ font-family:var(--font-serif); font-size:13.5px; line-height:1.6; color:var(--text-muted); margin:8px 0 6px; max-width:780px; text-wrap:pretty; }
  .wb__rule{ height:1px; background:var(--border-strong); margin:12px 0 4px; }

  /* ===== Expandable item (signals, events, industries) ===== */
  .wb__item{ border-bottom:1px solid var(--border-default); }
  .wb__head{ display:block; width:100%; text-align:left; background:transparent; border:0; cursor:pointer; padding:16px 4px;
    transition:background var(--dur-fast) var(--ease-out); }
  .wb__head:hover{ background:var(--surface-hover); }
  .wb__kicker{ display:flex; align-items:center; gap:10px; margin-bottom:9px; }
  .wb__dom{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.09em; color:var(--accent-quiet); }
  .wb__src{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); display:inline-flex; align-items:center; gap:5px; }
  .wb__chev{ margin-left:auto; color:var(--text-dim); display:inline-flex; transition:transform var(--dur-fast) var(--ease-out); }
  .wb__item--open .wb__chev{ transform:rotate(180deg); color:var(--accent); }
  .wb__fact{ font-family:var(--font-display); font-size:17px; font-weight:600; line-height:1.32; color:var(--text-strong); margin:0; text-wrap:pretty; }
  .wb__datum{ font-family:var(--font-mono); font-size:11px; color:var(--text-muted); margin-top:7px; font-variant-numeric:tabular-nums; letter-spacing:.01em; }

  /* risk dot for geopolitics */
  .wb__risk{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.08em; display:inline-flex; align-items:center; gap:6px; }
  .wb__risk::before{ content:""; width:7px; height:7px; border-radius:999px; background:currentColor; }
  .wb__risk-watch{ color:var(--accent-quiet); }
  .wb__risk-elevated{ color:var(--amber-500); }
  .wb__risk-acute{ color:var(--red-500); }
  .wb__region{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); }

  /* expanded body */
  .wb__body{ padding:0 4px 20px; }
  .wb__read{ font-family:var(--font-serif); font-size:14px; line-height:1.65; color:var(--text-body); margin:0 0 12px; max-width:760px; text-wrap:pretty; }
  .wb__detail{ font-family:var(--font-serif); font-size:13.5px; line-height:1.64; color:var(--text-muted); margin:0 0 16px; max-width:760px; text-wrap:pretty;
    padding-left:15px; border-left:2px solid var(--border-strong); }
  .wb__chain{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:0 0 16px; }
  .wb__chainnode{ font-family:var(--font-mono); font-size:10.5px; color:var(--text-body); background:var(--surface-inset);
    border:1px solid var(--border-default); border-radius:var(--radius-sm); padding:4px 9px; }
  .wb__chainarrow{ color:var(--text-dim); display:inline-flex; }

  .wb__blk{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--text-dim); margin:0 0 10px; }
  /* findings — the reports behind the statement */
  .wb__finds{ display:flex; flex-direction:column; border-top:1px solid var(--border-default); margin:0 0 16px; }
  .wb__find{ display:grid; grid-template-columns:1fr auto; gap:12px; align-items:start; padding:11px 2px; border-bottom:1px solid var(--border-default);
    text-decoration:none; transition:background var(--dur-fast) var(--ease-out); }
  .wb__find:hover{ background:var(--surface-hover); }
  .wb__findmain{ min-width:0; }
  .wb__findtitle{ font-family:var(--font-sans); font-size:13.5px; font-weight:500; line-height:1.4; color:var(--text-body); text-wrap:pretty; }
  .wb__find:hover .wb__findtitle{ color:var(--text-strong); }
  .wb__findmeta{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); margin-top:4px; display:flex; align-items:center; gap:7px; }
  .wb__findsrc{ color:var(--link); display:inline-flex; align-items:center; gap:4px; }
  .wb__findat{ font-family:var(--font-mono); font-size:9px; color:var(--text-dim); white-space:nowrap; padding-top:2px; }

  /* threads + affects */
  .wb__affects{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:0 0 16px; }
  .wb__affectlead{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); margin-right:2px; }
  .wb__affect{ font-family:var(--font-mono); font-size:10px; font-weight:600; display:inline-flex; align-items:center; gap:5px; }
  .wb__affect::before{ content:""; width:5px; height:5px; border-radius:999px; background:currentColor; }
  .wb__affect-tailwind{ color:var(--up-500); }
  .wb__affect-headwind{ color:var(--down-500); }
  .wb__affect-mixed{ color:var(--text-muted); }
  .wb__thread{ font-family:var(--font-mono); font-size:10px; color:var(--text-muted); }
  .wb__thread::before{ content:"·"; margin-right:8px; color:var(--text-dim); }

  /* actions */
  .wb__acts{ display:flex; flex-wrap:wrap; gap:8px; }
  .wb__act{ font-family:var(--font-mono); font-size:10px; letter-spacing:.03em; display:inline-flex; align-items:center; gap:6px;
    padding:6px 11px; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:transparent; color:var(--text-body);
    cursor:pointer; text-decoration:none; transition:background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast); }
  .wb__act:hover{ background:var(--surface-raised); border-color:var(--accent); color:var(--text-strong); }
  .wb__act svg{ stroke:var(--accent-quiet); }

  /* ===== Macro economies ===== */
  .wb__econ{ border-top:1px solid var(--border-default); margin:6px 0 18px; }
  .wb__econrow{ padding:14px 4px; border-bottom:1px solid var(--border-default); }
  .wb__econtop{ display:flex; align-items:center; gap:10px; margin-bottom:9px; }
  .wb__econcode{ font-family:var(--font-mono); font-size:10px; font-weight:700; letter-spacing:.06em; color:var(--accent-quiet); }
  .wb__econname{ font-family:var(--font-display); font-size:15px; font-weight:600; color:var(--text-strong); }
  .wb__econregime{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-left:auto; }
  .wb__econstrip{ display:flex; flex-wrap:wrap; gap:0 18px; margin-bottom:9px; }
  .wb__econkv{ font-family:var(--font-mono); font-size:11px; color:var(--text-body); font-variant-numeric:tabular-nums; }
  .wb__econkv b{ color:var(--text-strong); font-weight:600; margin-left:5px; }
  .wb__econnote{ font-family:var(--font-serif); font-size:13.5px; line-height:1.6; color:var(--text-muted); margin:0; max-width:760px; text-wrap:pretty; }

  /* macro / data rows — info first, no boxes */
  .wb__data{ border-top:1px solid var(--border-default); margin:6px 0 16px; }
  .wb__datarow{ display:grid; grid-template-columns:1fr auto 96px; gap:18px; align-items:center; padding:12px 4px; border-bottom:1px solid var(--border-default); }
  .wb__dlabel{ font-family:var(--font-sans); font-size:14px; font-weight:500; color:var(--text-body); }
  .wb__dsub{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; }
  .wb__dvalwrap{ text-align:right; }
  .wb__dval{ font-family:var(--font-mono); font-size:17px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }
  .wb__ddelta{ font-family:var(--font-mono); font-size:11px; font-weight:600; font-variant-numeric:tabular-nums; margin-left:8px; }
  .wb__dspark{ display:block; height:26px; }

  .wb__up{ color:var(--up-500); }
  .wb__down{ color:var(--down-500); }
  .wb__flat,.wb__neutral{ color:var(--text-muted); }

  /* the standing agent read — plain paragraph, no label, no border */
  .wb__readtext{ font-family:var(--font-serif); font-size:14px; line-height:1.65; color:var(--text-body); margin:18px 0 0; max-width:780px; text-wrap:pretty; }

  /* ===== Industry trends ===== */
  .wb__indmove{ font-family:var(--font-mono); font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; }
  .wb__bias{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.06em; }
  .wb__bias-tailwind{ color:var(--up-500); }
  .wb__bias-headwind{ color:var(--down-500); }
  .wb__bias-mixed{ color:var(--text-muted); }
  .wb__drivers{ display:flex; flex-direction:column; gap:7px; margin:0 0 16px; }
  .wb__driver{ display:flex; align-items:baseline; gap:9px; }
  .wb__driverdot{ font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; min-width:74px; }
  .wb__drivernote{ font-family:var(--font-serif); font-size:13px; line-height:1.5; color:var(--text-muted); }
  .wb__cons{ display:flex; flex-direction:column; border-top:1px solid var(--border-default); margin:0 0 16px; }
  .wb__con{ display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:10px 2px; border-bottom:1px solid var(--border-default);
    background:transparent; border-left:0; border-right:0; border-top:0; text-align:left; cursor:pointer; width:100%;
    transition:background var(--dur-fast) var(--ease-out); }
  .wb__con:hover{ background:var(--surface-hover); }
  .wb__conticker{ font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-strong); width:54px; }
  .wb__conname{ font-family:var(--font-sans); font-size:13px; color:var(--text-muted); min-width:0; }
  .wb__conchg{ font-family:var(--font-mono); font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }

  /* ===== General market ===== */
  .wb__idx{ display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); border-top:1px solid var(--border-default); border-left:1px solid var(--border-default); margin:6px 0 18px; }
  .wb__idxcell{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:11px 14px; border-right:1px solid var(--border-default); border-bottom:1px solid var(--border-default); }
  .wb__idxlabel{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); }
  .wb__idxright{ text-align:right; }
  .wb__idxval{ font-family:var(--font-mono); font-size:14px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }
  .wb__idxdelta{ font-family:var(--font-mono); font-size:10px; font-weight:600; font-variant-numeric:tabular-nums; margin-left:7px; }
  .wb__movers{ border-top:1px solid var(--border-default); margin:0 0 16px; }
  .wb__mover{ display:grid; grid-template-columns:60px 1fr auto auto; gap:14px; align-items:center; padding:13px 4px; border-bottom:1px solid var(--border-default);
    background:transparent; border-left:0; border-right:0; border-top:0; text-align:left; cursor:pointer; width:100%;
    transition:background var(--dur-fast) var(--ease-out); }
  .wb__mover:hover{ background:var(--surface-hover); }
  .wb__mvticker{ font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-strong); }
  .wb__mvname{ min-width:0; }
  .wb__mvnamemain{ font-family:var(--font-sans); font-size:13.5px; font-weight:500; color:var(--text-body); }
  .wb__mvpos{ font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-top:3px; text-wrap:pretty; }
  .wb__mvprice{ font-family:var(--font-mono); font-size:13px; color:var(--text-muted); font-variant-numeric:tabular-nums; text-align:right; }
  .wb__mvchg{ font-family:var(--font-mono); font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; text-align:right; min-width:60px; }

  /* live clip / image slot for news inside an event */
  .wb__media{ position:relative; aspect-ratio:16/9; width:100%; max-width:520px; border:1px solid var(--border-default); border-radius:var(--radius-md);
    background:repeating-linear-gradient(135deg, var(--surface-inset), var(--surface-inset) 9px, var(--surface-panel) 9px, var(--surface-panel) 18px);
    display:flex; align-items:center; justify-content:center; margin:0 0 16px; overflow:hidden; }
  .wb__mediaplay{ width:42px; height:42px; border-radius:999px; background:color-mix(in oklch, var(--bg-app), transparent 12%); border:1px solid var(--border-strong);
    display:flex; align-items:center; justify-content:center; color:var(--text-strong); }
  .wb__medialabel{ position:absolute; left:11px; bottom:9px; font-family:var(--font-mono); font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); }
  .wb__medialive{ position:absolute; right:11px; top:9px; font-family:var(--font-mono); font-size:9px; font-weight:700; letter-spacing:.12em; color:var(--red-500);
    display:inline-flex; align-items:center; gap:5px; }
  .wb__medialive::before{ content:""; width:6px; height:6px; border-radius:999px; background:var(--red-500); animation:asa-pulse 1.6s var(--ease-out) infinite; }
`;
function wbDeltaClass(chg, neutral) {
  if (neutral) return "wb__neutral";
  if (chg > 0) return "wb__up";
  if (chg < 0) return "wb__down";
  return "wb__flat";
}
function wbDeltaText(chg, unit) {
  const s = chg > 0 ? "+" : chg < 0 ? "−" : "";
  return `${s}${Math.abs(chg)}${unit || ""}`;
}
function wbSparkColor(chg, neutral) {
  if (neutral) return "var(--ink-3)";
  if (chg > 0) return "var(--up-500)";
  if (chg < 0) return "var(--down-500)";
  return "var(--text-dim)";
}

// The reports behind a statement — facts the scraper found, most significant first, link out.
function Findings({
  items
}) {
  if (!items || !items.length) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "wb__blk"
  }, "The reports behind it"), /*#__PURE__*/React.createElement("div", {
    className: "wb__finds"
  }, items.map((f, i) => /*#__PURE__*/React.createElement("a", {
    className: "wb__find",
    key: i,
    href: f.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__findmain"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__findtitle"
  }, f.title), /*#__PURE__*/React.createElement("span", {
    className: "wb__findmeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__findsrc"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "link",
    size: 9
  }), f.source))), /*#__PURE__*/React.createElement("span", {
    className: "wb__findat"
  }, f.at)))));
}
function Chain({
  nodes
}) {
  if (!nodes || !nodes.length) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "wb__chain"
  }, nodes.map((n, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "wb__chainarrow"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "chevron-right",
    size: 13
  })), /*#__PURE__*/React.createElement("span", {
    className: "wb__chainnode"
  }, n))));
}

// A live news clip / image placeholder — the user drops in real footage or imagery later.
function MediaSlot({
  media
}) {
  if (!media) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "wb__media"
  }, media.kind === "video" && /*#__PURE__*/React.createElement("span", {
    className: "wb__mediaplay"
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "play",
    size: 16
  })), media.live && /*#__PURE__*/React.createElement("span", {
    className: "wb__medialive"
  }, "live"), /*#__PURE__*/React.createElement("span", {
    className: "wb__medialabel"
  }, media.label));
}
function Actions({
  research,
  onResearch
}) {
  if (!research) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "wb__acts"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "wb__act",
    onClick: e => {
      e.stopPropagation();
      onResearch && onResearch(research);
    }
  }, /*#__PURE__*/React.createElement(window.Icon, {
    name: "search",
    size: 12
  }), "Open research"));
}
function WorldBoard({
  data,
  news,
  industries,
  following,
  onOpenIndustry,
  onPickStock,
  onResearch
}) {
  window.useStyle("kit-world", WB_CSS);
  const W = data;
  const O = W.overview || {};
  const scrollRef = useRefWB(null);
  const inds = industries || [];
  const book = following || [];
  const [open, setOpen] = useStateWB({
    s1: true,
    g1: true
  }); // lead items open by default
  const toggle = id => setOpen(o => ({
    ...o,
    [id]: !o[id]
  }));
  const scrollToId = id => {
    const root = scrollRef.current;
    if (!root) return;
    const el = root.querySelector(`#${id}`);
    if (el) root.scrollTo({
      top: el.offsetTop - root.querySelector(".wb__inner").offsetTop - 6,
      behavior: "smooth"
    });
  };
  // Left-nav domain jumps arrive as a window event.
  useEffectWB(() => {
    const onJump = e => scrollToId(`wb-${e.detail}`);
    window.addEventListener("world-jump", onJump);
    return () => window.removeEventListener("world-jump", onJump);
  }, []);
  const recByTicker = {};
  book.forEach(b => {
    recByTicker[b.ticker] = b;
  });
  const pickTicker = t => {
    const r = recByTicker[t];
    if (r && onPickStock) onPickStock(r);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "wb",
    ref: scrollRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__ov"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "wb__ovtitle"
  }, O.headline), /*#__PURE__*/React.createElement("p", {
    className: "wb__ovbody"
  }, O.body), /*#__PURE__*/React.createElement("p", {
    className: "wb__ovctx"
  }, O.context), /*#__PURE__*/React.createElement("div", {
    className: "wb__aspects"
  }, (O.aspects || []).map(a => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "wb__aspect",
    key: a.domain,
    onClick: () => scrollToId(`wb-${a.jump}`)
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__aspectdomain"
  }, a.domain), /*#__PURE__*/React.createElement(HorizonTag, {
    horizon: a.horizon
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb__aspectline"
  }, a.line))))), /*#__PURE__*/React.createElement("div", {
    className: "wb__tape"
  }, W.tape.map(t => /*#__PURE__*/React.createElement("div", {
    className: "wb__tapecell",
    key: t.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__tapelabel"
  }, t.label), /*#__PURE__*/React.createElement("span", {
    className: "wb__taperow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__tapeval"
  }, t.value), /*#__PURE__*/React.createElement("span", {
    className: `wb__tapedelta ${wbDeltaClass(t.chg)}`
  }, wbDeltaText(t.chg, t.unit)))))), /*#__PURE__*/React.createElement("div", {
    className: "wb__inner"
  }, /*#__PURE__*/React.createElement("section", {
    className: "wb__sec",
    id: "wb-signals",
    "data-screen-label": "Signals"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__sechead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__sectitle"
  }, "Signals that matter")), /*#__PURE__*/React.createElement("div", {
    className: "wb__rule"
  }), [{
    key: "now",
    label: "Now",
    sub: "moving the tape today"
  }, {
    key: "ahead",
    label: "Building",
    sub: "expected to matter ahead"
  }].map(grp => {
    const rows = (W.signals || []).filter(s => (s.horizon || "now") === grp.key);
    if (!rows.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "wb__hzgroup",
      key: grp.key
    }, /*#__PURE__*/React.createElement("div", {
      className: "wb__hzhead"
    }, /*#__PURE__*/React.createElement(HorizonTag, {
      horizon: grp.key
    }), /*#__PURE__*/React.createElement("span", {
      className: "wb__hzsub"
    }, grp.sub)), rows.map(s => {
      const isOpen = !!open[s.id];
      return /*#__PURE__*/React.createElement("div", {
        className: `wb__item ${isOpen ? "wb__item--open" : ""}`,
        key: s.id
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "wb__head",
        onClick: () => toggle(s.id)
      }, /*#__PURE__*/React.createElement("div", {
        className: "wb__kicker"
      }, /*#__PURE__*/React.createElement("span", {
        className: "wb__dom"
      }, s.domain), /*#__PURE__*/React.createElement("span", {
        className: "wb__src"
      }, /*#__PURE__*/React.createElement(window.Icon, {
        name: "link",
        size: 10
      }), s.sources, " sources"), /*#__PURE__*/React.createElement("span", {
        className: "wb__chev"
      }, /*#__PURE__*/React.createElement(window.Icon, {
        name: "chevron-down",
        size: 16
      }))), /*#__PURE__*/React.createElement("p", {
        className: "wb__fact"
      }, s.fact), /*#__PURE__*/React.createElement("div", {
        className: "wb__datum"
      }, s.datum)), isOpen && /*#__PURE__*/React.createElement("div", {
        className: "wb__body"
      }, /*#__PURE__*/React.createElement("p", {
        className: "wb__read"
      }, s.read), s.detail && /*#__PURE__*/React.createElement("p", {
        className: "wb__detail"
      }, s.detail), /*#__PURE__*/React.createElement(Chain, {
        nodes: s.chain
      }), /*#__PURE__*/React.createElement(Findings, {
        items: s.findings
      }), /*#__PURE__*/React.createElement(Actions, {
        research: s.research,
        onResearch: onResearch
      })));
    }));
  })), /*#__PURE__*/React.createElement("section", {
    className: "wb__sec",
    id: "wb-geopolitics",
    "data-screen-label": "Geopolitics"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__sechead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__sectitle"
  }, "Geopolitics & global events")), /*#__PURE__*/React.createElement("p", {
    className: "wb__secintro"
  }, W.geopolitics.intro), /*#__PURE__*/React.createElement("div", {
    className: "wb__rule"
  }), W.geopolitics.events.map(ev => {
    const isOpen = !!open[ev.id];
    return /*#__PURE__*/React.createElement("div", {
      className: `wb__item ${isOpen ? "wb__item--open" : ""}`,
      key: ev.id
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "wb__head",
      onClick: () => toggle(ev.id)
    }, /*#__PURE__*/React.createElement("div", {
      className: "wb__kicker"
    }, /*#__PURE__*/React.createElement(HorizonTag, {
      horizon: ev.horizon
    }), /*#__PURE__*/React.createElement("span", {
      className: `wb__risk wb__risk-${ev.risk}`
    }, ev.risk), /*#__PURE__*/React.createElement("span", {
      className: "wb__region"
    }, ev.region, " \xB7 ", ev.since), /*#__PURE__*/React.createElement("span", {
      className: "wb__chev"
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "chevron-down",
      size: 16
    }))), /*#__PURE__*/React.createElement("p", {
      className: "wb__fact"
    }, ev.fact), /*#__PURE__*/React.createElement("div", {
      className: "wb__datum"
    }, ev.datum)), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "wb__body"
    }, ev.media && /*#__PURE__*/React.createElement(MediaSlot, {
      media: ev.media
    }), /*#__PURE__*/React.createElement("p", {
      className: "wb__read"
    }, ev.read), ev.detail && /*#__PURE__*/React.createElement("p", {
      className: "wb__detail"
    }, ev.detail), /*#__PURE__*/React.createElement(Chain, {
      nodes: ev.chain
    }), /*#__PURE__*/React.createElement(Findings, {
      items: ev.findings
    }), /*#__PURE__*/React.createElement(Actions, {
      research: ev.research,
      onResearch: onResearch
    })));
  })), /*#__PURE__*/React.createElement("section", {
    className: "wb__sec",
    id: "wb-macro",
    "data-screen-label": "Macroeconomics"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__sechead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__sectitle"
  }, "Macroeconomics")), /*#__PURE__*/React.createElement("p", {
    className: "wb__secintro"
  }, W.macro.intro), /*#__PURE__*/React.createElement("div", {
    className: "wb__econ",
    style: {
      marginTop: 14
    }
  }, W.macro.economies.map(e => /*#__PURE__*/React.createElement("div", {
    className: "wb__econrow",
    key: e.code
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__econtop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__econcode"
  }, e.code), /*#__PURE__*/React.createElement("span", {
    className: "wb__econname"
  }, e.name), /*#__PURE__*/React.createElement("span", {
    className: "wb__econregime"
  }, e.regime)), /*#__PURE__*/React.createElement("div", {
    className: "wb__econstrip"
  }, e.metrics.map(([k, v]) => /*#__PURE__*/React.createElement("span", {
    className: "wb__econkv",
    key: k
  }, k, /*#__PURE__*/React.createElement("b", null, v)))), /*#__PURE__*/React.createElement("p", {
    className: "wb__econnote"
  }, e.note)))), /*#__PURE__*/React.createElement("div", {
    className: "wb__data"
  }, W.macro.indicators.map(m => /*#__PURE__*/React.createElement("div", {
    className: "wb__datarow",
    key: m.label
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wb__dlabel"
  }, m.label), m.sub && /*#__PURE__*/React.createElement("div", {
    className: "wb__dsub"
  }, m.sub)), /*#__PURE__*/React.createElement("div", {
    className: "wb__dvalwrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__dval"
  }, m.value), /*#__PURE__*/React.createElement("span", {
    className: `wb__ddelta ${wbDeltaClass(m.chg, m.neutral)}`
  }, wbDeltaText(m.chg, m.unit))), /*#__PURE__*/React.createElement(WBSparkline, {
    className: "wb__dspark",
    data: m.series,
    width: 92,
    height: 26,
    area: true,
    draw: false,
    color: wbSparkColor(m.chg, m.neutral),
    liveDot: false
  })))), /*#__PURE__*/React.createElement("p", {
    className: "wb__readtext"
  }, W.macro.read)), /*#__PURE__*/React.createElement("section", {
    className: "wb__sec",
    id: "wb-industries",
    "data-screen-label": "Industry trends"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__sechead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__sectitle"
  }, "Industry trends")), /*#__PURE__*/React.createElement("p", {
    className: "wb__secintro"
  }, "Industries the scraper tracks and the agent researches in depth. The fact leads; open one for its drivers, the news moving it, and the names inside \u2014 or open the full research for the supply chain."), /*#__PURE__*/React.createElement("div", {
    className: "wb__rule"
  }), inds.map(ind => {
    const isOpen = !!open[ind.id];
    const md = ind.movePct > 0 ? "wb__up" : ind.movePct < 0 ? "wb__down" : "wb__flat";
    return /*#__PURE__*/React.createElement("div", {
      className: `wb__item ${isOpen ? "wb__item--open" : ""}`,
      key: ind.id
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "wb__head",
      onClick: () => toggle(ind.id)
    }, /*#__PURE__*/React.createElement("div", {
      className: "wb__kicker"
    }, /*#__PURE__*/React.createElement("span", {
      className: `wb__bias wb__bias-${ind.bias}`
    }, ind.bias), /*#__PURE__*/React.createElement("span", {
      className: `wb__indmove ${md}`
    }, wbDeltaText(ind.movePct, "%")), /*#__PURE__*/React.createElement("span", {
      className: "wb__src"
    }, "researched ", ind.researchedAt), /*#__PURE__*/React.createElement("span", {
      className: "wb__chev"
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "chevron-down",
      size: 16
    }))), /*#__PURE__*/React.createElement("p", {
      className: "wb__fact"
    }, ind.name, " \u2014 ", ind.whatsHappening)), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "wb__body"
    }, /*#__PURE__*/React.createElement("p", {
      className: "wb__read"
    }, ind.overview), ind.drivers && /*#__PURE__*/React.createElement("div", {
      className: "wb__drivers"
    }, ind.drivers.map(d => /*#__PURE__*/React.createElement("div", {
      className: "wb__driver",
      key: d.label
    }, /*#__PURE__*/React.createElement("span", {
      className: `wb__driverdot wb__affect wb__affect-${d.dir}`
    }, d.label), /*#__PURE__*/React.createElement("span", {
      className: "wb__drivernote"
    }, d.note)))), ind.news && /*#__PURE__*/React.createElement(Findings, {
      items: ind.news.map(n => ({
        title: n.topic,
        source: n.source,
        at: n.at,
        sig: 0.5,
        url: n.url
      }))
    }), ind.constituents && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "wb__cons"
    }, ind.constituents.map(c => {
      const cc = c.changePct > 0 ? "wb__up" : c.changePct < 0 ? "wb__down" : "wb__flat";
      return /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "wb__con",
        key: c.ticker,
        onClick: () => pickTicker(c.ticker)
      }, /*#__PURE__*/React.createElement("span", {
        className: "wb__conticker"
      }, c.ticker), /*#__PURE__*/React.createElement("span", {
        className: "wb__conname"
      }, c.name), /*#__PURE__*/React.createElement("span", {
        className: `wb__conchg ${cc}`
      }, wbDeltaText(c.changePct, "%")));
    }))), /*#__PURE__*/React.createElement("div", {
      className: "wb__acts"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "wb__act",
      onClick: e => {
        e.stopPropagation();
        onOpenIndustry && onOpenIndustry(ind);
      }
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "maximize-2",
      size: 12
    }), "Open full research"))));
  }), /*#__PURE__*/React.createElement("p", {
    className: "wb__readtext"
  }, W.industries.read)), /*#__PURE__*/React.createElement("section", {
    className: "wb__sec",
    id: "wb-market",
    "data-screen-label": "General market"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb__sechead"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__sectitle"
  }, "General market")), /*#__PURE__*/React.createElement("p", {
    className: "wb__secintro"
  }, W.market.intro), /*#__PURE__*/React.createElement("div", {
    className: "wb__idx",
    style: {
      marginTop: 14
    }
  }, W.market.indices.map(i => /*#__PURE__*/React.createElement("div", {
    className: "wb__idxcell",
    key: i.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__idxlabel"
  }, i.label), /*#__PURE__*/React.createElement("span", {
    className: "wb__idxright"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb__idxval"
  }, i.value), /*#__PURE__*/React.createElement("span", {
    className: `wb__idxdelta ${wbDeltaClass(i.chg)}`
  }, wbDeltaText(i.chg, i.unit)))))), /*#__PURE__*/React.createElement("div", {
    className: "wb__movers"
  }, book.map(b => {
    const cc = b.changePct > 0 ? "wb__up" : b.changePct < 0 ? "wb__down" : "wb__flat";
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "wb__mover",
      key: b.ticker,
      onClick: () => onPickStock && onPickStock(b)
    }, /*#__PURE__*/React.createElement("span", {
      className: "wb__mvticker"
    }, b.ticker), /*#__PURE__*/React.createElement("span", {
      className: "wb__mvname"
    }, /*#__PURE__*/React.createElement("span", {
      className: "wb__mvnamemain"
    }, b.name), /*#__PURE__*/React.createElement("span", {
      className: "wb__mvpos"
    }, b.industry && b.industry.position || b.industry && b.industry.subIndustry || "")), /*#__PURE__*/React.createElement("span", {
      className: "wb__mvprice"
    }, window.fmtPrice ? window.fmtPrice(b.price) : b.price), /*#__PURE__*/React.createElement("span", {
      className: `wb__mvchg ${cc}`
    }, wbDeltaText(+b.changePct.toFixed(2), "%")));
  })), /*#__PURE__*/React.createElement("p", {
    className: "wb__readtext"
  }, W.market.read))));
}
Object.assign(window, {
  WorldBoard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/WorldBoard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/data.js
try { (() => {
/* Data for the AI Stock Agent — unified research desk. Mirrors the real schema vocabulary from
 * ARCHITECTURE.md (coverage tiers, significance, research state, origin, the brief) but every
 * value is invented for demo. The agent researches / analyzes / updates — it never recommends
 * buy/sell/hold. The point of this view is FULL VISIBILITY: every step, tool, source, token. */
(function () {
  function series(seed, n, drift) {
    const out = [];
    let v = 100,
      s = seed;
    for (let i = 0; i < n; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280 - 0.5;
      v = Math.max(1, v + r * 4 + drift);
      out.push(+v.toFixed(2));
    }
    return out;
  }
  const ACTIVE = {
    id: 101,
    topic: "TSMC advanced-node capacity vs. 2026 AI demand",
    origin: "schedule",
    openedAt: "Jun 17 · 08:12",
    statusPhrases: ["Thinking…", "Researching TSMC advanced-node capacity…", "Reading 6 sources…", "Cross-checking against your Jun 14 brief…", "Scoring significance…", "Drafting findings…", "Finding related topics…"],
    telemetry: {
      turn: 9,
      maxTurns: 24,
      tools: 17,
      sources: 6,
      inTok: "22.4k",
      outTok: "1.1k",
      elapsed: "2m 14s"
    },
    impact: [{
      kind: "industry",
      name: "AI accelerator silicon",
      effect: "tailwind",
      probability: 0.80,
      because: "The confirming packaging step-up relieves the binding supply constraint — names gated by CoWoS get more units to ship."
    }, {
      kind: "industry",
      name: "Memory / HBM",
      effect: "tailwind",
      probability: 0.66,
      because: "More packaged accelerators pull matching HBM stacks; demand reads through to the memory makers."
    }, {
      kind: "stock",
      ticker: "NVDA",
      name: "NVIDIA",
      effect: "tailwind",
      probability: 0.78,
      because: "Most unit-constrained on advanced packaging — added capacity flows most directly to shippable volume (3 corroborating sources)."
    }, {
      kind: "stock",
      ticker: "AVGO",
      name: "Broadcom",
      effect: "tailwind",
      probability: 0.61,
      because: "Custom-silicon programs share the same packaging line; benefits, but one step removed from the lead allocation."
    }, {
      kind: "fund",
      ticker: "SMH",
      name: "VanEck Semiconductor ETF",
      effect: "tailwind",
      probability: 0.62,
      because: "Broad semiconductor basket — captures the packaging-driven volume across the chain, diluted vs. single names."
    }],
    trace: [{
      label: "Reconstructed context from your watchlist & last brief",
      tool: "memory.read",
      reuse: "Watchlist · Brief Jun 14",
      inTok: "1.2k",
      outTok: "0.1k",
      at: "08:12:02",
      status: "done"
    }, {
      label: "Searched advanced-packaging capex guidance",
      tool: "web.search",
      sources: ["reuters.com", "bloomberg.com"],
      inTok: "6.1k",
      outTok: "0.5k",
      at: "08:12:20",
      status: "done"
    }, {
      label: "Fetched & read OSAT earnings transcript",
      tool: "filings.fetch",
      sources: ["sec.gov"],
      inTok: "8.8k",
      outTok: "0.2k",
      at: "08:12:48",
      status: "done"
    }, {
      label: "Reading 6 sources for corroboration",
      tool: "web.fetch",
      sources: ["ft.com", "wsj.com", "+4"],
      inTok: "6.3k",
      outTok: "0.3k",
      at: "08:13:31",
      status: "active"
    }, {
      label: "Score significance & write findings",
      status: "pending"
    }, {
      label: "Surface related topics across coverage",
      status: "pending"
    }]
  };
  const SESSIONS = [{
    id: 88,
    topic: "Advanced packaging — names exposed to the 2026 CoWoS step-up",
    origin: "schedule",
    status: "closed",
    openedAt: "Jun 16 · 06:00",
    closedAt: "Jun 16 · 07:12",
    summary: "Starting from the advanced-packaging thread, the agent mapped the supply chain and ranked names by exposure and corroboration. Three cleared the surfacing threshold; it added the highest-significance name to your watchlist on its own and left the rest for you to confirm.",
    telemetry: {
      turn: 11,
      maxTurns: 16,
      tools: 15,
      sources: 8,
      inTok: "38.7k",
      outTok: "2.0k",
      elapsed: "1h 12m"
    },
    impact: [{
      kind: "industry",
      name: "OSAT / packaging",
      effect: "tailwind",
      probability: 0.74,
      because: "CoWoS additions land first at the outsourced assembly & test houses — the most direct beneficiaries of the step-up."
    }, {
      kind: "industry",
      name: "Packaging inspection / metrology",
      effect: "tailwind",
      probability: 0.62,
      because: "More packaging volume pulls inspection demand one layer up the line."
    }, {
      kind: "stock",
      ticker: "TSM",
      name: "Taiwan Semiconductor",
      effect: "tailwind",
      probability: 0.68,
      because: "Owns the front-end node the packaging feeds; the ramp is unit-accretive but capacity-paced."
    }],
    sources: [{
      domain: "reuters.com",
      title: "CoWoS capacity additions detailed by supplier",
      at: "Jun 16",
      sig: 0.70
    }, {
      domain: "digitimes.com",
      title: "OSAT packaging allocation tightens",
      at: "Jun 16",
      sig: 0.58
    }],
    // Names the agent found from the research and ranked. addedBy:'agent' = auto-stored to the
    // watchlist (cleared the significance threshold); the rest are proposed for the user.
    surfaced: [{
      ticker: "ASX",
      name: "ASE Technology",
      sig: 0.71,
      addedBy: "agent",
      why: "Largest OSAT; the most direct read on the packaging step-up. Corroborated across 4 sources — auto-added at significance 0.71."
    }, {
      ticker: "CAMT",
      name: "Camtek",
      sig: 0.52,
      why: "Inspection demand levered to 2.5D/3D packaging. Higher beta, thinner source breadth — proposed for your review."
    }, {
      ticker: "AEHR",
      name: "Aehr Test Systems",
      sig: 0.38,
      why: "Tangential test/burn-in exposure. Below the auto-add threshold; flagged for completeness."
    }],
    trace: [{
      label: "Loaded the advanced-packaging thread from memory",
      tool: "memory.read",
      reuse: "Research #101",
      inTok: "1.5k",
      outTok: "0.1k",
      at: "06:00:08",
      status: "done"
    }, {
      label: "Mapped the CoWoS supply chain",
      tool: "reasoning",
      inTok: "9.0k",
      outTok: "0.6k",
      at: "06:11:40",
      status: "done"
    }, {
      label: "Searched & ranked exposed names",
      tool: "web.search",
      sources: ["reuters.com", "digitimes.com"],
      inTok: "15.2k",
      outTok: "0.5k",
      at: "06:31:02",
      status: "done"
    }, {
      label: "Scored significance & stored the watchlist name",
      tool: "memory.write",
      reuse: "Watchlist ← ASX",
      inTok: "6.0k",
      outTok: "0.8k",
      at: "07:10:30",
      status: "done"
    }],
    related: ["HBM suppliers exposed to the same ramp", "Substrate makers — ABF capacity"]
  }, {
    id: 92,
    topic: "HBM pricing trajectory into Q3",
    origin: "user",
    status: "open",
    openedAt: "Jun 17 · 07:40",
    activeAgo: "21m",
    summary: "Spot and contract memory prints are diverging; the agent is reconciling which signal leads. Early read: contract firming is the durable one.",
    telemetry: {
      turn: 4,
      maxTurns: 16,
      tools: 6,
      sources: 3,
      inTok: "9.1k",
      outTok: "0.4k",
      elapsed: "21m"
    },
    impact: [{
      kind: "industry",
      name: "DRAM / memory makers",
      effect: "tailwind",
      probability: 0.72,
      because: "Contract pricing firming is the durable signal — it flows straight to memory-maker margins."
    }, {
      kind: "stock",
      ticker: "MU",
      name: "Micron",
      effect: "tailwind",
      probability: 0.70,
      because: "Most-levered US memory name to contract HBM pricing; margin sensitivity is highest here."
    }, {
      kind: "industry",
      name: "Smartphone / PC OEMs",
      effect: "headwind",
      probability: 0.61,
      because: "Rising memory input cost is a margin headwind for downstream device makers."
    }, {
      kind: "fund",
      ticker: "SOXX",
      name: "iShares Semiconductor ETF",
      effect: "tailwind",
      probability: 0.60,
      because: "Captures the memory-cycle read across the basket, muted vs. a pure-play memory name."
    }],
    sources: [{
      domain: "trendforce.com",
      title: "Contract DRAM pricing firms into Q3",
      at: "1h ago",
      sig: 0.62
    }, {
      domain: "digitimes.com",
      title: "HBM allocation tightens at lead foundry",
      at: "3h ago",
      sig: 0.55
    }, {
      domain: "bloomberg.com",
      title: "Memory makers signal disciplined supply",
      at: "5h ago",
      sig: 0.41
    }],
    trace: [{
      label: "Pulled prior memory-cycle notes",
      tool: "memory.read",
      reuse: "Research #71",
      inTok: "0.9k",
      outTok: "0.1k",
      at: "07:40:05",
      status: "done"
    }, {
      label: "Searched spot vs. contract prints",
      tool: "web.search",
      sources: ["trendforce.com"],
      inTok: "4.2k",
      outTok: "0.3k",
      at: "07:40:22",
      status: "done"
    }, {
      label: "Reconciling lead/lag between the two",
      tool: "reasoning",
      inTok: "3.0k",
      outTok: "0.0k",
      at: "07:48:10",
      status: "active"
    }],
    related: ["Samsung vs. SK Hynix HBM share", "DRAM capex discipline"]
  }, {
    id: 71,
    topic: "Nuclear SMR permitting timeline — US vs. EU",
    origin: "user",
    status: "closed",
    openedAt: "Jun 14 · 13:02",
    closedAt: "Jun 14 · 14:48",
    summary: "Permitting cadence diverges. In the base case the US NRC pathway gates the first commercial deployments to 2029–2031; the EU track is earlier on paper but politically contingent.",
    telemetry: {
      turn: 18,
      maxTurns: 20,
      tools: 24,
      sources: 11,
      inTok: "84.0k",
      outTok: "3.2k",
      elapsed: "1h 46m"
    },
    impact: [{
      kind: "industry",
      name: "Nuclear SMR developers",
      effect: "headwind",
      probability: 0.66,
      because: "The US NRC pathway gates first deployments to 2029–2031 — later than consensus, pushing out the revenue timeline."
    }, {
      kind: "industry",
      name: "Uranium / fuel cycle",
      effect: "mixed",
      probability: 0.60,
      because: "Demand thesis intact but timing slips; the near-term read is muted rather than negative."
    }, {
      kind: "fund",
      ticker: "NLR",
      name: "VanEck Uranium & Nuclear ETF",
      effect: "headwind",
      probability: 0.62,
      because: "Basket reflects the deployment-timeline slip; broad exposure dampens single-name idiosyncrasy."
    }],
    sources: [{
      domain: "nrc.gov",
      title: "Combined license application status",
      at: "Jun 14",
      sig: 0.71
    }, {
      domain: "iaea.org",
      title: "SMR regulatory harmonisation note",
      at: "Jun 14",
      sig: 0.58
    }, {
      domain: "world-nuclear.org",
      title: "Deployment pipeline by jurisdiction",
      at: "Jun 13",
      sig: 0.49
    }],
    trace: [{
      label: "Framed the US vs. EU comparison",
      tool: "reasoning",
      inTok: "2.1k",
      outTok: "0.4k",
      at: "13:02:10",
      status: "done"
    }, {
      label: "Read NRC licensing docket",
      tool: "filings.fetch",
      sources: ["nrc.gov"],
      inTok: "21.0k",
      outTok: "0.6k",
      at: "13:08:40",
      status: "done"
    }, {
      label: "Compared EU national timelines",
      tool: "web.fetch",
      sources: ["iaea.org", "world-nuclear.org"],
      inTok: "18.4k",
      outTok: "0.7k",
      at: "13:31:02",
      status: "done"
    }, {
      label: "Wrote findings & significance",
      tool: "synthesis",
      inTok: "9.0k",
      outTok: "1.5k",
      at: "14:46:55",
      status: "done"
    }],
    related: ["Uranium fuel-cycle bottlenecks", "Grid interconnect queues"]
  }, {
    id: 65,
    topic: "ASML China revenue mix sensitivity",
    origin: "schedule",
    status: "closed",
    openedAt: "Jun 13 · 09:20",
    closedAt: "Jun 13 · 10:05",
    summary: "Export-control scenarios bound the China mix; the spread between the lenient and strict cases is wider than the consensus model implies, which matters more for cadence than for the annual total.",
    telemetry: {
      turn: 12,
      maxTurns: 16,
      tools: 14,
      sources: 7,
      inTok: "41.2k",
      outTok: "2.1k",
      elapsed: "45m"
    },
    impact: [{
      kind: "stock",
      ticker: "ASML",
      name: "ASML",
      effect: "headwind",
      probability: 0.64,
      because: "The stricter export-control case widens the China-mix downside — the effect is on cadence more than the annual total."
    }, {
      kind: "industry",
      name: "Semi equipment (WFE)",
      effect: "headwind",
      probability: 0.61,
      because: "Policy overhang reads across the equipment basket, not just the litho monopoly."
    }, {
      kind: "fund",
      ticker: "SOXX",
      name: "iShares Semiconductor ETF",
      effect: "mixed",
      probability: 0.60,
      because: "Equipment weight carries the policy risk; the rest of the basket dilutes it to a mixed read."
    }],
    sources: [{
      domain: "asml.com",
      title: "Investor deck — regional split",
      at: "Jun 13",
      sig: 0.64
    }, {
      domain: "reuters.com",
      title: "Draft export-license framework circulates",
      at: "Jun 12",
      sig: 0.66
    }],
    trace: [{
      label: "Loaded ASML coverage memory",
      tool: "memory.read",
      reuse: "Industry · Semi equip",
      inTok: "1.4k",
      outTok: "0.1k",
      at: "09:20:08",
      status: "done"
    }, {
      label: "Modelled three export-control cases",
      tool: "reasoning",
      inTok: "12.0k",
      outTok: "0.9k",
      at: "09:31:20",
      status: "done"
    }, {
      label: "Wrote findings",
      tool: "synthesis",
      inTok: "7.5k",
      outTok: "1.1k",
      at: "10:03:40",
      status: "done"
    }],
    related: ["DUV vs. EUV demand split", "Semi-equipment backlog"]
  }, {
    id: 58,
    topic: "Defense primes — munitions replenishment backlog",
    origin: "schedule",
    status: "closed",
    openedAt: "Jun 12 · 16:10",
    closedAt: "Jun 12 · 17:31",
    summary: "Backlog converts slowly; throughput — not orders — is the binding constraint named across three transcripts. The replenishment story is real but multi-year.",
    telemetry: {
      turn: 14,
      maxTurns: 18,
      tools: 19,
      sources: 9,
      inTok: "52.6k",
      outTok: "2.6k",
      elapsed: "1h 21m"
    },
    impact: [{
      kind: "industry",
      name: "Sub-tier / solid rocket motor suppliers",
      effect: "tailwind",
      probability: 0.66,
      because: "The throughput constraint sits at the sub-tier — suppliers that relieve it capture an outsized share of backlog conversion."
    }, {
      kind: "industry",
      name: "Defense primes",
      effect: "tailwind",
      probability: 0.62,
      because: "Replenishment demand underpins revenue visibility, but throughput — not orders — caps the pace, so the tailwind is durable and slow."
    }, {
      kind: "fund",
      ticker: "ITA",
      name: "iShares Aerospace & Defense ETF",
      effect: "tailwind",
      probability: 0.60,
      because: "Basket captures the multi-year replenishment, smoothing single-name throughput timing."
    }],
    sources: [{
      domain: "sec.gov",
      title: "Prime contractor 10-Q — backlog detail",
      at: "Jun 12",
      sig: 0.59
    }, {
      domain: "defensenews.com",
      title: "Production-line throughput commentary",
      at: "Jun 11",
      sig: 0.52
    }],
    trace: [{
      label: "Gathered prime-contractor transcripts",
      tool: "filings.fetch",
      sources: ["sec.gov"],
      inTok: "22.0k",
      outTok: "0.5k",
      at: "16:10:30",
      status: "done"
    }, {
      label: "Extracted throughput language",
      tool: "reasoning",
      inTok: "14.1k",
      outTok: "0.8k",
      at: "16:48:00",
      status: "done"
    }, {
      label: "Wrote findings",
      tool: "synthesis",
      inTok: "8.0k",
      outTok: "1.3k",
      at: "17:29:10",
      status: "done"
    }],
    related: ["Solid rocket motor supply", "Shipbuilding labor constraints"]
  }];

  // CANDIDATES — names the agent surfaces from autonomous industry research. Each is a full
  // store record so it works the moment it's added to the watchlist (tier: "discovered").
  const CANDIDATES = {
    ASX: {
      id: 7101,
      ticker: "ASX",
      name: "ASE Technology",
      exchange: "NYSE",
      price: 11.42,
      changePct: -1.90,
      series: series(31, 30, 0.6),
      tier: "discovered",
      alert: "±6% / day",
      quoteAt: "delayed 15m",
      sentiment: {
        value: 0.33,
        sources: 5,
        asOf: "1h ago",
        read: "Constructive — surfaced repeatedly as the OSAT most levered to the CoWoS step-up; advanced-packaging revenue mix is the cited driver.",
        trend: [0.06, 0.10, 0.08, 0.14, 0.12, 0.18, 0.16, 0.22, 0.20, 0.26, 0.30, 0.33]
      },
      financialsAsOf: "FY filings · Jun 06",
      financials: [{
        label: "Revenue (ttm)",
        value: "$19.4B"
      }, {
        label: "Rev growth",
        value: "+9%",
        dir: "up",
        note: "YoY"
      }, {
        label: "Gross margin",
        value: "16.8%"
      }, {
        label: "Operating margin",
        value: "7.9%"
      }, {
        label: "Free cash flow",
        value: "$1.4B"
      }, {
        label: "Net debt",
        value: "$4.7B",
        dir: "down"
      }],
      industry: {
        asOf: "Jun 07",
        sector: "Information Technology",
        subIndustry: "Semiconductors — OSAT / packaging",
        position: "Largest outsourced assembly & test house; a direct beneficiary of advanced-packaging demand.",
        peers: [{
          ticker: "AMKR",
          name: "Amkor Technology",
          changePct: 0.92
        }, {
          ticker: "TSM",
          name: "Taiwan Semiconductor",
          changePct: -0.92
        }, {
          ticker: "CAMT",
          name: "Camtek",
          changePct: 2.40
        }],
        supplyChain: ["TSMC (partner)", "NVDA (end demand)", "CoWoS (packaging)"]
      },
      findingsAsOf: "1h ago",
      findings: [{
        domain: "digitimes.com",
        title: "OSAT capacity additions target advanced packaging",
        at: "1h ago",
        sig: 0.60
      }, {
        domain: "reuters.com",
        title: "Assembly & test pricing firms on AI mix",
        at: "7h ago",
        sig: 0.45
      }],
      memoryAsOf: "Jun 16",
      memory: "The agent surfaced ASX from your advanced-packaging research and added it on its own (significance 0.71). You haven't reviewed it yet — open to confirm or archive."
    },
    CAMT: {
      id: 7102,
      ticker: "CAMT",
      name: "Camtek",
      exchange: "NASDAQ",
      price: 96.70,
      changePct: 2.40,
      series: series(41, 30, 1.1),
      tier: "discovered",
      alert: "±7% / day",
      quoteAt: "delayed 15m",
      sentiment: {
        value: 0.29,
        sources: 4,
        asOf: "2h ago",
        read: "Constructive but thin source breadth — inspection demand for advanced packaging is the recurring theme.",
        trend: [0.08, 0.12, 0.10, 0.16, 0.14, 0.20, 0.18, 0.24, 0.22, 0.27, 0.26, 0.29]
      },
      financialsAsOf: "FY filings · Jun 05",
      financials: [{
        label: "Revenue (ttm)",
        value: "$430M"
      }, {
        label: "Rev growth",
        value: "+38%",
        dir: "up",
        note: "YoY"
      }, {
        label: "Gross margin",
        value: "50.1%"
      }, {
        label: "Operating margin",
        value: "28.0%"
      }, {
        label: "Free cash flow",
        value: "$92M"
      }, {
        label: "Net cash",
        value: "$310M"
      }],
      industry: {
        asOf: "Jun 06",
        sector: "Information Technology",
        subIndustry: "Semiconductor equipment — inspection",
        position: "Inspection & metrology for advanced packaging; small-cap, high-beta to the CoWoS ramp.",
        peers: [{
          ticker: "KLAC",
          name: "KLA Corp",
          changePct: 0.11
        }, {
          ticker: "ONTO",
          name: "Onto Innovation",
          changePct: 1.30
        }, {
          ticker: "ASX",
          name: "ASE Technology",
          changePct: 1.86
        }],
        supplyChain: ["OSAT houses (customers)", "TSMC (end node)", "Packaging lines"]
      },
      findingsAsOf: "2h ago",
      findings: [{
        domain: "barrons.com",
        title: "Inspection demand cited for 2.5D/3D packaging",
        at: "2h ago",
        sig: 0.52
      }],
      memoryAsOf: "Jun 16",
      memory: "Surfaced from advanced-packaging research as a higher-beta way to play inspection. Proposed, not added — source breadth is thin, so the agent left the call to you."
    },
    AEHR: {
      id: 7103,
      ticker: "AEHR",
      name: "Aehr Test Systems",
      exchange: "NASDAQ",
      price: 14.10,
      changePct: -1.20,
      series: series(53, 30, -0.3),
      tier: "discovered",
      alert: "±8% / day",
      quoteAt: "delayed 15m",
      sentiment: {
        value: -0.08,
        sources: 3,
        asOf: "3h ago",
        read: "Mixed — burn-in / test exposure is real but the read is noisy, and customer-concentration risk is flagged across sources.",
        trend: [0.05, 0.02, 0.04, -0.01, 0.02, -0.03, 0.00, -0.04, -0.02, -0.06, -0.05, -0.08]
      },
      financialsAsOf: "FY filings · Jun 04",
      financials: [{
        label: "Revenue (ttm)",
        value: "$66M"
      }, {
        label: "Rev growth",
        value: "-8%",
        dir: "down",
        note: "YoY"
      }, {
        label: "Gross margin",
        value: "49.0%"
      }, {
        label: "Operating margin",
        value: "12.4%"
      }, {
        label: "Free cash flow",
        value: "$9M"
      }, {
        label: "Net cash",
        value: "$48M"
      }],
      industry: {
        asOf: "Jun 05",
        sector: "Information Technology",
        subIndustry: "Semiconductor equipment — test / burn-in",
        position: "Wafer-level burn-in; a small, concentrated customer base makes it high-variance.",
        peers: [{
          ticker: "TER",
          name: "Teradyne",
          changePct: 0.40
        }, {
          ticker: "COHU",
          name: "Cohu",
          changePct: -0.60
        }],
        supplyChain: ["Device makers (customers)", "Foundries (end node)"]
      },
      findingsAsOf: "3h ago",
      findings: [{
        domain: "seekingalpha.com",
        title: "Customer concentration remains the watch item",
        at: "3h ago",
        sig: 0.38
      }],
      memoryAsOf: "Jun 16",
      memory: "Surfaced as a tangential test-equipment name. The agent flagged it low-significance and did not add it — concentration risk and weak source breadth."
    }
  };

  // The watchlist. Each name carries the standing quote PLUS the per-name record the store keeps:
  // the agent's sentiment read, operational financials, industry position, recent material
  // findings, and what it remembers about the name. Click a row → StockDetail fills the panel.
  // Reads and observations only — never a buy/sell/hold or valuation call.
  const FOLLOWING = [{
    id: 5190,
    ticker: "NVDA",
    name: "NVIDIA",
    exchange: "NASDAQ",
    price: 131.26,
    changePct: -2.80,
    series: series(3, 30, 1.4),
    tier: "watchlist",
    alert: "±5% / day",
    quoteAt: "delayed 15m",
    sentiment: {
      value: 0.42,
      sources: 14,
      asOf: "12m ago",
      read: "Source tone firmed this week — supply commentary reads constructive, with three independent corroborations of a 2026 packaging step-up. Not unanimous; channel notes stay cautious on lead times.",
      trend: [0.10, 0.08, 0.14, 0.05, 0.18, 0.22, 0.19, 0.28, 0.31, 0.27, 0.36, 0.42]
    },
    financialsAsOf: "FY filings · Jun 14",
    financials: [{
      label: "Revenue (ttm)",
      value: "$110.9B"
    }, {
      label: "Rev growth",
      value: "+126%",
      dir: "up",
      note: "YoY"
    }, {
      label: "Gross margin",
      value: "75.0%",
      dir: "up"
    }, {
      label: "Operating margin",
      value: "62.1%"
    }, {
      label: "Free cash flow",
      value: "$56.5B"
    }, {
      label: "Net cash",
      value: "$34.8B"
    }],
    industry: {
      asOf: "Jun 13",
      sector: "Information Technology",
      subIndustry: "Semiconductors — accelerators",
      position: "Sets the cadence for AI training silicon; demand-bound, not supply-led.",
      peers: [{
        ticker: "AMD",
        name: "Advanced Micro Devices",
        changePct: 1.18
      }, {
        ticker: "AVGO",
        name: "Broadcom",
        changePct: 1.12
      }, {
        ticker: "TSM",
        name: "Taiwan Semiconductor",
        changePct: -0.92
      }],
      supplyChain: ["TSMC (foundry)", "SK Hynix (HBM)", "Vertiv (cooling)", "CoWoS (packaging)"]
    },
    findingsAsOf: "2h ago",
    findings: [{
      domain: "reuters.com",
      title: "Third source corroborates 2026 CoWoS capacity step-up",
      at: "2h ago",
      sig: 0.78
    }, {
      domain: "bloomberg.com",
      title: "Hyperscaler capex guidance reiterated into next FY",
      at: "6h ago",
      sig: 0.54
    }, {
      domain: "digitimes.com",
      title: "Channel note: lead times stable, no spot premium",
      at: "1d ago",
      sig: 0.33
    }],
    memoryAsOf: "Jun 14",
    memory: "On your watchlist since Mar. You care most about packaging capacity and HBM allocation as the lead indicators — I weight those when scoring significance here, and cross-check against your Jun 14 brief."
  }, {
    id: 4821,
    ticker: "TSM",
    name: "Taiwan Semiconductor",
    exchange: "NYSE",
    price: 188.04,
    changePct: -2.10,
    series: series(7, 30, 0.5),
    tier: "watchlist",
    alert: "±4% / day",
    quoteAt: "delayed 15m",
    sentiment: {
      value: 0.18,
      sources: 9,
      asOf: "34m ago",
      read: "Net constructive but quieter than NVDA — the read leans on capex discipline and node-mix commentary. One transcript flagged utilization timing as the open question.",
      trend: [0.05, 0.09, 0.04, 0.12, 0.08, 0.14, 0.11, 0.16, 0.13, 0.18, 0.15, 0.18]
    },
    financialsAsOf: "FY filings · Jun 10",
    financials: [{
      label: "Revenue (ttm)",
      value: "$92.6B"
    }, {
      label: "Rev growth",
      value: "+33%",
      dir: "up",
      note: "YoY"
    }, {
      label: "Gross margin",
      value: "56.2%"
    }, {
      label: "Operating margin",
      value: "45.7%"
    }, {
      label: "Free cash flow",
      value: "$28.1B"
    }, {
      label: "Net cash",
      value: "$41.0B"
    }],
    industry: {
      asOf: "Jun 11",
      sector: "Information Technology",
      subIndustry: "Semiconductors — foundry",
      position: "The advanced-node bottleneck for the whole AI stack; capacity, not demand, is the throttle.",
      peers: [{
        ticker: "INTC",
        name: "Intel",
        changePct: -1.40
      }, {
        ticker: "GFS",
        name: "GlobalFoundries",
        changePct: 0.22
      }, {
        ticker: "UMC",
        name: "United Microelectronics",
        changePct: -0.31
      }],
      supplyChain: ["ASML (litho)", "NVDA (customer)", "AVGO (customer)", "Applied Materials"]
    },
    findingsAsOf: "5h ago",
    findings: [{
      domain: "ft.com",
      title: "Advanced-node utilization holds above 90% into Q3",
      at: "5h ago",
      sig: 0.61
    }, {
      domain: "sec.gov",
      title: "Capex guidance unchanged in latest filing",
      at: "1d ago",
      sig: 0.44
    }],
    memoryAsOf: "Jun 14",
    memory: "You track TSM as the supply read behind your NVDA thesis. I link findings here back to your advanced-packaging session and flag any divergence between the two."
  }, {
    id: 6001,
    ticker: "AVGO",
    name: "Broadcom",
    exchange: "NASDAQ",
    price: 1642.9,
    changePct: -1.60,
    series: series(11, 30, 1.0),
    tier: "watchlist",
    alert: "±5% / day",
    quoteAt: "delayed 15m",
    sentiment: {
      value: 0.27,
      sources: 7,
      asOf: "1h ago",
      read: "Constructive on custom-silicon traction; networking commentary is the swing factor in the read.",
      trend: [0.12, 0.10, 0.16, 0.14, 0.20, 0.18, 0.24, 0.22, 0.25, 0.23, 0.28, 0.27]
    },
    financialsAsOf: "FY filings · Jun 09",
    financials: [{
      label: "Revenue (ttm)",
      value: "$54.5B"
    }, {
      label: "Rev growth",
      value: "+44%",
      dir: "up",
      note: "YoY"
    }, {
      label: "Gross margin",
      value: "63.0%"
    }, {
      label: "Operating margin",
      value: "30.4%"
    }, {
      label: "Free cash flow",
      value: "$19.4B"
    }, {
      label: "Net debt",
      value: "$57.6B",
      dir: "down"
    }],
    industry: {
      asOf: "Jun 10",
      sector: "Information Technology",
      subIndustry: "Semiconductors — custom & networking",
      position: "Second-source custom AI silicon plus the networking layer; diversified across the rack.",
      peers: [{
        ticker: "NVDA",
        name: "NVIDIA",
        changePct: 2.41
      }, {
        ticker: "MRVL",
        name: "Marvell",
        changePct: 0.84
      }, {
        ticker: "ANET",
        name: "Arista Networks",
        changePct: 1.05
      }],
      supplyChain: ["TSMC (foundry)", "Hyperscalers (customers)", "Optical module makers"]
    },
    findingsAsOf: "8h ago",
    findings: [{
      domain: "wsj.com",
      title: "Two more custom-accelerator design wins reported",
      at: "8h ago",
      sig: 0.57
    }, {
      domain: "theinformation.com",
      title: "Networking attach rate cited as the watch item",
      at: "1d ago",
      sig: 0.39
    }],
    memoryAsOf: "Jun 12",
    memory: "Added when you asked about second-source AI silicon. I treat its custom-compute findings as a cross-check on the NVDA concentration in your watchlist."
  }, {
    id: 6002,
    ticker: "ASML",
    name: "ASML",
    exchange: "NASDAQ",
    price: 1024.5,
    changePct: -1.40,
    series: series(19, 30, 0.3),
    tier: "industry_critical",
    alert: "±4% / day",
    quoteAt: "delayed 15m",
    sentiment: {
      value: -0.14,
      sources: 8,
      asOf: "2h ago",
      read: "Leaning negative this week — export-control headlines dominate the read and outweigh order-book commentary. Tone is policy-driven, not fundamentals-driven.",
      trend: [0.08, 0.04, 0.02, -0.03, 0.01, -0.05, -0.02, -0.08, -0.06, -0.11, -0.09, -0.14]
    },
    financialsAsOf: "FY filings · Jun 08",
    financials: [{
      label: "Revenue (ttm)",
      value: "$29.8B"
    }, {
      label: "Rev growth",
      value: "+3%",
      dir: "up",
      note: "YoY"
    }, {
      label: "Gross margin",
      value: "51.5%"
    }, {
      label: "Operating margin",
      value: "31.8%"
    }, {
      label: "Free cash flow",
      value: "$3.2B"
    }, {
      label: "Net cash",
      value: "$5.1B"
    }],
    industry: {
      asOf: "Jun 09",
      sector: "Information Technology",
      subIndustry: "Semiconductor equipment — litho",
      position: "Sole EUV supplier; the single chokepoint upstream of every advanced node.",
      peers: [{
        ticker: "AMAT",
        name: "Applied Materials",
        changePct: -0.18
      }, {
        ticker: "LRCX",
        name: "Lam Research",
        changePct: -0.52
      }, {
        ticker: "KLAC",
        name: "KLA Corp",
        changePct: 0.11
      }],
      supplyChain: ["Zeiss (optics)", "TSMC (customer)", "Intel (customer)", "Samsung (customer)"]
    },
    findingsAsOf: "2h ago",
    findings: [{
      domain: "reuters.com",
      title: "Draft export-license framework circulates",
      at: "2h ago",
      sig: 0.66
    }, {
      domain: "asml.com",
      title: "Order book commentary unchanged at investor update",
      at: "2d ago",
      sig: 0.41
    }],
    memoryAsOf: "Jun 13",
    memory: "Marked industry-critical, not on your core watchlist — I watch it as the upstream constraint. You flagged China revenue mix sensitivity as the thing to track; I scored that session for you on Jun 13."
  }, {
    id: 6003,
    ticker: "VRT",
    name: "Vertiv",
    exchange: "NYSE",
    price: 102.8,
    changePct: 0.90,
    series: series(23, 30, 1.2),
    tier: "watchlist",
    alert: "±6% / day",
    quoteAt: "delayed 15m",
    sentiment: {
      value: 0.51,
      sources: 6,
      asOf: "47m ago",
      read: "Most constructive name on your list — liquid-cooling demand commentary is corroborated across orders, backlog, and two channel checks. Small-cap source breadth is the caveat.",
      trend: [0.20, 0.24, 0.22, 0.30, 0.28, 0.36, 0.33, 0.41, 0.39, 0.46, 0.48, 0.51]
    },
    financialsAsOf: "FY filings · Jun 07",
    financials: [{
      label: "Revenue (ttm)",
      value: "$8.6B"
    }, {
      label: "Rev growth",
      value: "+17%",
      dir: "up",
      note: "YoY"
    }, {
      label: "Gross margin",
      value: "36.2%"
    }, {
      label: "Operating margin",
      value: "16.9%"
    }, {
      label: "Free cash flow",
      value: "$1.1B"
    }, {
      label: "Net debt",
      value: "$2.0B",
      dir: "down"
    }],
    industry: {
      asOf: "Jun 08",
      sector: "Industrials",
      subIndustry: "Data-center power & thermal",
      position: "Picks-and-shovels on AI buildout — thermal and power density is the binding constraint at the rack.",
      peers: [{
        ticker: "ETN",
        name: "Eaton",
        changePct: 0.74
      }, {
        ticker: "NVT",
        name: "nVent Electric",
        changePct: 1.30
      }, {
        ticker: "SMCI",
        name: "Super Micro",
        changePct: 2.88
      }],
      supplyChain: ["NVDA (demand driver)", "Hyperscalers (customers)", "Colo operators"]
    },
    findingsAsOf: "47m ago",
    findings: [{
      domain: "barrons.com",
      title: "Liquid-cooling backlog cited up sharply QoQ",
      at: "47m ago",
      sig: 0.69
    }, {
      domain: "datacenterdynamics.com",
      title: "Two hyperscaler cooling retrofits confirmed",
      at: "9h ago",
      sig: 0.48
    }],
    memoryAsOf: "Jun 11",
    memory: "You added VRT to play the AI buildout one layer down from silicon. I link its findings to data-center capex signals and watch the small-cap source breadth before I treat anything as material."
  },
  // Discovered by the agent from autonomous research (session #88) and stored on its own.
  {
    ...CANDIDATES.ASX,
    addedBy: "agent"
  }];
  const TODAY = {
    generatedAt: "9m ago",
    date: "Wednesday, June 18",
    headline: "Advanced packaging is the day's throughline",
    body: "Semis lead the pre-open bid on firming HBM pricing; three converging signals in advanced packaging overnight. Energy quiet into inventories. No watchlist name cleared the alert threshold.",
    threads: ["TSMC's CoWoS step-up now has a third independent corroboration — the supply constraint behind your NVDA thesis is easing at the margin.", "Contract HBM pricing is firming faster than spot; the agent reads the contract print as the durable signal into Q3.", "Export-control headlines are back on ASML — a policy read, not a fundamentals one, but it caps near-term China cadence."]
  };

  // NEWS — today's live wire: the significant articles, reports, filings and clips the scraper
  // matched to the world it's watching. "used" = pulled into active research; "related" = a scraper
  // match kept for context. Ephemeral — nothing is stored unless you research it.
  const NEWS = [{
    id: "n1",
    kind: "report",
    media: "video",
    mediaLabel: "live · Gulf correspondent",
    topic: "Tanker detained near Hormuz; Iran warns it can close the strait",
    industry: "Energy · oil & shipping",
    macro: "Energy shock · inflation risk",
    excerpt: "The IRGC says it can shut the strait 'within hours'. Roughly a fifth of seaborne crude and a third of global LNG transit it — the disruption premium is already in crude and freight.",
    source: "reuters.com",
    url: "https://www.reuters.com",
    at: "3h ago",
    relevance: "used",
    relTo: "Strait of Hormuz closure — pass-through to my book"
  }, {
    id: "n2",
    kind: "article",
    media: "image",
    mediaLabel: "chart · Brent intraday",
    topic: "Brent gaps to $94 as a war-risk premium returns to crude",
    industry: "Commodities · crude",
    macro: "Headline inflation · Fed repricing",
    excerpt: "The biggest one-day move since the last Gulf scare. The agent's read: sustained above $90 into the next CPI is what makes the hawkish rate repricing stick.",
    source: "bloomberg.com",
    url: "https://www.bloomberg.com",
    at: "2h ago",
    relevance: "used",
    relTo: "Energy-driven inflation — the Fed reaction function"
  }, {
    id: "n3",
    kind: "report",
    media: "video",
    mediaLabel: "live · Pentagon briefing",
    topic: "US carrier strike group ordered into the Gulf",
    industry: "Defense · naval",
    macro: "Geopolitical risk premium",
    excerpt: "The deployment is meant to keep the strait open — and is itself the signal markets are pricing. Defense replenishment names catch a bid on the redeployment.",
    source: "defensenews.com",
    url: "https://www.defensenews.com",
    at: "5h ago",
    relevance: "related",
    relTo: "Strait of Hormuz closure — pass-through to my book"
  }, {
    id: "n4",
    kind: "article",
    media: "image",
    mediaLabel: "photo · strait transit",
    topic: "PLA extends drills around Taiwan into a third day",
    industry: "Geopolitics · semiconductors",
    macro: "Supply concentration",
    excerpt: "No fab output affected, but the timing — with US assets pulled toward the Gulf — re-prices the standing tail risk under the entire advanced-node chain.",
    source: "reuters.com",
    url: "https://www.reuters.com",
    at: "6h ago",
    relevance: "related",
    relTo: "Taiwan supply concentration — scenario tree"
  }, {
    id: "n5",
    kind: "filing",
    media: "image",
    mediaLabel: "document · draft framework",
    topic: "Draft US export-license framework circulates in Washington",
    industry: "Semiconductor equipment · lithography",
    macro: "US–China export controls",
    excerpt: "Would widen the China-mix downside for litho and WFE. Policy-driven — it caps cadence more than the annual total, and concentrates on ASML.",
    source: "reuters.com",
    url: "https://www.reuters.com",
    at: "8h ago",
    relevance: "related",
    relTo: "Export-control draft — ASML China-mix sensitivity"
  }, {
    id: "n6",
    kind: "report",
    media: "image",
    mediaLabel: "report · supplier note",
    topic: "TSMC lifts its 2026 advanced-packaging capacity guidance",
    industry: "Semiconductors · packaging",
    macro: "AI capex cycle",
    excerpt: "A third independent source corroborates the CoWoS step-up — the binding constraint on shippable accelerator volume eases. The week's one clean tailwind, buried by the risk-off tape.",
    source: "digitimes.com",
    url: "https://www.digitimes.com",
    at: "7h ago",
    relevance: "used",
    relTo: "CoWoS 2026 step-up — names most exposed"
  }];
  const BUDGET = {
    spent: 1_284_000,
    cap: 2_000_000
  };

  // WORLD — the always-on surveillance layer. The cheap scraper continuously stores prices, prints
  // and headlines; the agent reads them and writes the synthesis. Organized by the research
  // database's top-level domains, lead by an OVERVIEW that threads one origin event down through
  // every domain to the names you hold. Reads & observations only — never buy/sell/hold.
  const WORLD = {
    sweptAt: "2m ago",
    asOf: "Jun 20 · 13:18 UTC",
    regime: "Risk-off · Gulf energy shock",
    // OVERVIEW — the agent's synthesis across every domain it swept overnight: one briefing that
    // names the origin event and threads it down through macro, industry and the market. The
    // "aspects" list is the overview of all aspects found — one declarative line per domain.
    overview: {
      at: "06:31 ET · refired 8m ago",
      retention: "kept 7 days, then a brief memory",
      source: "generated before the open, then re-fired on significance — not on a clock",
      headline: "An energy shock out of the Gulf is colliding with a disinflation that was nearly won.",
      body: "Overnight the world's most important oil chokepoint became the story. Iran's IRGC detained a tanker and threatened to close the Strait of Hormuz after a strike on its soil; the US moved a carrier group into the Gulf. Roughly a fifth of seaborne crude and a third of global LNG transit that strait — Brent gapped +6.4% to $94 and clean-tanker rates doubled. The agent traced the event through every domain it watches: it re-arms the inflation the Fed had been declaring beaten, pushes the next cut off the table, bids energy and defense, and lays a fresh risk premium over the long-duration tech that dominates your book.",
      context: "What it means for you: the disinflation trade that has carried your semis is on hold until the strait clears. Energy and defense lead the tape; rates are caught between a growth scare and an inflation scare; and renewed Taiwan headlines stack a second supply-risk premium under the AI names. No watchlist name tripped an alert — but the regime beneath them changed tonight.",
      aspects: [{
        domain: "Geopolitics",
        jump: "geopolitics",
        sig: 0.91,
        horizon: "now",
        line: "Iran threatens to close the Strait of Hormuz; a US carrier group redeploys. This is the origin — it sets everything below it in motion."
      }, {
        domain: "Macroeconomics",
        jump: "macro",
        sig: 0.78,
        horizon: "now",
        line: "The crude spike threatens to re-accelerate headline inflation; futures price out the next cut and the 2-year jumps 9bp. Disinflation paused, not reversed."
      }, {
        domain: "Industry trends",
        jump: "industries",
        sig: 0.64,
        horizon: "ahead",
        line: "The AI buildout holds — TSMC lifted 2026 packaging capacity — but energy, defense and shipping are the week's real movers."
      }, {
        domain: "General market",
        jump: "market",
        sig: 0.71,
        horizon: "now",
        line: "Risk-off: crude, gold and the dollar bid, semis sold on the duration premium, VIX back to 19. Your book is net lower into the open."
      }]
    },
    // The five things the agent checks first in this regime — the live ribbon at the top.
    tape: [{
      label: "Brent",
      value: "$94.10",
      chg: +6.4,
      unit: "%",
      series: series(61, 24, 1.6)
    }, {
      label: "US 10Y",
      value: "4.41%",
      chg: +7,
      unit: "bp",
      series: series(62, 24, 0.5)
    }, {
      label: "Gold",
      value: "$2,418",
      chg: +1.5,
      unit: "%",
      series: series(64, 24, 0.6)
    }, {
      label: "VIX",
      value: "19.2",
      chg: +21,
      unit: "%",
      series: series(65, 24, 0.9)
    }, {
      label: "S&P 500",
      value: "5,431",
      chg: -1.1,
      unit: "%",
      series: series(66, 24, -0.6)
    }],
    // SIGNALS — the few movements that actually MEAN something, split by horizon: what matters NOW
    // vs. what's building and will matter AHEAD. Each carries the fact + data, the agent's read, the
    // propagation chain, the names it touches, and (on expand) the reports behind it and a thread
    // into research. `sig` orders within a horizon; it is internal and never shown to the user.
    signals: [{
      id: "s1",
      sig: 0.91,
      horizon: "now",
      domain: "Geopolitics",
      fact: "Iran threatened to close the Strait of Hormuz; a US carrier group is redeploying to the Gulf.",
      datum: "~20% of seaborne crude · ~33% of LNG · Brent +6.4% to $94 · clean-tanker rates 2×",
      chain: ["Strait closure threatened", "Crude & freight spike", "Inflation re-arms, risk-off"],
      affects: [{
        t: "NVDA",
        dir: "headwind"
      }, {
        t: "TSM",
        dir: "headwind"
      }, {
        t: "VRT",
        dir: "mixed"
      }],
      sources: 9,
      read: "The origin event and the most significant print in weeks. It doesn't hit your holdings directly — none touch the Gulf — but it propagates: a sustained crude spike re-arms inflation, holds the Fed, and re-prices every long-duration name. Your semis carry that premium until the strait clears.",
      detail: "Closure is the tail, not the base case — the strait has been threatened before and never fully shut, and the Fifth Fleet is positioned to keep it open. But the agent scores the disruption premium as durable for days, not hours: insurers have pulled war-risk cover on Gulf transits, and re-routing around Africa adds ~2 weeks per cargo. The read for your book is macro, not name-level: watch the 10-year and headline CPI expectations, not the tape on any single holding.",
      findings: [{
        source: "reuters.com",
        title: "IRGC detains tanker, warns it can close Hormuz 'within hours'",
        at: "3h ago",
        sig: 0.86,
        url: "https://www.reuters.com"
      }, {
        source: "lloydslist.com",
        title: "War-risk insurance pulled on Gulf transits; rates double",
        at: "2h ago",
        sig: 0.71,
        url: "https://lloydslist.com"
      }, {
        source: "bloomberg.com",
        title: "Carrier strike group ordered into the Gulf",
        at: "5h ago",
        sig: 0.64,
        url: "https://www.bloomberg.com"
      }],
      research: "Strait of Hormuz closure — pass-through to my book"
    }, {
      id: "s2",
      sig: 0.78,
      horizon: "now",
      domain: "Macroeconomics",
      fact: "Rate-cut expectations unwound — futures took the next Fed cut off the table as the energy spike hit.",
      datum: "Sept cut priced 78% → 34% · US 2Y +9bp to 4.86% · breakevens +11bp",
      chain: ["Crude spike", "Headline inflation re-accelerates", "Fed holds, front end repriced"],
      affects: [{
        t: "NVDA",
        dir: "headwind"
      }, {
        t: "ASML",
        dir: "headwind"
      }, {
        t: "TSM",
        dir: "headwind"
      }],
      sources: 6,
      read: "The macro transmission of the Gulf shock. Core disinflation is intact, but the Fed reacts to headline — and headline just got an energy problem. Higher-for-longer is the direct headwind to the high-duration tech that dominates your watchlist.",
      detail: "The move is in expectations, not data: no print has changed, but fed-funds futures and breakevens repriced within the hour the Hormuz headline crossed. If crude holds above $90 into the next CPI, the agent expects the hawkish repricing to stick; if the strait de-escalates, it unwinds as fast as it came. This single variable matters more for your book this week than any company-level news.",
      findings: [{
        source: "cmegroup.com",
        title: "Fed-funds futures unwind September cut probability",
        at: "2h ago",
        sig: 0.70,
        url: "https://www.cmegroup.com"
      }, {
        source: "ft.com",
        title: "Oil shock revives the inflation question for central banks",
        at: "4h ago",
        sig: 0.58,
        url: "https://www.ft.com"
      }],
      research: "Energy-driven inflation — the Fed reaction function"
    }, {
      id: "s3",
      sig: 0.66,
      horizon: "ahead",
      domain: "Geopolitics · Industries",
      fact: "China opened a third day of military exercises encircling Taiwan as the Gulf drew US attention.",
      datum: "PLA drills, 3rd day · advanced-node & CoWoS capacity ~90% concentrated on the island",
      chain: ["Taiwan pressure rises", "Supply-concentration premium", "AI-silicon tail risk re-prices"],
      affects: [{
        t: "TSM",
        dir: "headwind"
      }, {
        t: "NVDA",
        dir: "headwind"
      }],
      sources: 5,
      read: "A second, separate supply-risk premium — and the timing is the story. With US carrier assets pulled toward the Gulf, the agent reads the exercises as opportunistic signalling. No production is affected, but the standing tail risk under your entire AI stack got louder this week.",
      detail: "Nothing physical has changed at the fabs — TSMC is running normally and no shipments are disrupted. What changed is the probability the market assigns to the tail: with two flashpoints live at once and US attention divided, the concentration risk under TSM and NVDA is being re-priced rather than realised. The line to watch is whether drills cross from exercise posture toward a blockade.",
      findings: [{
        source: "reuters.com",
        title: "PLA extends drills around Taiwan into third day",
        at: "6h ago",
        sig: 0.62,
        url: "https://www.reuters.com"
      }, {
        source: "csis.org",
        title: "Advanced-node concentration remains the structural chokepoint",
        at: "1d ago",
        sig: 0.49,
        url: "https://www.csis.org"
      }],
      research: "Taiwan supply concentration — scenario tree"
    }, {
      id: "s4",
      sig: 0.58,
      horizon: "ahead",
      domain: "Industries",
      fact: "TSMC lifted its 2026 advanced-packaging capacity guidance — a third independent source corroborated the step-up.",
      datum: "CoWoS capacity guide raised · 3rd corroborating source",
      chain: ["Packaging capacity steps up", "Accelerator constraint eases", "Shippable AI volume rises"],
      affects: [{
        t: "NVDA",
        dir: "tailwind"
      }, {
        t: "TSM",
        dir: "tailwind"
      }],
      sources: 4,
      read: "The week's one clean tailwind, and a reminder the structural AI story is intact underneath the macro noise. Packaging is the binding constraint on accelerator volume; easing it reads straight through to units NVDA can ship. Today's risk-off tape buries it — but it survives the headlines.",
      detail: "This is the kind of slow, corroborated supply signal the agent weights heavily because it changes the denominator, not the sentiment. It won't move the tape on a day the Gulf owns the headlines, but it's the durable thread under your book — the reason the agent still scores AI-silicon a structural tailwind even as it sells off today.",
      findings: [{
        source: "digitimes.com",
        title: "OSAT packaging allocation lifts for 2026",
        at: "7h ago",
        sig: 0.56,
        url: "https://www.digitimes.com"
      }, {
        source: "reuters.com",
        title: "Third supplier note corroborates CoWoS step-up",
        at: "1d ago",
        sig: 0.52,
        url: "https://www.reuters.com"
      }],
      research: "CoWoS 2026 step-up — names most exposed"
    }],
    // GEOPOLITICS — the origin layer. Each event leads with the neutral fact + the numbers; the
    // agent's read, the propagation chain, the reports behind it and the names threaded sit on the
    // expand. News & events live INSIDE the event they belong to.
    geopolitics: {
      asOf: "continuously scraped",
      intro: "The origin layer. Most of what moves your book starts upstream in the physical world — who controls the shipping lanes, who can make the advanced chips, who writes the export rules. The agent watches these first, then threads each one down to the names you hold. Open any event for the full read, the reports behind it, and the names it touches.",
      events: [{
        id: "g1",
        sig: 0.91,
        horizon: "now",
        title: "Iran threatens to close the Strait of Hormuz",
        region: "Gulf · Iran",
        risk: "acute",
        since: "12h",
        fact: "Iran's IRGC detained a tanker and warned it can close the strait 'within hours'; the US ordered a carrier group into the Gulf.",
        datum: "~20% of seaborne crude · ~33% of LNG · Brent +6.4% to $94 · tanker rates 2×",
        media: {
          kind: "video",
          label: "live · Gulf correspondent",
          live: true
        },
        read: "The single most significant event the scraper surfaced this cycle, and the origin of today's whole tape. A sustained closure premium re-arms inflation and forces the Fed to hold — which is how a Gulf shipping story becomes a headwind on your semiconductors.",
        chain: ["Strait threatened", "Crude & LNG freight spike", "Headline inflation re-arms", "Fed holds → duration premium on tech"],
        threads: ["Crude", "Tankers", "Defense", "Inflation", "NVDA", "TSM"],
        detail: "Full closure remains the tail case — the strait has been threatened repeatedly and never fully shut, and the Fifth Fleet exists to keep it open. But the disruption premium is real now: insurers pulled war-risk cover on Gulf transits this morning and re-routing around Africa adds roughly two weeks per cargo. The agent is tracking three escalation markers — a second seizure, a mining report, or a formal US rules-of-engagement change. Any one would move this from premium to event.",
        findings: [{
          source: "reuters.com",
          title: "IRGC detains tanker, warns it can close Hormuz 'within hours'",
          at: "3h ago",
          sig: 0.86,
          url: "https://www.reuters.com"
        }, {
          source: "lloydslist.com",
          title: "War-risk insurance pulled on Gulf transits; freight rates double",
          at: "2h ago",
          sig: 0.71,
          url: "https://lloydslist.com"
        }, {
          source: "bloomberg.com",
          title: "US carrier strike group ordered into the Gulf",
          at: "5h ago",
          sig: 0.64,
          url: "https://www.bloomberg.com"
        }],
        research: "Strait of Hormuz closure — pass-through to my book"
      }, {
        id: "g2",
        sig: 0.66,
        horizon: "ahead",
        title: "PLA exercises encircle Taiwan for a third day",
        region: "Taiwan Strait",
        risk: "elevated",
        since: "3 days",
        fact: "China extended live-fire drills around Taiwan into a third day while US carrier assets shifted toward the Gulf.",
        datum: "Advanced-node & CoWoS capacity ~90% concentrated on the island",
        media: {
          kind: "image",
          label: "satellite · strait transit"
        },
        read: "A second supply-risk premium running in parallel with the Gulf. No fab output is affected, but the standing tail risk under your entire AI stack — TSM and NVDA both — is re-pricing louder while US attention is divided.",
        chain: ["Taiwan pressure rises", "Supply-concentration premium", "AI-silicon tail risk re-prices"],
        threads: ["TSM", "NVDA", "Advanced packaging"],
        detail: "Production is normal; this is a probability story, not a supply story. The agent's read is that the timing — coinciding with the Hormuz crisis — is deliberate signalling rather than a prelude to blockade. The score changes only on a move from exercise posture toward sustained airspace or maritime closure, which would convert the premium into a genuine supply event for the whole advanced-node chain.",
        findings: [{
          source: "reuters.com",
          title: "PLA extends drills around Taiwan into third day",
          at: "6h ago",
          sig: 0.62,
          url: "https://www.reuters.com"
        }, {
          source: "csis.org",
          title: "Advanced-node concentration remains the structural chokepoint",
          at: "1d ago",
          sig: 0.49,
          url: "https://www.csis.org"
        }],
        research: "Taiwan supply concentration — scenario tree"
      }, {
        id: "g3",
        sig: 0.59,
        horizon: "ahead",
        title: "US circulates a tighter AI-chip export framework",
        region: "US · China",
        risk: "elevated",
        since: "active",
        fact: "A draft US export-license framework would widen restrictions on advanced lithography and AI accelerators bound for China.",
        datum: "China mix ~30% for litho equipment · draft text circulating in Washington",
        read: "Policy, not fundamentals — but it's the dominant overhang on the equipment makers. It widens the China-mix downside for ASML specifically and caps the cadence of advanced-node tool sales, even with order books steady.",
        chain: ["US tightens export rules", "China-mix downside widens", "Litho & WFE cadence capped"],
        threads: ["ASML", "Semi equipment", "TSM"],
        detail: "The draft is not final and the lenient and strict cases are far apart — the spread is wider than the consensus model implies, which matters more for the timing of revenue than the annual total. The agent treats this as a cadence risk concentrated in ASML, not a demand problem for the group. The clause to watch is its treatment of mature-node tools — it decides whether the hit stays contained to the leading edge.",
        findings: [{
          source: "reuters.com",
          title: "Draft export-license framework circulates",
          at: "8h ago",
          sig: 0.66,
          url: "https://www.reuters.com"
        }, {
          source: "asml.com",
          title: "Order-book commentary unchanged at investor update",
          at: "2d ago",
          sig: 0.41,
          url: "https://www.asml.com"
        }],
        research: "Export-control draft — ASML China-mix sensitivity"
      }, {
        id: "g4",
        sig: 0.44,
        horizon: "now",
        title: "European gas firms on Gulf LNG-supply fears",
        region: "Europe",
        risk: "watch",
        since: "1 day",
        fact: "European gas benchmarks rose on fears the Hormuz disruption pulls Qatari LNG into a tighter global market.",
        datum: "TTF +8% · ~20% of traded LNG routes through the strait",
        read: "A second-order effect of the Gulf event, not a standalone story. It widens the European industrial-cost headwind and feeds the same inflation read driving the Fed repricing — relevant to your book only through the macro channel.",
        chain: ["Hormuz LNG risk", "European gas tightens", "Industrial cost & inflation pressure"],
        threads: ["Nat gas", "European industry", "Inflation"],
        detail: "Europe rebuilt storage and diversified off Russian pipeline gas, so this is a price event rather than a shortage one — but a sustained Gulf disruption tightens the entire seaborne LNG market at once. The agent keeps it in the geopolitics layer because its only path to your holdings is the macro inflation channel it already scores under the Fed-repricing signal.",
        findings: [{
          source: "bloomberg.com",
          title: "European gas jumps on Gulf LNG-supply concern",
          at: "1d ago",
          sig: 0.44,
          url: "https://www.bloomberg.com"
        }],
        research: "Gulf LNG disruption — European gas pass-through"
      }]
    },
    // MACROECONOMICS — the channel through which the Gulf shock reaches your book. The data hasn't
    // changed yet; expectations have. Headline is where the energy spike bites; core still eases.
    macro: {
      asOf: "latest prints · futures repricing live",
      intro: "The state of the economies the agent tracks, and the channel through which the Gulf shock reaches your book. Core disinflation is intact — but the Fed reacts to headline, and headline just got an energy problem.",
      economies: [{
        code: "US",
        name: "United States",
        regime: "Late cycle · inflation risk back",
        metrics: [["GDP", "+2.4%"], ["Core PCE", "2.6%"], ["Headline", "3.1%"], ["Unemp.", "4.1%"]],
        note: "Core disinflation intact, but headline carries the energy spike. Futures took the next cut off the table within the hour the Hormuz headline crossed."
      }, {
        code: "EA",
        name: "Euro area",
        regime: "Stagnation · energy-exposed",
        metrics: [["GDP", "+0.6%"], ["CPI", "2.5%"], ["Unemp.", "6.4%"]],
        note: "Most exposed to the Gulf shock through gas. The ECB was ahead of the Fed on cuts; an energy-led inflation bump complicates that path."
      }, {
        code: "CN",
        name: "China",
        regime: "Stimulus-supported",
        metrics: [["GDP", "+4.8%"], ["CPI", "0.3%"], ["PMI", "50.8"]],
        note: "Disinflationary at home and a major crude importer — most exposed of the three to a sustained oil spike, and central to the semiconductor supply read."
      }],
      indicators: [{
        label: "Headline inflation",
        sub: "US CPI, YoY — the energy-sensitive one",
        value: "3.1%",
        chg: +0.2,
        unit: "pp",
        neutral: true,
        series: series(33, 24, 0.4)
      }, {
        label: "Core inflation",
        sub: "US core PCE, YoY — still easing",
        value: "2.6%",
        chg: -0.1,
        unit: "pp",
        neutral: true,
        series: series(31, 24, -0.2)
      }, {
        label: "Policy rate",
        sub: "Fed funds, upper — on hold",
        value: "4.75%",
        chg: 0,
        unit: "bp",
        neutral: true,
        series: series(34, 24, 0.0)
      }, {
        label: "Next-cut odds",
        sub: "September, futures-implied",
        value: "34%",
        chg: -44,
        unit: "pp",
        neutral: true,
        series: series(35, 24, -1.1)
      }, {
        label: "Employment",
        sub: "US unemployment rate",
        value: "4.1%",
        chg: +0.1,
        unit: "pp",
        neutral: true,
        series: series(32, 24, 0.1)
      }, {
        label: "US 2-year",
        sub: "Front end — repriced hawkish",
        value: "4.86%",
        chg: +9,
        unit: "bp",
        neutral: true,
        series: series(36, 24, 0.6)
      }],
      read: "The whole macro story today is one transmission: a Gulf energy shock landing on a headline number that was almost home. Core is fine; the Fed reacts to headline. If Brent holds above $90 into the next CPI, the hawkish repricing sticks and the duration premium on your semis stays on. If the strait de-escalates, it unwinds as fast as it came — this single variable matters more for your book this week than any company-level news."
    },
    // INDUSTRY TRENDS — the section read; the cards themselves come from the INDUSTRIES array so
    // each opens its deep research (supply chain, news, constituents).
    industries: {
      asOf: "rolled up from coverage",
      read: "Two stories at once. The structural one is intact and even improved — AI compute buildout, with TSMC's packaging step-up easing the binding constraint. The cyclical one is today's tape: a risk-off, higher-for-longer regime that sells long-duration tech and bids energy, defense and shipping. Your book sits on the structural side; the week belongs to the cyclical one."
    },
    // GENERAL MARKET — how the shock shows up in prices. Indices + cross-asset, then your names as
    // movers (resolved from the watchlist). Reads & observations only.
    market: {
      asOf: "delayed 15m",
      intro: "How the shock is showing up in prices. Energy, gold and the dollar are bid; long-duration tech — your book — carries the duration premium. Open any name for its full record.",
      indices: [{
        label: "S&P 500",
        value: "5,431",
        chg: -1.1,
        unit: "%"
      }, {
        label: "Nasdaq 100",
        value: "19,240",
        chg: -1.6,
        unit: "%"
      }, {
        label: "Dow",
        value: "40,180",
        chg: -0.5,
        unit: "%"
      }, {
        label: "Russell 2000",
        value: "2,012",
        chg: -1.4,
        unit: "%"
      }, {
        label: "Brent crude",
        value: "$94.10",
        chg: +6.4,
        unit: "%"
      }, {
        label: "Gold",
        value: "$2,418",
        chg: +1.5,
        unit: "%"
      }, {
        label: "DXY",
        value: "105.40",
        chg: +0.6,
        unit: "%"
      }, {
        label: "VIX",
        value: "19.2",
        chg: +21,
        unit: "%"
      }],
      read: "Textbook risk-off, energy-led. The cross-asset move is internally consistent — crude, gold, dollar and vol up together, equities and the long end of tech down. Your watchlist is net lower not on any company news but on the macro premium above it. The agent flags no alert-level move in a single holding; the signal is the regime, not the name."
    }
  };

  // INDUSTRIES — the deep research surface. For each industry the scraper continuously gathers
  // movement, supply-chain disruptions, and news; the agent then researches it in depth and writes
  // the qualitative understanding. Each carries: what the business/industry actually is (qualitative),
  // the numbers (quantitative), the supply chain in tiers, current news & events affecting it, and
  // the constituent names with sentiment + a few key fundamentals. Reads & observations only.
  const INDUSTRIES = [{
    id: "ind-ai-silicon",
    name: "AI accelerator silicon",
    sector: "Information Technology",
    bias: "tailwind",
    movePct: -1.8,
    asOf: "delayed 15m",
    researchedAt: "1h ago",
    telemetry: {
      tools: 21,
      sources: 14,
      inTok: "61.2k",
      outTok: "3.4k",
      elapsed: "1h 40m"
    },
    overview: "The chips that train and run large AI models — GPUs and custom accelerators. The business is selling scarce compute: design the silicon, secure advanced-node wafers and packaging, and ship systems faster than rivals. Margins are exceptional while demand outruns supply, so the whole industry is gated less by orders than by how many units the foundry-and-packaging chain can physically produce.",
    whatsHappening: "Caught between two forces. The structural story improved — a third source corroborated TSMC's 2026 CoWoS packaging step-up, easing the supply constraint on shippable volume. But the names sell off today: the Gulf energy shock and renewed Taiwan drills stack a duration-and-supply risk premium over the whole group.",
    metrics: [{
      label: "Group rev growth",
      value: "+58%",
      dir: "up",
      note: "YoY, ttm"
    }, {
      label: "Median gross margin",
      value: "61%",
      dir: "up"
    }, {
      label: "Fwd demand visibility",
      value: "High"
    }, {
      label: "Binding constraint",
      value: "Packaging"
    }],
    supplyChain: {
      upstream: ["ASML (EUV litho)", "Applied Materials / Lam (WFE)", "SK Hynix · Micron (HBM)"],
      core: ["TSMC (advanced node)", "ASE / Amkor (CoWoS packaging)"],
      downstream: ["Hyperscalers (Azure, AWS, GCP)", "Server OEMs (Dell, SMCI)", "Vertiv (power & thermal)"]
    },
    drivers: [{
      label: "CoWoS packaging capacity",
      dir: "tailwind",
      note: "the binding constraint — now stepping up for 2026"
    }, {
      label: "HBM allocation",
      dir: "tailwind",
      note: "contract pricing firming; supply matched to accelerators"
    }, {
      label: "Export controls",
      dir: "headwind",
      note: "China-mix downside for the most exposed names"
    }],
    news: [{
      kind: "report",
      topic: "TSMC lifts advanced-packaging capacity guidance for 2026",
      source: "reuters.com",
      at: "1h ago",
      excerpt: "Third independent supplier note corroborates the CoWoS step-up — capacity, not demand, stays the throttle on shippable accelerator volume.",
      url: "https://www.reuters.com"
    }, {
      kind: "article",
      topic: "Contract HBM pricing firms ahead of spot into Q3",
      source: "trendforce.com",
      at: "2h ago",
      excerpt: "Memory leads for a second week; matched HBM supply is the gating input for accelerator builds.",
      url: "https://www.trendforce.com"
    }, {
      kind: "filing",
      topic: "Hyperscaler reiterates elevated capex into next FY",
      source: "sec.gov",
      at: "6h ago",
      excerpt: "Demand-side guidance unchanged — the order book stays well ahead of the supply chain's ability to deliver.",
      url: "https://www.sec.gov"
    }],
    constituents: [{
      ticker: "NVDA",
      name: "NVIDIA",
      changePct: 2.41,
      sent: 0.42,
      metrics: [["Rev gr.", "+126%"], ["Gross m.", "75%"], ["FCF", "$56.5B"]],
      note: "Sets the cadence; most unit-constrained on packaging, so added capacity flows most directly to volume."
    }, {
      ticker: "AVGO",
      name: "Broadcom",
      changePct: 1.12,
      sent: 0.27,
      metrics: [["Rev gr.", "+44%"], ["Gross m.", "63%"], ["FCF", "$19.4B"]],
      note: "Second-source custom silicon plus networking; benefits one step removed from the lead allocation."
    }, {
      ticker: "AMD",
      name: "Advanced Micro Devices",
      changePct: 1.18,
      sent: 0.14,
      metrics: [["Rev gr.", "+9%"], ["Gross m.", "53%"], ["FCF", "$4.1B"]],
      note: "Credible #2 GPU; share gains hinge on software stack maturity and its own packaging allocation."
    }],
    agentRead: "Qualitatively this is one coherent bet — AI compute buildout — with the supply chain as the only real variable. Quantitatively the businesses are exceptional (growth, margin, cash). The risk isn't the companies, it's upstream: packaging capacity and the export-control overhang. The week's news eases the first and leaves the second intact."
  }, {
    id: "ind-dc-power",
    name: "Data-center power & thermal",
    sector: "Industrials",
    bias: "tailwind",
    movePct: 0.4,
    asOf: "delayed 15m",
    researchedAt: "3h ago",
    telemetry: {
      tools: 14,
      sources: 9,
      inTok: "33.8k",
      outTok: "2.1k",
      elapsed: "52m"
    },
    overview: "The picks-and-shovels of the AI buildout: the power distribution and liquid-cooling gear that lets dense accelerator racks run without melting. As chips draw more watts per rack, thermal and power density become the binding constraint at the facility — so this industry sells into the same demand wave as silicon, one layer down, with longer-cycle, backlog-driven revenue.",
    whatsHappening: "Holding up better than the rest of tech. AI-buildout demand is real and order-backed — two more hyperscaler liquid-cooling retrofits confirmed — and as a shorter-duration industrial it carries less of the rate premium hitting the silicon names today.",
    metrics: [{
      label: "Group rev growth",
      value: "+17%",
      dir: "up",
      note: "YoY, ttm"
    }, {
      label: "Median op. margin",
      value: "16%",
      dir: "up"
    }, {
      label: "Backlog trend",
      value: "Rising",
      dir: "up"
    }, {
      label: "Binding constraint",
      value: "Power density"
    }],
    supplyChain: {
      upstream: ["Copper & busbar", "Power semis (SiC)", "Compressor / pump OEMs"],
      core: ["Vertiv · Eaton · nVent (power & thermal)"],
      downstream: ["Colocation operators", "Hyperscalers", "Enterprise AI clusters"]
    },
    drivers: [{
      label: "Rack power density",
      dir: "tailwind",
      note: "next-gen accelerators force liquid cooling retrofits"
    }, {
      label: "Grid interconnect queues",
      dir: "headwind",
      note: "power availability gates new site timing"
    }, {
      label: "Copper input cost",
      dir: "mixed",
      note: "firming demand tell, but a margin watch item"
    }],
    news: [{
      kind: "article",
      topic: "Two hyperscalers confirm liquid-cooling retrofits",
      source: "datacenterdynamics.com",
      at: "5h ago",
      excerpt: "Cooling backlog corroborated across orders and two channel checks — demand one layer down from the silicon.",
      url: "https://www.datacenterdynamics.com"
    }, {
      kind: "report",
      topic: "Copper extends higher on physical-demand bid",
      source: "bloomberg.com",
      at: "4h ago",
      excerpt: "Metal leading the dollar move reads as real buildout demand, not just a weak-dollar effect.",
      url: "https://www.bloomberg.com"
    }],
    constituents: [{
      ticker: "VRT",
      name: "Vertiv",
      changePct: 3.05,
      sent: 0.51,
      metrics: [["Rev gr.", "+17%"], ["Op. m.", "17%"], ["Backlog", "Rising"]],
      note: "Most constructive read on the list — liquid-cooling backlog cited up sharply QoQ; small-cap source breadth is the caveat."
    }, {
      ticker: "ETN",
      name: "Eaton",
      changePct: 0.74,
      sent: 0.22,
      metrics: [["Rev gr.", "+8%"], ["Op. m.", "23%"], ["FCF", "$3.5B"]],
      note: "Diversified electrical; data-center is the fastest-growing slice but not the whole story."
    }, {
      ticker: "NVT",
      name: "nVent Electric",
      changePct: 1.30,
      sent: 0.19,
      metrics: [["Rev gr.", "+11%"], ["Op. m.", "19%"], ["FCF", "$0.6B"]],
      note: "Enclosures & liquid-cooling; higher-beta way to play rack thermal."
    }],
    agentRead: "The cleanest second-derivative play on AI compute. The qualitative story — power and thermal as the new bottleneck — is corroborated quantitatively by rising backlogs and the copper bid. The watch item is grid interconnect timing, which can push revenue right even when demand is firm."
  }, {
    id: "ind-semi-equip",
    name: "Semiconductor equipment",
    sector: "Information Technology",
    bias: "headwind",
    movePct: -1.5,
    asOf: "delayed 15m",
    researchedAt: "2h ago",
    telemetry: {
      tools: 17,
      sources: 11,
      inTok: "47.0k",
      outTok: "2.8k",
      elapsed: "1h 05m"
    },
    overview: "The tool-makers that build the machines every chip fab needs — lithography, deposition, etch, inspection. It's a concentrated, high-margin oligopoly sitting upstream of the entire industry, with ASML the sole EUV supplier. Because the tools are dual-use and export-sensitive, this is the one corner of tech where geopolitics, not end demand, often sets the tape.",
    whatsHappening: "Weakest corner of tech. A tighter draft US export-license framework is circulating in Washington, widening the China-mix downside for litho and WFE — and today's risk-off tape compounds it. Policy, not fundamentals: order books are steady, but the overhang sets the price.",
    metrics: [{
      label: "Group rev growth",
      value: "+4%",
      dir: "up",
      note: "YoY, ttm"
    }, {
      label: "Median gross margin",
      value: "51%"
    }, {
      label: "China revenue mix",
      value: "~30%",
      dir: "down",
      note: "policy-sensitive"
    }, {
      label: "Order book",
      value: "Stable"
    }],
    supplyChain: {
      upstream: ["Zeiss (optics)", "Precision components", "Rare-gas & materials"],
      core: ["ASML (EUV/DUV litho)", "Applied Materials · Lam (deposition/etch)", "KLA (inspection)"],
      downstream: ["TSMC · Samsung · Intel (fabs)", "Memory makers"]
    },
    drivers: [{
      label: "Export-control policy",
      dir: "headwind",
      note: "circulating draft widens China-mix downside"
    }, {
      label: "Leading-edge capex",
      dir: "tailwind",
      note: "advanced-node buildout sustains tool demand"
    }, {
      label: "Memory capex recovery",
      dir: "mixed",
      note: "improving but disciplined"
    }],
    news: [{
      kind: "filing",
      topic: "Draft export-license framework circulates in Washington",
      source: "reuters.com",
      at: "3h ago",
      excerpt: "Would tighten the China-mix case for litho equipment — policy-driven, capping cadence more than the annual total.",
      url: "https://www.reuters.com"
    }, {
      kind: "report",
      topic: "Order book commentary unchanged at investor update",
      source: "asml.com",
      at: "2d ago",
      excerpt: "Fundamentals steady; the move in the group is being set by policy headlines, not the backlog.",
      url: "https://www.asml.com"
    }],
    constituents: [{
      ticker: "ASML",
      name: "ASML",
      changePct: -0.40,
      sent: -0.14,
      metrics: [["Rev gr.", "+3%"], ["Gross m.", "52%"], ["China mix", "~30%"]],
      note: "Sole EUV supplier — the single chokepoint upstream of every advanced node; most exposed to the policy overhang."
    }, {
      ticker: "AMAT",
      name: "Applied Materials",
      changePct: -0.18,
      sent: -0.06,
      metrics: [["Rev gr.", "+5%"], ["Gross m.", "47%"], ["FCF", "$7.4B"]],
      note: "Broadest WFE portfolio; diversified across deposition and etch dampens single-policy risk."
    }, {
      ticker: "KLAC",
      name: "KLA Corp",
      changePct: 0.11,
      sent: 0.04,
      metrics: [["Rev gr.", "+6%"], ["Gross m.", "61%"], ["FCF", "$3.0B"]],
      note: "Inspection & metrology; levered to advanced-packaging volume, a relative bright spot in the group."
    }],
    agentRead: "Fundamentally the group is fine — order books steady, leading-edge capex intact. The divergence is entirely policy. Treat the export-control draft as a cadence risk on the China mix, concentrated in ASML, rather than a demand problem. Watch the framework's final text for whether the lenient or strict case binds."
  }, {
    id: "ind-memory-hbm",
    name: "Memory & HBM",
    sector: "Information Technology",
    bias: "mixed",
    movePct: -0.7,
    asOf: "delayed 15m",
    researchedAt: "21m ago",
    telemetry: {
      tools: 9,
      sources: 6,
      inTok: "19.4k",
      outTok: "1.2k",
      elapsed: "34m"
    },
    overview: "The makers of the high-bandwidth memory stacked next to every AI accelerator. A classically cyclical, capital-intensive commodity business now reshaped by HBM: supply is tight, pricing is recovering, and the makers have been disciplined on capacity. Contract pricing — not volatile spot — is the durable signal for where margins are heading.",
    whatsHappening: "Contract DRAM/HBM pricing firmed ahead of spot for a second week — the durable signal into Q3, constructive for memory-maker margins. But the cyclical, capital-intensive makers trade with the risk-off tape today despite the firm pricing underneath.",
    metrics: [{
      label: "Contract pricing",
      value: "Firming",
      dir: "up",
      note: "2nd week"
    }, {
      label: "Supply discipline",
      value: "High"
    }, {
      label: "Cycle position",
      value: "Up-cycle"
    }, {
      label: "HBM allocation",
      value: "Tight"
    }],
    supplyChain: {
      upstream: ["WFE tools", "Silicon wafers", "Substrate makers"],
      core: ["SK Hynix · Samsung · Micron (DRAM/HBM)"],
      downstream: ["NVDA · AMD (accelerators)", "Smartphone / PC OEMs"]
    },
    drivers: [{
      label: "Contract HBM pricing",
      dir: "tailwind",
      note: "firming faster than spot — the durable read"
    }, {
      label: "Supplier capacity discipline",
      dir: "tailwind",
      note: "makers signalling restraint"
    }, {
      label: "Downstream BOM cost",
      dir: "headwind",
      note: "rising memory cost pressures device margins"
    }],
    news: [{
      kind: "article",
      topic: "Contract DRAM pricing firms into Q3",
      source: "trendforce.com",
      at: "1h ago",
      excerpt: "Contract leads spot for a second week — the durable signal reading through to memory-maker margins.",
      url: "https://www.trendforce.com"
    }, {
      kind: "report",
      topic: "Memory makers signal disciplined supply",
      source: "bloomberg.com",
      at: "5h ago",
      excerpt: "Capacity restraint cited across the majors — the supply side that underpins the pricing recovery.",
      url: "https://www.bloomberg.com"
    }],
    constituents: [{
      ticker: "MU",
      name: "Micron",
      changePct: 1.40,
      sent: 0.30,
      metrics: [["Rev gr.", "+58%"], ["Gross m.", "35%"], ["Cycle", "Up"]],
      note: "Most-levered US name to contract HBM pricing — margin sensitivity is highest here."
    }, {
      ticker: "SK Hynix",
      name: "SK Hynix",
      changePct: 0.90,
      sent: 0.34,
      metrics: [["HBM share", "Lead"], ["Mix", "HBM-heavy"], ["Cycle", "Up"]],
      note: "HBM share leader; the primary supplier matched to the lead accelerator programs."
    }],
    agentRead: "A rare two-sided read inside the AI book: constructive for the memory makers, a mild cost headwind for the accelerator builders that consume HBM. The contract-vs-spot divergence is the thing to track — contract firming is what makes this an up-cycle rather than a head-fake."
  }];

  // Phrases the agent rotates through when a freshly-asked session opens.
  const ASK_PHRASES = ["Thinking…", "Reconstructing what I already know…", "Searching for primary sources…", "Reading and cross-checking…", "Scoring significance…", "Drafting an answer with citations…"];
  window.DATA = {
    ACTIVE,
    SESSIONS,
    FOLLOWING,
    CANDIDATES,
    TODAY,
    NEWS,
    BUDGET,
    WORLD,
    INDUSTRIES,
    ASK_PHRASES
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/data.js", error: String((e && e.message) || e) }); }

// ui_kits/terminal/kit.jsx
try { (() => {
/* Shared helpers for the research-desk UI kit — injected style, Lucide icon, formatters,
 * and a small telemetry grid (the agent's "full visibility" numbers). */
const {
  useEffect,
  useRef,
  useState
} = React;
function useStyle(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/* Lucide icon as a React component. Upgrades the <i> to an SVG after mount. */
function Icon({
  name,
  size = 16,
  className = "",
  style = {}
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [name]);
  return /*#__PURE__*/React.createElement("i", {
    ref: ref,
    "data-lucide": name,
    className: className,
    style: {
      width: size,
      height: size,
      display: "inline-flex",
      ...style
    }
  });
}
function fmtPrice(n) {
  return n == null ? "—" : n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function fmtPct(n) {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/* Telemetry — the transparency grid. Every cell is a mono label + value the user can see. */
function Telemetry({
  t,
  compact = false
}) {
  useStyle("kit-telemetry", `
    .tlm{ display:grid; grid-template-columns:repeat(auto-fit, minmax(50px, 1fr)); gap:1px; background:var(--border-default);
      border:1px solid var(--border-default); border-radius:var(--radius-md); overflow:hidden; }
    .tlm__cell{ background:var(--surface-panel); padding:7px 7px; }
    .tlm__cell.compact{ padding:6px 7px; }
    .tlm__k{ font-family:var(--font-mono); font-size:8px; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); white-space:nowrap; }
    .tlm__v{ font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; margin-top:2px; }
  `);
  const cells = [["turn", t.maxTurns ? `${t.turn}/${t.maxTurns}` : t.turn], ["tools", t.tools], ["sources", t.sources], ["tokens in", t.inTok], ["tokens out", t.outTok], ["elapsed", t.elapsed]].filter(([, v]) => v != null);
  return /*#__PURE__*/React.createElement("div", {
    className: "tlm"
  }, cells.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    className: `tlm__cell ${compact ? "compact" : ""}`,
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    className: "tlm__k"
  }, k), /*#__PURE__*/React.createElement("div", {
    className: "tlm__v"
  }, v))));
}
Object.assign(window, {
  useStyle,
  Icon,
  fmtPrice,
  fmtPct,
  Telemetry
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/kit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AgentStatus = __ds_scope.AgentStatus;

__ds_ns.AgentTrace = __ds_scope.AgentTrace;

__ds_ns.BudgetGauge = __ds_scope.BudgetGauge;

__ds_ns.ImpactMap = __ds_scope.ImpactMap;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.PriceQuote = __ds_scope.PriceQuote;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.StockDetail = __ds_scope.StockDetail;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.TierBadge = __ds_scope.TierBadge;

__ds_ns.OriginBadge = __ds_scope.OriginBadge;

__ds_ns.SignificanceMeter = __ds_scope.SignificanceMeter;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.Panel = __ds_scope.Panel;

})();
