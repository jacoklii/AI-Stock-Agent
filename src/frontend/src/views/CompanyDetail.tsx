import type { ReactNode } from "react";

import { useCompanyDetail, useWatchlistAction } from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { Prose } from "../components/Prose";
import { CloseIcon } from "../components/Icons";
import { fmtBig, fmtPrice } from "../lib/format";
import type { FinancialOut, ProseOut } from "../api/types";

/** A picked name, in the left panel. Agent summary leads (synthesis + the reports behind it), then
 *  Qualitative (the business, its industry & position, the sentiment read) and Quantitative
 *  (financials & ratios). Reads & observations only — never a buy/sell/hold or valuation call, and
 *  no numeric scores are shown (PROJECT.md §8). */
export function CompanyDetail({
  companyId,
  onClose,
  onResearch,
}: {
  companyId: number;
  onClose: () => void;
  onResearch: (topic: string) => void;
}) {
  const detail = useCompanyDetail(companyId);
  const watchlist = useWatchlistAction(companyId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className="flex h-10 shrink-0 items-center gap-2 px-4"
        style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
      >
        <span className="terminal-label">Name detail</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-sm hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-muted)" }}
          title="Back to the list"
        >
          <CloseIcon size={14} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {detail.isLoading && <p className="terminal-label">Loading…</p>}
        {detail.isError && <p className="text-sm" style={{ color: "var(--red-500)" }}>Company not found.</p>}
        {detail.data &&
          (() => {
            const c = detail.data;
            const onWatchlist = c.coverage_tier === "watchlist";
            const byKind = (k: string) => c.prose.find((p) => p.kind === k);
            const lead = byKind("summary") ?? c.prose[0];
            const business = byKind("fundamental");
            const sentiment = byKind("sentimental");
            const otherProse = c.prose.filter((p) => p !== lead && p !== business && p !== sentiment);

            return (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>
                    <span className="font-data">{c.ticker}</span>{" "}
                    <span style={{ color: "var(--text-body)", fontWeight: 500 }}>· {c.name}</span>
                  </h2>
                  <p className="mt-0.5 font-data text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.sector ?? "—"} · {c.exchange ?? "—"} · {c.coverage_tier}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => watchlist.mutate(onWatchlist ? "demote" : "promote")}
                      disabled={watchlist.isPending}
                      className="rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40"
                      style={
                        onWatchlist
                          ? { background: "var(--signal-soft)", color: "var(--accent-hover)" }
                          : { border: "1px solid var(--border-strong)", color: "var(--text-body)" }
                      }
                    >
                      {onWatchlist ? "On watchlist ✓" : "Add to watchlist"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onResearch(`${c.ticker} (${c.name}) — `)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: "var(--link)" }}
                    >
                      research this name →
                    </button>
                  </div>
                </div>

                {/* Agent summary — leads. */}
                <Section title="Agent summary">
                  {lead ? (
                    <>
                      <ProseBlock p={lead} />
                      <div className="mt-3">
                        <p className="terminal-label mb-1">Reports behind it</p>
                        <ArticleList articles={c.articles} />
                      </div>
                    </>
                  ) : (
                    <Empty>No synthesis yet — the agent writes one as it covers this name.</Empty>
                  )}
                </Section>

                {/* Qualitative. */}
                <Section title="Qualitative">
                  <Field label="The business">
                    {business ? <ProseBlock p={business} /> : <Empty>Not written yet.</Empty>}
                  </Field>
                  <Field label="Industry & position">
                    <p className="text-sm" style={{ color: "var(--text-body)" }}>
                      {c.sector ?? "Sector not classified"}
                    </p>
                  </Field>
                  <Field label="Sentiment">
                    {sentiment ? (
                      <ProseBlock p={sentiment} />
                    ) : (
                      <Empty>No sentiment read yet — shown as a worded read, never a number.</Empty>
                    )}
                  </Field>
                  {otherProse.map((p) => (
                    <Field key={p.kind} label={`${p.kind} read`}>
                      <ProseBlock p={p} />
                    </Field>
                  ))}
                </Section>

                {/* Quantitative — stored statement facts. Figures are reported, never interpreted. */}
                <Section title="Quantitative">
                  {(c.financials ?? []).length > 0 ? (
                    <Financials rows={c.financials ?? []} />
                  ) : (
                    <Empty>
                      No financials stored yet — they refresh for watchlist names on the next
                      market-data run. The figures are reported as facts; no valuation call is made.
                    </Empty>
                  )}
                </Section>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-data text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-strong)", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>
        {title}
      </h3>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="terminal-label mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function ProseBlock({ p }: { p: ProseOut }) {
  return (
    <div>
      <Prose>{p.body}</Prose>
      <div className="mt-1">
        <FreshnessStamp iso={p.generated_at} label="written" />
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm" style={{ color: "var(--text-dim)" }}>{children}</p>;
}

/** Stored statement periods as a plain facts table — newest first, annual + quarterly together.
 *  A point-in-time line (price / market cap / P/E) leads when present; never a valuation call. */
function Financials({ rows }: { rows: FinancialOut[] }) {
  const snap = rows.find((r) => r.price != null || r.market_cap != null || r.pe != null);
  const cols: { label: string; pick: (r: FinancialOut) => string }[] = [
    { label: "Revenue", pick: (r) => fmtBig(r.revenue) },
    { label: "EBITDA", pick: (r) => fmtBig(r.ebitda) },
    { label: "Net income", pick: (r) => fmtBig(r.net_income) },
    { label: "EPS", pick: (r) => fmtPrice(r.eps) },
  ];
  return (
    <div>
      {snap && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-data text-xs" style={{ color: "var(--text-muted)" }}>
          {snap.price != null && <span>price <span style={{ color: "var(--text-strong)" }}>{fmtPrice(snap.price)}</span></span>}
          {snap.market_cap != null && <span>mkt cap <span style={{ color: "var(--text-strong)" }}>{fmtBig(snap.market_cap)}</span></span>}
          {snap.pe != null && <span>P/E <span style={{ color: "var(--text-strong)" }}>{fmtPrice(snap.pe)}</span></span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-data text-xs">
          <thead>
            <tr style={{ color: "var(--text-dim)" }}>
              <th className="py-1 pr-3 text-left font-medium">Period</th>
              {cols.map((col) => (
                <th key={col.label} className="py-1 pl-3 text-right font-medium">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.period_end}-${r.period_type}-${i}`} style={{ borderTop: "1px solid var(--border-default)" }}>
                <td className="py-1 pr-3 whitespace-nowrap" style={{ color: "var(--text-body)" }}>
                  {r.period_end}
                  <span className="ml-1" style={{ color: "var(--text-dim)" }}>{r.period_type === "quarterly" ? "Q" : "FY"}</span>
                </td>
                {cols.map((col) => (
                  <td key={col.label} className="tnum py-1 pl-3 text-right" style={{ color: "var(--text-strong)" }}>
                    {col.pick(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
