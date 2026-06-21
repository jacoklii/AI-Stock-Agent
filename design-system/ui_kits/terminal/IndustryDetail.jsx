// IndustryDetail — the deep industry research surface, opened in the right (agent) panel when you
// pick an industry. This is where the scraper + agent go deep: what the industry actually is
// (qualitative), the numbers (quantitative), the supply chain in tiers, the current news & events
// affecting it with sources, and each constituent name with sentiment + key fundamentals. Mirrors
// StockDetail's structure so the panel feels like one surface. Reads & observations only.
// Exports window.IndustryDetail.

const { Panel: IDPanel, Button: IDButton, SignificanceMeter: IDSig } = window.AIStockAgentDesignSystem_ea6e23;

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

function idDir(n) { return n == null ? "flat" : n > 0 ? "up" : n < 0 ? "down" : "flat"; }
function idPct(n) { return n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`; }
function idSentColor(v) { if (v >= 0.1) return "var(--up-500)"; if (v <= -0.1) return "var(--down-500)"; return "var(--ink-3)"; }
function idSentWord(v) {
  if (v >= 0.35) return "constructive"; if (v >= 0.1) return "leaning positive";
  if (v <= -0.35) return "bearish"; if (v <= -0.1) return "leaning negative"; return "mixed";
}

function IndustryDetail({ industry, onClose, onPickStock, onResearch, hasRecord }) {
  window.useStyle("asa-id-css", ID_CSS);
  if (!industry) return null;
  const ind = industry;
  const mdir = idDir(ind.movePct);
  const sc = ind.supplyChain || {};
  const prov = (t) => (t ? <span className="asa-id__prov">as of {t}</span> : null);

  return (
    <div className="asa-id">
      <div className="asa-id__head">
        <div className="asa-id__htop">
          <div className="asa-id__id">
            <div className="asa-id__eyebrow"><window.Icon name="building-2" size={11} />Industry research</div>
            <h2 className="asa-id__name">{ind.name}</h2>
            <div className="asa-id__sector">{ind.sector}</div>
          </div>
          {onClose && (
            <div className="asa-id__close" onClick={onClose} title="Close">
              <window.Icon name="x" size={15} />
            </div>
          )}
        </div>
        <div className="asa-id__meta">
          <span className={`asa-id__bias asa-id__bias-${ind.bias}`}>{ind.bias}</span>
          <span className={`asa-id__move asa-id__move--${mdir}`}>{idPct(ind.movePct)} today</span>
          <span className="asa-id__asof">researched {ind.researchedAt}</span>
        </div>
      </div>

      <div className="asa-id__body">
        {/* WHAT IT IS — qualitative */}
        <IDPanel title="What this industry is">
          <p className="asa-id__qual">{ind.overview}</p>
        </IDPanel>

        {/* WHAT'S HAPPENING NOW */}
        <IDPanel title="What's happening now" aside={prov(ind.asOf)}>
          <p className="asa-id__happening">{ind.whatsHappening}</p>
        </IDPanel>

        {/* THE NUMBERS — quantitative */}
        {ind.metrics && ind.metrics.length > 0 && (
          <IDPanel title="The numbers">
            <div className="asa-id__metrics">
              {ind.metrics.map((m) => (
                <div className="asa-id__metric" key={m.label}>
                  <div className="asa-id__mk">{m.label}</div>
                  <div className={`asa-id__mv ${m.dir === "up" ? "asa-id__mv--up" : m.dir === "down" ? "asa-id__mv--down" : ""}`}>
                    {m.value}{m.note && <span className="asa-id__mnote">{m.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </IDPanel>
        )}

        {/* DRIVERS */}
        {ind.drivers && ind.drivers.length > 0 && (
          <IDPanel title="What's driving it">
            <div className="asa-id__drivers">
              {ind.drivers.map((d) => (
                <div className="asa-id__driver" key={d.label}>
                  <span className={`asa-id__dtag asa-id__dtag-${d.dir}`}>{d.dir}</span>
                  <div className="asa-id__dmain">
                    <div className="asa-id__dlabel">{d.label}</div>
                    {d.note && <div className="asa-id__dnote">{d.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </IDPanel>
        )}

        {/* SUPPLY CHAIN */}
        {(sc.upstream || sc.core || sc.downstream) && (
          <IDPanel title="Supply chain">
            <div className="asa-id__chain">
              {sc.upstream && (
                <div className="asa-id__tier">
                  <div className="asa-id__tierlbl"><window.Icon name="arrow-up" size={11} />Upstream · inputs</div>
                  <div className="asa-id__chips">{sc.upstream.map((c) => <span className="asa-id__chip" key={c}>{c}</span>)}</div>
                </div>
              )}
              {sc.core && (
                <div className="asa-id__tier">
                  <div className="asa-id__tierlbl"><window.Icon name="circle-dot" size={11} />Core · the industry</div>
                  <div className="asa-id__chips">{sc.core.map((c) => <span className="asa-id__chip" key={c}>{c}</span>)}</div>
                </div>
              )}
              {sc.downstream && (
                <div className="asa-id__tier">
                  <div className="asa-id__tierlbl"><window.Icon name="arrow-down" size={11} />Downstream · demand</div>
                  <div className="asa-id__chips">{sc.downstream.map((c) => <span className="asa-id__chip" key={c}>{c}</span>)}</div>
                </div>
              )}
            </div>
          </IDPanel>
        )}

        {/* NEWS & EVENTS AFFECTING THE INDUSTRY */}
        {ind.news && ind.news.length > 0 && (
          <IDPanel title={`News & events · ${ind.news.length}`}>
            <div className="asa-id__news">
              {ind.news.map((n, i) => (
                <div className="asa-id__nitem" key={i}>
                  <div className="asa-id__ntags">
                    <span className="asa-id__nkind">{n.kind}</span>
                    <span className="asa-id__nat">{n.at}</span>
                  </div>
                  <a className="asa-id__ntopic" href={n.url} target="_blank" rel="noopener noreferrer">{n.topic}</a>
                  {n.excerpt && <p className="asa-id__nexcerpt">{n.excerpt}</p>}
                  <a className="asa-id__nsrc" href={n.url} target="_blank" rel="noopener noreferrer"><window.Icon name="link" size={9} />{n.source}</a>
                </div>
              ))}
            </div>
          </IDPanel>
        )}

        {/* CONSTITUENTS — sentiment + fundamentals, qual + quant */}
        {ind.constituents && ind.constituents.length > 0 && (
          <IDPanel title={`Names in this industry · ${ind.constituents.length}`}>
            <div className="asa-id__cons">
              {ind.constituents.map((c) => {
                const cd = idDir(c.changePct);
                const hasRec = hasRecord && hasRecord(c.ticker);
                const csc = idSentColor(c.sent ?? 0);
                return (
                  <div className={`asa-id__con ${hasRec ? "asa-id__con--click" : ""}`} key={c.ticker}
                    onClick={hasRec ? () => onPickStock && onPickStock(c.ticker) : undefined}>
                    <div className="asa-id__ctop">
                      <span className="asa-id__csym">{c.ticker}</span>
                      <span className="asa-id__cname">{c.name}</span>
                      <span className={`asa-id__cchg asa-id__cchg--${cd}`}>{idPct(c.changePct)}</span>
                      {hasRec && <span className="asa-id__cchev"><window.Icon name="chevron-right" size={14} /></span>}
                    </div>
                    {c.sent != null && (
                      <div className="asa-id__csent" style={{ "--_sc": csc }}>
                        <span className="asa-id__csentlbl">{idSentWord(c.sent)}</span>
                        <span className="asa-id__csentval">sentiment {c.sent > 0 ? "+" : ""}{c.sent.toFixed(2)}</span>
                      </div>
                    )}
                    {c.metrics && c.metrics.length > 0 && (
                      <div className="asa-id__cmetrics">
                        {c.metrics.map(([k, v]) => (
                          <div className="asa-id__cmetric" key={k}>
                            <div className="asa-id__cmk">{k}</div>
                            <div className="asa-id__cmv">{v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.note && <p className="asa-id__cnote">{c.note}</p>}
                  </div>
                );
              })}
            </div>
          </IDPanel>
        )}

        {/* AGENT READ */}
        {ind.agentRead && (
          <IDPanel title="The agent's read">
            <p className="asa-id__read">{ind.agentRead}</p>
          </IDPanel>
        )}

        {/* LAST RESEARCH RUN — transparency */}
        {ind.telemetry && (
          <IDPanel title="Last research run" aside={prov(ind.researchedAt)}>
            <window.Telemetry t={ind.telemetry} compact />
          </IDPanel>
        )}

        <div className="asa-id__actions">
          <IDButton variant="primary" size="sm" onClick={() => onResearch && onResearch(ind)}>Research this industry</IDButton>
          {onClose && <IDButton variant="ghost" size="sm" onClick={onClose}>Close</IDButton>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IndustryDetail });
