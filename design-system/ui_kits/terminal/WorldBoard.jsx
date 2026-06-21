// WorldBoard — the unified surveillance view, the center of the terminal. Read like an intelligence
// dossier, not a dashboard: the information leads, the UI recedes. It opens with the agent's
// OVERVIEW synthesizing every domain it swept, then walks the research database's domains in order —
// Geopolitics (with the news & events inside each), Macroeconomics, Industry trends, General market.
// Every statement is a fact first; click it to expand the agent's full read, the propagation chain,
// the reports behind it, the names it threads to, and a way into research. Exports window.WorldBoard.

const { Sparkline: WBSparkline } = window.AIStockAgentDesignSystem_ea6e23;
const { useEffect: useEffectWB, useRef: useRefWB, useState: useStateWB } = React;

// Significance is shown as a TIME HORIZON, never a number: what matters NOW vs. what's BUILDING and
// will matter ahead. No one cares about a 0.74 — they care whether to act on it now or watch it.
function HorizonTag({ horizon }) {
  const h = horizon === "ahead" ? "ahead" : "now";
  const label = h === "ahead" ? "Building" : "Now";
  return <span className={`wb__hz wb__hz--${h}`}>{label}</span>;
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
function Findings({ items }) {
  if (!items || !items.length) return null;
  return (
    <React.Fragment>
      <div className="wb__blk">The reports behind it</div>
      <div className="wb__finds">
        {items.map((f, i) => (
          <a className="wb__find" key={i} href={f.url} target="_blank" rel="noopener noreferrer">
            <span className="wb__findmain">
              <span className="wb__findtitle">{f.title}</span>
              <span className="wb__findmeta"><span className="wb__findsrc"><window.Icon name="link" size={9} />{f.source}</span></span>
            </span>
            <span className="wb__findat">{f.at}</span>
          </a>
        ))}
      </div>
    </React.Fragment>
  );
}

function Chain({ nodes }) {
  if (!nodes || !nodes.length) return null;
  return (
    <div className="wb__chain">
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="wb__chainarrow"><window.Icon name="chevron-right" size={13} /></span>}
          <span className="wb__chainnode">{n}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// A live news clip / image placeholder — the user drops in real footage or imagery later.
function MediaSlot({ media }) {
  if (!media) return null;
  return (
    <div className="wb__media">
      {media.kind === "video" && <span className="wb__mediaplay"><window.Icon name="play" size={16} /></span>}
      {media.live && <span className="wb__medialive">live</span>}
      <span className="wb__medialabel">{media.label}</span>
    </div>
  );
}

function Actions({ research, onResearch }) {
  if (!research) return null;
  return (
    <div className="wb__acts">
      <button type="button" className="wb__act" onClick={(e) => { e.stopPropagation(); onResearch && onResearch(research); }}>
        <window.Icon name="search" size={12} />Open research
      </button>
    </div>
  );
}

function WorldBoard({ data, news, industries, following, onOpenIndustry, onPickStock, onResearch }) {
  window.useStyle("kit-world", WB_CSS);
  const W = data;
  const O = W.overview || {};
  const scrollRef = useRefWB(null);
  const inds = industries || [];
  const book = following || [];
  const [open, setOpen] = useStateWB({ s1: true, g1: true }); // lead items open by default
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const scrollToId = (id) => {
    const root = scrollRef.current;
    if (!root) return;
    const el = root.querySelector(`#${id}`);
    if (el) root.scrollTo({ top: el.offsetTop - root.querySelector(".wb__inner").offsetTop - 6, behavior: "smooth" });
  };
  // Left-nav domain jumps arrive as a window event.
  useEffectWB(() => {
    const onJump = (e) => scrollToId(`wb-${e.detail}`);
    window.addEventListener("world-jump", onJump);
    return () => window.removeEventListener("world-jump", onJump);
  }, []);

  const recByTicker = {};
  book.forEach((b) => { recByTicker[b.ticker] = b; });
  const pickTicker = (t) => { const r = recByTicker[t]; if (r && onPickStock) onPickStock(r); };

  return (
    <div className="wb" ref={scrollRef}>

      {/* ===== OVERVIEW — the synthesis across every domain ===== */}
      <div className="wb__ov">
        <h1 className="wb__ovtitle">{O.headline}</h1>
        <p className="wb__ovbody">{O.body}</p>
        <p className="wb__ovctx">{O.context}</p>

        <div className="wb__aspects">
          {(O.aspects || []).map((a) => (
            <button type="button" className="wb__aspect" key={a.domain} onClick={() => scrollToId(`wb-${a.jump}`)}>
              <span className="wb__aspectdomain">{a.domain}</span>
              <HorizonTag horizon={a.horizon} />
              <span className="wb__aspectline">{a.line}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAPE ===== */}
      <div className="wb__tape">
        {W.tape.map((t) => (
          <div className="wb__tapecell" key={t.label}>
            <span className="wb__tapelabel">{t.label}</span>
            <span className="wb__taperow">
              <span className="wb__tapeval">{t.value}</span>
              <span className={`wb__tapedelta ${wbDeltaClass(t.chg)}`}>{wbDeltaText(t.chg, t.unit)}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="wb__inner">

        {/* ===== SIGNALS \u2014 split by horizon: what matters Now vs. what's Building ===== */}
        <section className="wb__sec" id="wb-signals" data-screen-label="Signals">
          <div className="wb__sechead">
            <span className="wb__sectitle">Signals that matter</span>
          </div>
          <div className="wb__rule" />
          {[
            { key: "now", label: "Now", sub: "moving the tape today" },
            { key: "ahead", label: "Building", sub: "expected to matter ahead" },
          ].map((grp) => {
            const rows = (W.signals || []).filter((s) => (s.horizon || "now") === grp.key);
            if (!rows.length) return null;
            return (
              <div className="wb__hzgroup" key={grp.key}>
                <div className="wb__hzhead"><HorizonTag horizon={grp.key} /><span className="wb__hzsub">{grp.sub}</span></div>
                {rows.map((s) => {
                  const isOpen = !!open[s.id];
                  return (
                    <div className={`wb__item ${isOpen ? "wb__item--open" : ""}`} key={s.id}>
                      <button type="button" className="wb__head" onClick={() => toggle(s.id)}>
                        <div className="wb__kicker">
                          <span className="wb__dom">{s.domain}</span>
                          <span className="wb__src"><window.Icon name="link" size={10} />{s.sources} sources</span>
                          <span className="wb__chev"><window.Icon name="chevron-down" size={16} /></span>
                        </div>
                        <p className="wb__fact">{s.fact}</p>
                        <div className="wb__datum">{s.datum}</div>
                      </button>
                      {isOpen && (
                        <div className="wb__body">
                          <p className="wb__read">{s.read}</p>
                          {s.detail && <p className="wb__detail">{s.detail}</p>}
                          <Chain nodes={s.chain} />
                          <Findings items={s.findings} />
                          <Actions research={s.research} onResearch={onResearch} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>

        {/* ===== 01 GEOPOLITICS (news & events inside each) ===== */}
        <section className="wb__sec" id="wb-geopolitics" data-screen-label="Geopolitics">
          <div className="wb__sechead">
            <span className="wb__sectitle">Geopolitics & global events</span>
          </div>
          <p className="wb__secintro">{W.geopolitics.intro}</p>
          <div className="wb__rule" />
          {W.geopolitics.events.map((ev) => {
            const isOpen = !!open[ev.id];
            return (
              <div className={`wb__item ${isOpen ? "wb__item--open" : ""}`} key={ev.id}>
                <button type="button" className="wb__head" onClick={() => toggle(ev.id)}>
                  <div className="wb__kicker">
                    <HorizonTag horizon={ev.horizon} />
                    <span className={`wb__risk wb__risk-${ev.risk}`}>{ev.risk}</span>
                    <span className="wb__region">{ev.region} · {ev.since}</span>
                    <span className="wb__chev"><window.Icon name="chevron-down" size={16} /></span>
                  </div>
                  <p className="wb__fact">{ev.fact}</p>
                  <div className="wb__datum">{ev.datum}</div>
                </button>
                {isOpen && (
                  <div className="wb__body">
                    {ev.media && <MediaSlot media={ev.media} />}
                    <p className="wb__read">{ev.read}</p>
                    {ev.detail && <p className="wb__detail">{ev.detail}</p>}
                    <Chain nodes={ev.chain} />
                    <Findings items={ev.findings} />
                    <Actions research={ev.research} onResearch={onResearch} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ===== 02 MACROECONOMICS ===== */}
        <section className="wb__sec" id="wb-macro" data-screen-label="Macroeconomics">
          <div className="wb__sechead">
            <span className="wb__sectitle">Macroeconomics</span>
          </div>
          <p className="wb__secintro">{W.macro.intro}</p>

          <div className="wb__econ" style={{ marginTop: 14 }}>
            {W.macro.economies.map((e) => (
              <div className="wb__econrow" key={e.code}>
                <div className="wb__econtop">
                  <span className="wb__econcode">{e.code}</span>
                  <span className="wb__econname">{e.name}</span>
                  <span className="wb__econregime">{e.regime}</span>
                </div>
                <div className="wb__econstrip">
                  {e.metrics.map(([k, v]) => <span className="wb__econkv" key={k}>{k}<b>{v}</b></span>)}
                </div>
                <p className="wb__econnote">{e.note}</p>
              </div>
            ))}
          </div>

          <div className="wb__data">
            {W.macro.indicators.map((m) => (
              <div className="wb__datarow" key={m.label}>
                <div>
                  <div className="wb__dlabel">{m.label}</div>
                  {m.sub && <div className="wb__dsub">{m.sub}</div>}
                </div>
                <div className="wb__dvalwrap">
                  <span className="wb__dval">{m.value}</span>
                  <span className={`wb__ddelta ${wbDeltaClass(m.chg, m.neutral)}`}>{wbDeltaText(m.chg, m.unit)}</span>
                </div>
                <WBSparkline className="wb__dspark" data={m.series} width={92} height={26} area draw={false}
                  color={wbSparkColor(m.chg, m.neutral)} liveDot={false} />
              </div>
            ))}
          </div>
          <p className="wb__readtext">{W.macro.read}</p>
        </section>

        {/* ===== 03 INDUSTRY TRENDS (news inside each) ===== */}
        <section className="wb__sec" id="wb-industries" data-screen-label="Industry trends">
          <div className="wb__sechead">
            <span className="wb__sectitle">Industry trends</span>
          </div>
          <p className="wb__secintro">Industries the scraper tracks and the agent researches in depth. The fact leads; open one for its drivers, the news moving it, and the names inside — or open the full research for the supply chain.</p>
          <div className="wb__rule" />
          {inds.map((ind) => {
            const isOpen = !!open[ind.id];
            const md = ind.movePct > 0 ? "wb__up" : ind.movePct < 0 ? "wb__down" : "wb__flat";
            return (
              <div className={`wb__item ${isOpen ? "wb__item--open" : ""}`} key={ind.id}>
                <button type="button" className="wb__head" onClick={() => toggle(ind.id)}>
                  <div className="wb__kicker">
                    <span className={`wb__bias wb__bias-${ind.bias}`}>{ind.bias}</span>
                    <span className={`wb__indmove ${md}`}>{wbDeltaText(ind.movePct, "%")}</span>
                    <span className="wb__src">researched {ind.researchedAt}</span>
                    <span className="wb__chev"><window.Icon name="chevron-down" size={16} /></span>
                  </div>
                  <p className="wb__fact">{ind.name} — {ind.whatsHappening}</p>
                </button>
                {isOpen && (
                  <div className="wb__body">
                    <p className="wb__read">{ind.overview}</p>
                    {ind.drivers && (
                      <div className="wb__drivers">
                        {ind.drivers.map((d) => (
                          <div className="wb__driver" key={d.label}>
                            <span className={`wb__driverdot wb__affect wb__affect-${d.dir}`}>{d.label}</span>
                            <span className="wb__drivernote">{d.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {ind.news && (
                      <Findings items={ind.news.map((n) => ({ title: n.topic, source: n.source, at: n.at, sig: 0.5, url: n.url }))} />
                    )}
                    {ind.constituents && (
                      <React.Fragment>
                        <div className="wb__cons">
                          {ind.constituents.map((c) => {
                            const cc = c.changePct > 0 ? "wb__up" : c.changePct < 0 ? "wb__down" : "wb__flat";
                            return (
                              <button type="button" className="wb__con" key={c.ticker} onClick={() => pickTicker(c.ticker)}>
                                <span className="wb__conticker">{c.ticker}</span>
                                <span className="wb__conname">{c.name}</span>
                                <span className={`wb__conchg ${cc}`}>{wbDeltaText(c.changePct, "%")}</span>
                              </button>
                            );
                          })}
                        </div>
                      </React.Fragment>
                    )}
                    <div className="wb__acts">
                      <button type="button" className="wb__act" onClick={(e) => { e.stopPropagation(); onOpenIndustry && onOpenIndustry(ind); }}>
                        <window.Icon name="maximize-2" size={12} />Open full research
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <p className="wb__readtext">{W.industries.read}</p>
        </section>

        {/* ===== 04 GENERAL MARKET ===== */}
        <section className="wb__sec" id="wb-market" data-screen-label="General market">
          <div className="wb__sechead">
            <span className="wb__sectitle">General market</span>
          </div>
          <p className="wb__secintro">{W.market.intro}</p>

          <div className="wb__idx" style={{ marginTop: 14 }}>
            {W.market.indices.map((i) => (
              <div className="wb__idxcell" key={i.label}>
                <span className="wb__idxlabel">{i.label}</span>
                <span className="wb__idxright">
                  <span className="wb__idxval">{i.value}</span>
                  <span className={`wb__idxdelta ${wbDeltaClass(i.chg)}`}>{wbDeltaText(i.chg, i.unit)}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="wb__movers">
            {book.map((b) => {
              const cc = b.changePct > 0 ? "wb__up" : b.changePct < 0 ? "wb__down" : "wb__flat";
              return (
                <button type="button" className="wb__mover" key={b.ticker} onClick={() => onPickStock && onPickStock(b)}>
                  <span className="wb__mvticker">{b.ticker}</span>
                  <span className="wb__mvname">
                    <span className="wb__mvnamemain">{b.name}</span>
                    <span className="wb__mvpos">{(b.industry && b.industry.position) || (b.industry && b.industry.subIndustry) || ""}</span>
                  </span>
                  <span className="wb__mvprice">{window.fmtPrice ? window.fmtPrice(b.price) : b.price}</span>
                  <span className={`wb__mvchg ${cc}`}>{wbDeltaText(+b.changePct.toFixed(2), "%")}</span>
                </button>
              );
            })}
          </div>
          <p className="wb__readtext">{W.market.read}</p>
        </section>

      </div>
    </div>
  );
}

Object.assign(window, { WorldBoard });
