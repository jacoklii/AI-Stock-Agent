import React from "react";
import { Panel } from "../surfaces/Panel.jsx";
import { Button } from "../buttons/Button.jsx";
import { Sparkline } from "./Sparkline.jsx";
import { Badge, TierBadge } from "../status/Badge.jsx";

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
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function Sk({ w = "100%", h = 11 }) {
  return <span className="asa-sd__sk" style={{ width: w, height: h, display: "block" }} />;
}

/**
 * StockDetail — the watchlist drill-down. Click a Following name and this fills the panel. The
 * agent's summary leads (its synthesis, the reports behind it, and what it remembers about the
 * name), then the record splits into two clear halves: QUALITATIVE — what the business is, where
 * it sits in its industry, and the sentiment read — and QUANTITATIVE — financials, metrics and
 * ratios. Sections carry "as of …" freshness stamps (the record is pulled from the store) and a
 * calm skeleton while loading. Reads & observations only — never a buy/sell/hold or valuation call.
 */
export function StockDetail({
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
  const prov = (t) => (showProvenance && t ? <span className="asa-sd__prov">as of {t}</span> : null);

  return (
    <div className={`asa-sd ${density === "compact" ? "asa-sd--compact" : ""} ${className}`} {...rest}>
      <div className="asa-sd__head">
        <div className="asa-sd__htop">
          <div className="asa-sd__id">
            <div className="asa-sd__eyebrow">
              <span className="asa-sd__sym">{s.ticker}</span>
              {s.tier && <TierBadge tier={s.tier} />}
            </div>
            {s.name && <div className="asa-sd__name">{s.name}{s.exchange ? ` · ${s.exchange}` : ""}</div>}
          </div>
          {onClose && (
            <div className="asa-sd__close" onClick={onClose} title="Close">
              {window.Icon ? <window.Icon name="x" size={15} /> : "✕"}
            </div>
          )}
        </div>

        <div className="asa-sd__quote">
          <span className="asa-sd__price">{fmtPrice(s.price)}</span>
          <span className={`asa-sd__chg asa-sd__chg--${qdir}`}>
            <span aria-hidden style={{ fontSize: ".85em" }}>{arrow}</span>{fmtPct(s.changePct)}
          </span>
          {s.series && s.series.length > 1 && (
            <span className="asa-sd__spark"><Sparkline data={s.series} width={104} height={30} draw={false} liveDot={false} /></span>
          )}
        </div>
        {s.quoteAt && <div className="asa-sd__asof"><span className="dot" />live quote · {s.quoteAt}</div>}
      </div>

      <div className="asa-sd__body">
        {/* AGENT SUMMARY — baked in, leads the panel */}
        <Panel title="Agent summary" aside={prov(s.summaryAsOf)} live>
          {loading ? (
            <div className="asa-sd__skstack"><Sk /><Sk w="90%" /><Sk w="70%" /></div>
          ) : (
            <div>
              {s.summary && <p className="asa-sd__summary">{s.summary}</p>}
              {s.findings && s.findings.length > 0 && (
                <div className="asa-sd__feed" style={{ marginTop: s.summary ? 13 : 0 }}>
                  {s.findings.map((f, i) => (
                    <div className="asa-sd__fitem" key={i} onClick={() => onOpenSource && onOpenSource(f)}>
                      <div className="asa-sd__fmain">
                        <div className="asa-sd__ftitle">{f.title}</div>
                        <div className="asa-sd__fmeta"><span className="dom">{f.domain}</span></div>
                      </div>
                      <span className="asa-sd__fat">{f.at}</span>
                    </div>
                  ))}
                </div>
              )}
              {s.memory && (
                <p className="asa-sd__remembers"><b>Remembers</b>{s.memory}</p>
              )}
            </div>
          )}
        </Panel>

        {/* ===== QUALITATIVE — the business, its industry, the sentiment ===== */}
        <div className="asa-sd__group">Qualitative<span className="asa-sd__groupsub">the business, its industry, the sentiment</span></div>

        {(loading || s.business) && (
          <Panel title="The business" aside={prov(s.businessAsOf)}>
            {loading ? <div className="asa-sd__skstack"><Sk /><Sk w="80%" /></div> : <p className="asa-sd__business">{s.business}</p>}
          </Panel>
        )}

        {(loading || s.industry) && (
          <Panel title="Industry & position" aside={prov(s.industry && s.industry.asOf)}>
            {loading ? (
              <div className="asa-sd__skstack"><Sk w="60%" /><Sk w="45%" /><Sk /></div>
            ) : (
              <div>
                <div className="asa-sd__where">
                  {s.industry.sector && <div className="asa-sd__wrow"><span className="asa-sd__wk">sector</span><span className="asa-sd__wv">{s.industry.sector}</span></div>}
                  {s.industry.subIndustry && <div className="asa-sd__wrow"><span className="asa-sd__wk">sub-ind.</span><span className="asa-sd__wv">{s.industry.subIndustry}</span></div>}
                  {s.industry.position && <div className="asa-sd__wrow"><span className="asa-sd__wk">position</span><span className="asa-sd__wv">{s.industry.position}</span></div>}
                </div>
                {s.industry.peers && s.industry.peers.length > 0 && (
                  <>
                    <div className="asa-sd__subhead">Peers</div>
                    <div className="asa-sd__peers">
                      {s.industry.peers.map((p) => {
                        const pd = dirOf(p.changePct);
                        return (
                          <div className="asa-sd__peer" key={p.ticker}>
                            <span className="asa-sd__psym">{p.ticker}</span>
                            <span className="asa-sd__pname">{p.name}</span>
                            <span className={`asa-sd__pchg asa-sd__chg--${pd}`}>{fmtPct(p.changePct)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {s.industry.supplyChain && s.industry.supplyChain.length > 0 && (
                  <>
                    <div className="asa-sd__subhead">Supply-chain neighbors</div>
                    <div className="asa-sd__chain">
                      {s.industry.supplyChain.map((c) => <span className="asa-sd__cchip" key={c}>{c}</span>)}
                    </div>
                  </>
                )}
              </div>
            )}
          </Panel>
        )}

        <Panel title="Sentiment" aside={prov(sent.asOf)}>
          {loading ? (
            <div className="asa-sd__skstack"><Sk w="40%" h={16} /><Sk /><Sk w="70%" /></div>
          ) : (
            <div style={{ "--_sc": sc }}>
              <div className="asa-sd__senthead">
                <span className="asa-sd__sentlabel">{sentWord(sent.value ?? 0)}</span>
                {sent.sources != null && <span className="asa-sd__prov">{sent.sources} sources</span>}
              </div>
              {sent.read && <p className="asa-sd__sentread">{sent.read}</p>}
              {sent.trend && sent.trend.length > 1 && (
                <div className="asa-sd__senttrend">
                  <span className="lbl">tone, last 30 days</span>
                  <Sparkline data={sent.trend} width={120} height={24} color={sc} area draw={false} liveDot={false} />
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* ===== QUANTITATIVE — financials, metrics, ratios ===== */}
        <div className="asa-sd__group">Quantitative<span className="asa-sd__groupsub">financials, metrics, ratios</span></div>

        {(loading || (s.financials && s.financials.length > 0)) && (
          <Panel title="Financials" aside={prov(s.financialsAsOf)}>
            {loading ? (
              <div className="asa-sd__skstack">{[0, 1, 2, 3].map((i) => <Sk key={i} />)}</div>
            ) : (
              <div className="asa-sd__fin">
                {s.financials.map((r) => {
                  const d = r.dir || "";
                  return (
                    <div className="asa-sd__finrow" key={r.label}>
                      <span className="asa-sd__fink">{r.label}</span>
                      <span className={`asa-sd__finv ${d === "up" ? "asa-sd__finv--up" : d === "down" ? "asa-sd__finv--down" : ""}`}>
                        {r.value}{r.note && <span className="asa-sd__finnote">{r.note}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {(loading || (s.ratios && s.ratios.length > 0)) && (
          <Panel title="Valuation & ratios" aside={prov(s.ratiosAsOf)}>
            {loading ? (
              <div className="asa-sd__skstack">{[0, 1, 2].map((i) => <Sk key={i} />)}</div>
            ) : (
              <div className="asa-sd__fin">
                {s.ratios.map((r) => {
                  const d = r.dir || "";
                  return (
                    <div className="asa-sd__finrow" key={r.label}>
                      <span className="asa-sd__fink">{r.label}</span>
                      <span className={`asa-sd__finv ${d === "up" ? "asa-sd__finv--up" : d === "down" ? "asa-sd__finv--down" : ""}`}>
                        {r.value}{r.note && <span className="asa-sd__finnote">{r.note}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {/* ACTIONS */}
        {!loading && (
          <div className="asa-sd__actions">
            <Button variant="primary" size="sm" onClick={() => onResearch && onResearch(s)}>Research this name</Button>
            <Button variant="secondary" size="sm" onClick={() => onSetAlert && onSetAlert(s)}>
              {s.alert ? `Alert · ${s.alert}` : "Set alert"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRemove && onRemove(s)}>Remove</Button>
          </div>
        )}
      </div>
    </div>
  );
}
