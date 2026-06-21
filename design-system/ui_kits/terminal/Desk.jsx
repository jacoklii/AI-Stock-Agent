// Desk — the single terminal. One view: a permanent World surveillance spine in the center,
// a Coverage rail (watchlist + sessions) on the left, and the Agent (live research + budget,
// or a drilled-in detail) on the right. A persistent ask bar lets you talk to the agent at any
// time. Settings is the ONLY separate view — reached from the topbar gear. No tab-switching.

const { Button, BudgetGauge, StockDetail, Panel } = window.AIStockAgentDesignSystem_ea6e23;
const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

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
  const openSide = (id) => {
    setPicked(null); setPickedIndustry(null);
    if (navPage === "settings") { setNavPage("terminal"); setSidePanel(id); return; }
    setSidePanel((cur) => (cur === id ? null : id));
  };
  const [chatDepth, setChatDepth] = useStateD("standard");
  const [chatTurns, setChatTurns] = useStateD(18);
  const [now, setNow] = useStateD(() => new Date());
  useEffectD(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const fmtDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const fmtClock = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
  };
  const loadTimer = useRefD(null);
  const askRef = useRefD(null);
  const watchlistTickers = new Set(following.map((f) => f.ticker));

  // Resolve a ticker to its full store record (watchlist names + agent-discovered candidates).
  const recordByTicker = {};
  following.forEach((f) => { recordByTicker[f.ticker] = f; });
  Object.values(D.CANDIDATES || {}).forEach((c) => { if (!recordByTicker[c.ticker]) recordByTicker[c.ticker] = c; });
  const hasRecord = (ticker) => !!recordByTicker[ticker];

  const pickStock = (stock) => {
    setSelectedId(null);
    setPickedIndustry(null);
    setPicked(stock);
    setLoadingStock(true);
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => setLoadingStock(false), 480);
  };
  const pickStockByTicker = (ticker) => { const r = recordByTicker[ticker]; if (r) pickStock(r); };
  const pickIndustry = (ind) => { setPicked(null); setSelectedId(null); setPickedIndustry(ind); };
  useEffectD(() => () => clearTimeout(loadTimer.current), []);
  const selectSession = (id) => { setPicked(null); setPickedIndustry(null); setSelectedId(id); setAgentOpen(true); };

  const researchStock = (stock) => {
    setNavPage("terminal");
    setSidePanel("chat");
    setDraft(`${stock.ticker} (${stock.name}) — `);
    setTimeout(() => {
      const el = askRef.current;
      if (el) { el.focus(); const v = el.value; try { el.setSelectionRange(v.length, v.length); } catch (e) {} }
    }, 30);
  };

  const researchIndustry = (ind) => {
    setNavPage("terminal");
    setSidePanel("chat");
    setDraft(`${ind.name} — `);
    setTimeout(() => {
      const el = askRef.current;
      if (el) { el.focus(); const v = el.value; try { el.setSelectionRange(v.length, v.length); } catch (e) {} }
    }, 30);
  };

  // Open research from a surveillance statement — drops the topic into the chat composer.
  const researchTopic = (topic) => {
    setNavPage("terminal");
    setSidePanel("chat");
    setDraft(`${topic} `);
    setTimeout(() => {
      const el = askRef.current;
      if (el) { el.focus(); const v = el.value; try { el.setSelectionRange(v.length, v.length); } catch (e) {} }
    }, 30);
  };

  const addToWatchlist = (ticker) => {
    setFollowing((prev) => prev.some((f) => f.ticker === ticker) ? prev : [...prev, { ...(D.CANDIDATES[ticker] || {}), addedBy: "you" }]);
  };

  const sessions = [...extra, ...D.SESSIONS];
  const allById = { [D.ACTIVE.id]: D.ACTIVE, ...Object.fromEntries(sessions.map((s) => [s.id, s])) };
  const selected = selectedId != null ? allById[selectedId] : null;

  const spawn = (topic) => {
    const t = (topic || "").trim();
    if (!t) return;
    const id = Date.now();
    const ns = {
      id, topic: t, origin: "user", status: "open", live: true,
      openedAt: "Jun 17 · now", activeAgo: "now",
      statusPhrases: D.ASK_PHRASES,
      telemetry: { turn: 1, maxTurns: chatTurns, tools: 1, sources: 0, inTok: "0.6k", outTok: "0.0k", elapsed: "0s" },
      trace: [
        { label: "Reconstructing what I already know", tool: "memory.read", reuse: "Watchlist", inTok: "0.6k", outTok: "0.0k", at: "now", status: "active" },
        { label: "Search for primary sources", status: "pending" },
        { label: "Read & cross-check", status: "pending" },
        { label: "Score significance & answer with citations", status: "pending" },
      ],
      summary: "",
      related: ["Set an alert on this", "Add the names to Following"],
    };
    setExtra((e) => [ns, ...e]);
    setPicked(null);
    setSelectedId(id);
    setDraft("");
  };

  return (
    <div className="desk">
      <div className="desk__topbar">
        <span className="desk__date">{fmtDate(now)}</span>
        <span className="desk__spacer" />
        <span className="desk__clock">{fmtClock(now)}</span>
      </div>

      <div className="desk__shell">
        <nav className="desk__nav">
          <button type="button" title="Research sessions"
            className={`desk__navbtn ${navPage === "terminal" && sidePanel === "research" ? "desk__navbtn--on" : ""}`}
            onClick={() => openSide("research")}>
            <window.Icon name="search" size={18} />
          </button>
          <button type="button" title="Watchlist & industries"
            className={`desk__navbtn ${navPage === "terminal" && sidePanel === "watchlist" ? "desk__navbtn--on" : ""}`}
            onClick={() => openSide("watchlist")}>
            <window.Icon name="layers" size={18} />
          </button>
          <button type="button" title="Chat"
            className={`desk__navbtn ${navPage === "terminal" && sidePanel === "chat" ? "desk__navbtn--on" : ""}`}
            onClick={() => openSide("chat")}>
            <window.Icon name="message-square" size={18} />
          </button>
          <button type="button" title="News & events"
            className={`desk__navbtn ${navPage === "terminal" && sidePanel === "news" ? "desk__navbtn--on" : ""}`}
            onClick={() => openSide("news")}>
            <window.Icon name="newspaper" size={18} />
          </button>
          <span className="desk__navspacer" />
          <button type="button" title="Settings"
            className={`desk__navbtn ${navPage === "settings" ? "desk__navbtn--on" : ""}`}
            onClick={() => setNavPage((p) => (p === "settings" ? "terminal" : "settings"))}>
            <window.Icon name="settings" size={18} />
          </button>
        </nav>

        {navPage === "settings" ? (
          <window.Settings following={following} setFollowing={setFollowing} />
        ) : (
          <React.Fragment>
            {picked ? (
              <div className="desk__leftdetail">
                <StockDetail stock={picked} loading={loadingStock}
                  onClose={() => setPicked(null)} onResearch={researchStock}
                  onSetAlert={() => {}} onRemove={() => setPicked(null)} onOpenSource={() => {}} />
              </div>
            ) : pickedIndustry ? (
              <div className="desk__leftdetail">
                <window.IndustryDetail industry={pickedIndustry} onClose={() => setPickedIndustry(null)}
                  onPickStock={pickStockByTicker} onResearch={researchIndustry} hasRecord={hasRecord} />
              </div>
            ) : sidePanel ? (
              <window.LeftPanel tab={sidePanel} following={following} sessions={sessions} active={D.ACTIVE}
                industries={D.INDUSTRIES} news={D.NEWS}
                onPick={pickStock} onSelect={selectSession} onPickIndustry={pickIndustry}
                draft={draft} setDraft={setDraft} spawn={spawn}
                depth={chatDepth} setDepth={setChatDepth} turns={chatTurns} setTurns={setChatTurns}
                askRef={askRef}
                suggestions={[...new Set(sessions.flatMap((s) => s.related || []))].slice(0, 4)} />
            ) : null}

            <div className="desk__center">
              <div className="desk__world">
                <window.WorldBoard data={D.WORLD} news={D.NEWS} industries={D.INDUSTRIES} following={following}
                  onOpenIndustry={pickIndustry} onPickStock={pickStock} onResearch={researchTopic} />
              </div>
            </div>

            {agentOpen ? (
              <aside className="desk__agent">
                <div className="desk__agenthead">
                  <span className="desk__agenttitle">Agent</span>
                  <span className="desk__agentsub">{selected ? "research" : "live state"}</span>
                  <button type="button" className="desk__agentcollapse" title="Collapse" onClick={() => setAgentOpen(false)}>
                    <window.Icon name="chevrons-right" size={15} />
                  </button>
                </div>
                {selected ? (
                  <div className="desk__agentscroll">
                    <window.DetailPanel session={selected} onClose={() => setSelectedId(null)} onSpawn={spawn}
                      onAddToWatchlist={addToWatchlist} watchlistTickers={watchlistTickers} />
                  </div>
                ) : (
                  <div className="desk__agentstack">
                    <window.LiveResearch session={D.ACTIVE} onOpen={selectSession} />
                    <Panel title="Weekly token budget">
                      <BudgetGauge spent={D.BUDGET.spent} cap={D.BUDGET.cap} />
                      <div className="desk__budgetnote">the agent paces itself against this — it stops deep work as it approaches the cap.</div>
                    </Panel>
                  </div>
                )}
              </aside>
            ) : (
              <button type="button" className="desk__agentstrip" title="Show agent" onClick={() => setAgentOpen(true)}>
                <window.Icon name="chevrons-left" size={15} />
                <span className="desk__agentstriplabel">Agent</span>
              </button>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { Desk });
