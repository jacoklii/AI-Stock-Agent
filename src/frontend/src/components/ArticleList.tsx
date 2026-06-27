import { ArticleRow } from "./ArticleRow";
import type { ArticleOut } from "../api/types";

/** Articles are first-class content: each row leads with the URL, the API summary as orientation
 *  alongside (see ArticleRow). Used in the company/industry detail panels and the agent's sources. */
export function ArticleList({ articles }: { articles: ArticleOut[] }) {
  if (articles.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-dim)" }}>No articles yet.</p>;
  }
  return (
    <div>
      {articles.map((a) => (
        <ArticleRow key={a.news_event_id} article={a} />
      ))}
    </div>
  );
}
