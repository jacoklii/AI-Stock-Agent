import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCompanyDetail, useSendChat, useWatchlistAction } from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { Prose } from "../components/Prose";
import { SnapshotCard } from "../components/SnapshotCard";

/** One company: tier, scores with freshness, prose reads, article stream, ask-the-agent. */
export function CompanyDetail() {
  const { companyId } = useParams();
  const id = Number(companyId);
  const detail = useCompanyDetail(id);
  const watchlist = useWatchlistAction(id);
  const sendChat = useSendChat();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");

  if (detail.isLoading) return <p className="text-sm text-neutral-400">Loading…</p>;
  if (detail.isError || !detail.data)
    return <p className="text-sm text-red-600">Company not found.</p>;
  const c = detail.data;
  const onWatchlist = c.coverage_tier === "watchlist";

  const ask = () => {
    const q = question.trim();
    if (!q || sendChat.isPending) return;
    // Fire and go: the mutation outlives this view (cache-level invalidation in App.tsx),
    // and Chat renders it as a pending bubble while the researcher answers.
    sendChat.mutate({ content: `[${c.ticker}] ${q}`, company_id: id });
    navigate("/chat");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="font-mono">{c.ticker}</span> · {c.name}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            {c.sector ?? "—"} · {c.exchange ?? "—"} · tier: {c.coverage_tier}
          </p>
        </div>
        <button
          type="button"
          onClick={() => watchlist.mutate(onWatchlist ? "demote" : "promote")}
          disabled={watchlist.isPending}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
            onWatchlist
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
              : "border border-neutral-300 hover:bg-neutral-100"
          }`}
        >
          {onWatchlist ? "On watchlist ✓ (demote)" : "Add to watchlist"}
        </button>
      </div>

      {c.scores.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {c.scores.map((s) => (
            <SnapshotCard
              key={s.kind}
              title={`${s.kind} score`}
              aside={<FreshnessStamp iso={s.generated_at} label="scored" />}
            >
              <span className="text-2xl font-bold tabular-nums">{s.score.toFixed(1)}</span>
              {s.data_through && (
                <p className="mt-1 text-xs text-neutral-400">
                  data through {new Date(s.data_through).toLocaleDateString("en-US")}
                </p>
              )}
            </SnapshotCard>
          ))}
        </div>
      )}

      {c.prose.map((p) => (
        <SnapshotCard
          key={p.kind}
          title={`${p.kind} read`}
          aside={<FreshnessStamp iso={p.generated_at} label="written" />}
        >
          <Prose>{p.body}</Prose>
        </SnapshotCard>
      ))}

      <SnapshotCard title="Ask about this company">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`e.g. "what changed for ${c.ticker} this week?"`}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sendChat.isPending || !question.trim()}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {sendChat.isPending ? "Asking…" : "Ask"}
          </button>
        </form>
        <p className="mt-2 text-xs text-neutral-400">Opens in Chat with the answer.</p>
      </SnapshotCard>

      <SnapshotCard title="Articles">
        <ArticleList articles={c.articles} />
      </SnapshotCard>
    </div>
  );
}
