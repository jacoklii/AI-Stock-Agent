// LeftPanel — the toggleable secondary panel beside the nav rail. Renders one of three surfaces
// depending on the active nav button: Watchlist/Industries, Research list, or Chat. The Work
// button closes it (Desk sets leftTab=null). Exports window.LeftPanel.

const { Button: LPButton, PriceQuote: LPPriceQuote } = window.AIStockAgentDesignSystem_ea6e23;

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
  const domains = [
    { id: "finance", num: "01", name: "Finance", subs: ["US dollar & currencies", "Bond market", "Commodities"] },
    { id: "macro", num: "02", name: "Macroeconomics", subs: ["State of economies", "Growth", "Employment", "Inflation & rates"] },
    { id: "geopolitics", num: "03", name: "Geopolitics", subs: ["Global events", "Tech & manufacturing origin"] },
    { id: "industries", num: "04", name: "Industries", subs: ["Sectors", "Qualitative & quantitative"] },
  ];
  const jump = (id) => window.dispatchEvent(new CustomEvent("world-jump", { detail: id }));
  return (
    <div className="lp__pad">
      <p className="lp__worldhint">The agent's standing coverage. The board is swept continuously by the scraper — jump to a domain.</p>
      {domains.map((d) => (
        <button type="button" className="lp__domain" key={d.id} onClick={() => jump(d.id)}>
          <div className="lp__domaintop">
            <span className="lp__domainnum">{d.num}</span>
            <span className="lp__domainname">{d.name}</span>
            <span className="lp__domainchev"><window.Icon name="chevron-right" size={15} /></span>
          </div>
          <div className="lp__domainsubs">
            {d.subs.map((s) => <span className="lp__domainsub" key={s}>{s}</span>)}
          </div>
        </button>
      ))}
    </div>
  );
}

function WatchlistPanel({ following, industries, onPick, onPickIndustry }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const matches = following.filter((f) =>
    !q ||
    f.name.toLowerCase().includes(q) ||
    f.ticker.toLowerCase().includes(q) ||
    ((f.industry && f.industry.subIndustry) || "").toLowerCase().includes(q) ||
    ((f.industry && f.industry.sector) || "").toLowerCase().includes(q)
  );
  const inds = industries || [];

  return (
    <div className="lp__pad">
      <div className="lp__search">
        <window.Icon name="search" size={14} />
        <input className="lp__searchinput" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search names, tickers, industries…" />
        {query && (
          <button type="button" className="lp__searchclear" aria-label="Clear search" onClick={() => setQuery("")}>
            <window.Icon name="x" size={13} />
          </button>
        )}
      </div>

      <div className="lp__section">
        <div className="lp__sectionhead"><span>Stocks</span><span className="lp__sectioncount">{matches.length}</span></div>
        {matches.length === 0 ? (
          <div className="lp__empty">No names match “{query}”.</div>
        ) : matches.map((c) => (
          <div className="lp__row" key={c.id} onClick={() => onPick(c)}>
            <LPPriceQuote symbol={c.ticker} name={c.name} price={c.price} changePct={c.changePct} series={c.series} />
            <div className="lp__sub">{(c.industry && c.industry.subIndustry) || ""}</div>
            {c.tier === "discovered" && (
              <div className="lp__tag">discovered · added {c.addedBy === "agent" ? "by agent" : "by you"}</div>
            )}
          </div>
        ))}
      </div>

      <div className="lp__section">
        <div className="lp__sectionhead"><span>Industries you follow</span><span className="lp__sectioncount">{inds.length}</span></div>
        <p className="lp__indintro">What each industry is and the state the agent reads in it right now — open one for the full research.</p>
        {inds.map((ind) => {
          const md = ind.movePct > 0 ? "up" : ind.movePct < 0 ? "down" : "flat";
          const mv = `${ind.movePct > 0 ? "+" : ind.movePct < 0 ? "−" : ""}${Math.abs(ind.movePct)}%`;
          const n = (ind.constituents || []).length;
          return (
            <button type="button" className="lp__indcard" key={ind.id} onClick={() => onPickIndustry && onPickIndustry(ind)}>
              <div className="lp__indcardtop">
                <span className="lp__indcardname">{ind.name}</span>
                <span className={`lp__indcardmove lp__indcardmove--${md}`}>{mv}</span>
              </div>
              <p className="lp__indcardstate">{ind.whatsHappening}</p>
              <div className="lp__indcardmeta">
                <span className={`lp__indcardbias lp__indcardbias-${ind.bias}`}>{ind.bias}</span>
                <span className="lp__indcardnames">{n} {n === 1 ? "name" : "names"} · researched {ind.researchedAt}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResearchPanel({ active, sessions, onSelect }) {
  return (
    <div className="lp__pad">
      <div className="lp__rlhead">Active now</div>
      <div className="lp__active" onClick={() => onSelect(active.id)}>
        <div className="lp__activetop"><span className="lp__activekick">active research</span></div>
        <p className="lp__activetopic">{active.topic}</p>
        <div className="lp__activemeta">
          <span>turn {active.telemetry.turn}/{active.telemetry.maxTurns}</span>
          <span>·</span><span>{active.telemetry.sources} sources</span>
          <span>·</span><span>{active.telemetry.elapsed}</span>
        </div>
      </div>
      <div className="lp__rlhead">Sessions</div>
      {sessions.map((s) => (
        <div className="lp__sesrow" key={s.id} onClick={() => onSelect(s.id)}>
          <div className="lp__sestop">
            <span className="lp__sestopic">{s.topic}</span>
            <span className="lp__seschev"><window.Icon name="chevron-right" size={15} /></span>
          </div>
          <div className="lp__sesmeta">
            <span className={`lp__statusdot lp__statusdot--${s.status}`} />
            <span>{s.status === "closed" ? "done" : "open"}</span>
            <span>·</span><span>{s.openedAt}</span>
            {s.telemetry && (<><span>·</span><span>{s.telemetry.sources} sources</span></>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function IndustriesPanel({ industries, onPickIndustry }) {
  const list = industries || [];
  return (
    <div className="lp__pad">
      <p className="lp__indintro">Industries the scraper tracks and the agent researches in depth. Open one for its supply chain, the news affecting it, and the constituent names with sentiment & fundamentals.</p>
      {list.map((ind) => {
        const md = ind.movePct > 0 ? "up" : ind.movePct < 0 ? "down" : "flat";
        const mv = `${ind.movePct > 0 ? "+" : ind.movePct < 0 ? "−" : ""}${Math.abs(ind.movePct)}%`;
        const n = (ind.constituents || []).length;
        return (
          <button type="button" className="lp__indcard" key={ind.id} onClick={() => onPickIndustry(ind)}>
            <div className="lp__indcardtop">
              <span className="lp__indcardname">{ind.name}</span>
              <span className={`lp__indcardmove lp__indcardmove--${md}`}>{mv}</span>
            </div>
            <div className="lp__indcardmeta">
              <span className={`lp__indcardbias lp__indcardbias-${ind.bias}`}>{ind.bias}</span>
              <span className="lp__indcardnames">{n} {n === 1 ? "name" : "names"} · researched {ind.researchedAt}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function NewsPanel({ news }) {
  const list = news || [];
  return (
    <div className="lp__pad">
      <p className="lp__newsintro">The live wire — articles, reports and filings the scraper is matching against your coverage. <em>Used by agent</em> items went into active research; the rest are kept for context.</p>
      {list.map((n) => (
        <div className="lp__newsitem" key={n.id}>
          <div className="lp__newstags">
            <span className="lp__newskind">{n.kind}</span>
            <span className={`lp__newsrel lp__newsrel--${n.relevance}`}>{n.relevance === "used" ? "used by agent" : "scraper match"}</span>
            <span className="lp__newsat">{n.at}</span>
          </div>
          <a className="lp__newstopic" href={n.url} target="_blank" rel="noopener noreferrer">{n.topic}</a>
          {n.excerpt && <p className="lp__newsexcerpt">{n.excerpt}</p>}
          <a className="lp__newssrc" href={n.url} target="_blank" rel="noopener noreferrer"><window.Icon name="link" size={9} />{n.source}</a>
        </div>
      ))}
    </div>
  );
}

function ChatPanel({ draft, setDraft, spawn, depth, setDepth, turns, setTurns, askRef, suggestions }) {
  return (
    <div className="lp__chat">
      <div className="lp__chatscroll">
        <p className="lp__chatintro">Ask your research partner anything. It reconstructs what it already knows, searches primary sources, scores significance, and answers with citations — showing every step.</p>
        <div className="lp__suglabel">Pick up a thread</div>
        <div className="lp__sug">
          {suggestions.map((s, i) => (
            <button type="button" className="lp__sugbtn" key={i} onClick={() => { setDraft(s); askRef.current && askRef.current.focus(); }}>{s}</button>
          ))}
        </div>
      </div>
      <div className="lp__composer">
        <div className="lp__ctrls">
          <span className="lp__ctrllabel">depth</span>
          <div className="lp__seg">
            {["quick", "standard", "deep"].map((d) => (
              <button key={d} type="button" className={`lp__segbtn${depth === d ? " lp__segbtn--on" : ""}`} onClick={() => setDepth(d)}>{d}</button>
            ))}
          </div>
          <div className="lp__turns">
            <span className="lp__ctrllabel">turns</span>
            <button type="button" className="lp__step" onClick={() => setTurns((t) => Math.max(4, t - 2))}>−</button>
            <span className="lp__num">{turns}</span>
            <button type="button" className="lp__step" onClick={() => setTurns((t) => Math.min(32, t + 2))}>+</button>
          </div>
        </div>
        <div className="lp__field">
          <textarea ref={askRef} className="lp__textarea" rows={2} value={draft}
            placeholder="Ask anything — it shows its work as it goes…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); spawn(draft); } }} />
          <LPButton variant="primary" size="sm" onClick={() => spawn(draft)} disabled={!draft.trim()}>Research</LPButton>
        </div>
      </div>
    </div>
  );
}

function LeftPanel(props) {
  window.useStyle("kit-leftpanel", LP_CSS);
  const { tab } = props;
  const titles = { world: "World", watchlist: "Watchlist & industries", industries: "Industries", research: "Research", news: "News & events", chat: "Chat" };
  const counts = {
    world: "4 domains",
    watchlist: `${props.following.length} names`,
    industries: `${(props.industries || []).length} tracked`,
    research: `${props.sessions.length + 1} sessions`,
    news: `${(props.news || []).length} live`,
    chat: "",
  };
  return (
    <div className="lp">
      <div className="lp__head">
        <span className="lp__title">{titles[tab]}</span>
        {counts[tab] && <span className="lp__count">{counts[tab]}</span>}
      </div>
      {tab === "chat" ? (
        <ChatPanel draft={props.draft} setDraft={props.setDraft} spawn={props.spawn}
          depth={props.depth} setDepth={props.setDepth} turns={props.turns} setTurns={props.setTurns}
          askRef={props.askRef} suggestions={props.suggestions} />
      ) : (
        <div className="lp__scroll">
          {tab === "world" && <WorldNav />}
          {tab === "watchlist" && <WatchlistPanel following={props.following} industries={props.industries} onPick={props.onPick} onPickIndustry={props.onPickIndustry} />}
          {tab === "industries" && <IndustriesPanel industries={props.industries} onPickIndustry={props.onPickIndustry} />}
          {tab === "research" && <ResearchPanel active={props.active} sessions={props.sessions} onSelect={props.onSelect} />}
          {tab === "news" && <NewsPanel news={props.news} />}
        </div>
      )}
    </div>
  );
}

function CoverageRail(props) {
  window.useStyle("kit-leftpanel", LP_CSS);
  return (
    <div className="lp">
      <div className="lp__head">
        <span className="lp__title">Coverage</span>
        <span className="lp__count">{props.following.length} names · {props.sessions.length + 1} sessions</span>
      </div>
      <div className="lp__scroll">
        <div className="lp__covlabel">Watchlist & industries</div>
        <WatchlistPanel following={props.following} onPick={props.onPick} />
        <div className="lp__covdiv" />
        <div className="lp__covlabel">Research sessions</div>
        <ResearchPanel active={props.active} sessions={props.sessions} onSelect={props.onSelect} />
      </div>
    </div>
  );
}

Object.assign(window, { LeftPanel, CoverageRail });