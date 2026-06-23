import { FreshnessStamp } from "./FreshnessStamp";
import { HorizonTag } from "./HorizonTag";
import { horizonOf } from "../lib/freshness";
import type { ArticleOut } from "../api/types";

/** Articles are first-class content: URL up front, AI summary as orientation alongside. */
export function ArticleList({ articles }: { articles: ArticleOut[] }) {
  if (articles.length === 0) {
    return <p className="text-sm text-neutral-400">No articles yet.</p>;
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {articles.map((a) => (
        <li key={a.news_event_id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-neutral-900 hover:text-blue-700 hover:underline"
            >
              {a.headline}
            </a>
            <HorizonTag horizon={horizonOf(a.significance, a.published_at)} />
          </div>
          <p className="mt-1 text-sm leading-snug text-neutral-600">{a.summary}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            {a.source && <span>{a.source}</span>}
            <FreshnessStamp iso={a.published_at} label="published" thresholdHours={48} />
            {a.tickers.map((t) => (
              <span key={t} className="rounded bg-neutral-100 px-1 font-mono text-neutral-600">
                {t}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
