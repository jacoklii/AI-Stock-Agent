import { HorizonTag } from "./HorizonTag";
import { ExternalIcon } from "./Icons";
import { fmtDateTime } from "../lib/format";
import { horizonOf } from "../lib/freshness";
import type { ArticleOut } from "../api/types";

/** Short display labels for the surveillance domain tag. */
const DOMAIN_LABEL: Record<string, string> = {
  geopolitics: "Geopolitics",
  macro: "Macro",
  industry: "Industry",
  market: "Market",
};

/** One news event, rendered the same way everywhere (left stream, detail panels, agent sources):
 *  headline as a first-class link to the source, the API-grabbed summary as orientation alongside,
 *  and a meta line — source · time · domain · 📍country · tickers. Significance shows only as a
 *  time horizon, never a number (PROJECT.md §8). `showDomain` is off inside a domain-grouped list,
 *  where the section header already says the domain. */
export function ArticleRow({ article, showDomain = true }: { article: ArticleOut; showDomain?: boolean }) {
  const a = article;
  return (
    <div className="py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
      <div className="flex items-start justify-between gap-3">
        <a
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--text-strong)" }}
        >
          {a.headline}
        </a>
        <span className="mt-0.5 shrink-0">
          <HorizonTag horizon={horizonOf(a.significance, a.published_at)} />
        </span>
      </div>

      {a.summary && (
        <p className="mt-1 line-clamp-2 text-sm leading-snug" style={{ color: "var(--text-body)" }}>
          {a.summary}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
        {a.source && <span>{a.source}</span>}
        <span className="tnum">{fmtDateTime(a.published_at)}</span>
        {showDomain && a.domain && (
          <span className="font-data uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
            {DOMAIN_LABEL[a.domain] ?? a.domain}
          </span>
        )}
        {a.source_country && <span className="font-data">📍 {a.source_country}</span>}
        {a.tickers.map((t) => (
          <span key={t} className="font-data" style={{ color: "var(--text-muted)" }}>
            {t}
          </span>
        ))}
        <a
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
          style={{ color: "var(--link)" }}
        >
          source <ExternalIcon size={12} />
        </a>
      </div>
    </div>
  );
}
