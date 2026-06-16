import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  useCloseResearch,
  useRedirectResearch,
  useResearchDetail,
  useResearchRelated,
} from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { OriginBadge } from "../components/OriginBadge";
import { Prose } from "../components/Prose";
import { SnapshotCard } from "../components/SnapshotCard";
import { SourceChips } from "../components/SourceChips";
import { StatusPill } from "../components/StatusPill";
import { TaskList } from "../components/TaskList";
import { WorkingStrip } from "../components/WorkingStrip";
import { isStalled } from "../lib/freshness";

/** One session: live findings, its task trail, sources, and the user's direction levers. */
export function ResearchDetail() {
  const { stateId } = useParams();
  const id = Number(stateId);
  const detail = useResearchDetail(id);
  const related = useResearchRelated(id);
  const close = useCloseResearch(id);
  const redirect = useRedirectResearch(id);
  const [promote, setPromote] = useState(true);
  const [redirectTopic, setRedirectTopic] = useState("");

  if (detail.isLoading) return <p className="text-sm text-neutral-400">Loading…</p>;
  if (detail.isError || !detail.data)
    return <p className="text-sm text-red-600">Session not found.</p>;
  const s = detail.data;
  const stalled = s.status === "open" && isStalled(s.last_active_at);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{s.topic}</h1>
          <div className="mt-1 flex items-center gap-2">
            <OriginBadge initiatedBy={s.initiated_by} />
            <StatusPill status={s.status} />
            <FreshnessStamp
              iso={s.status === "closed" ? s.closed_at : s.last_active_at}
              label={s.status === "closed" ? "closed" : "active"}
              stalled={stalled}
            />
          </div>
        </div>
        {s.status === "open" ? (
          <div className="flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-neutral-500">
              <input
                type="checkbox"
                checked={promote}
                onChange={(e) => setPromote(e.target.checked)}
              />
              promote findings
            </label>
            <button
              type="button"
              onClick={() => close.mutate(promote)}
              disabled={close.isPending}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:opacity-40"
            >
              {close.isPending ? "Closing…" : "Close session"}
            </button>
          </div>
        ) : (
          // Closed sessions can still answer the promotion question (promote-only close).
          (s.findings || s.open_questions) && (
            <button
              type="button"
              onClick={() => close.mutate(true)}
              disabled={close.isPending || close.data?.promoted === true}
              className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:opacity-40"
            >
              {close.data?.promoted
                ? "Promoted ✓"
                : close.isPending
                  ? "Promoting…"
                  : "Promote findings"}
            </button>
          )
        )}
      </div>

      {close.isError && (
        <p className="text-xs text-red-600">
          {close.error instanceof Error ? close.error.message : "close failed"}
        </p>
      )}

      {(s.current_task || s.progress) && (
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {s.current_task && <p>Currently: {s.current_task}</p>}
          {s.progress && (
            <WorkingStrip
              progress={s.progress}
              className={`text-xs font-medium text-blue-700 ${s.current_task ? "mt-1" : ""}`}
            />
          )}
        </div>
      )}

      <SnapshotCard title="Findings">
        {s.findings ? (
          <Prose>{s.findings}</Prose>
        ) : (
          <p className="text-sm text-neutral-400">
            Nothing flushed yet — findings appear as the agent finishes tasks.
          </p>
        )}
      </SnapshotCard>

      {s.open_questions && (
        <SnapshotCard title="Open questions">
          <Prose>{s.open_questions}</Prose>
        </SnapshotCard>
      )}

      {s.status === "open" && (
        <SnapshotCard title="Redirect">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = redirectTopic.trim();
              if (!t) return;
              redirect.mutate({ topic: t });
              setRedirectTopic("");
            }}
          >
            <input
              value={redirectTopic}
              onChange={(e) => setRedirectTopic(e.target.value)}
              placeholder="Steer this session toward…"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={redirect.isPending || !redirectTopic.trim()}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:opacity-40"
            >
              Redirect
            </button>
          </form>
          {redirect.isError && (
            <p className="mt-2 text-xs text-red-600">
              {redirect.error instanceof Error ? redirect.error.message : "redirect failed"}
            </p>
          )}
          {redirect.isSuccess && (
            <p className="mt-2 text-xs text-emerald-600">Redirected — topic updated.</p>
          )}
          <p className="mt-2 text-xs text-neutral-400">
            Takes effect when the session next resumes — the agent reconstructs its context from
            this state row.
          </p>
        </SnapshotCard>
      )}

      <SnapshotCard title="Source articles">
        <ArticleList articles={s.source_articles ?? []} />
        <SourceChips urls={s.source_urls ?? []} />
      </SnapshotCard>

      <SnapshotCard title="Task trail">
        <TaskList tasks={s.tasks ?? []} empty="No tasks recorded for this session yet." />
      </SnapshotCard>

      {related.data && related.data.length > 0 && (
        <SnapshotCard title="Related sessions">
          <p className="mb-2 text-xs text-neutral-400">
            Past research closest to this one — surfaced by similarity over the session embeddings.
          </p>
          <ul className="divide-y divide-neutral-100">
            {related.data.map((r) => (
              <li key={r.state_id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={`/research/${r.state_id}`}
                    className="text-sm font-medium text-neutral-900 hover:text-blue-700 hover:underline"
                  >
                    {r.topic}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-neutral-400">
                    {Math.round(r.similarity * 100)}% match
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <FreshnessStamp iso={r.last_active_at} label="active" />
                </div>
              </li>
            ))}
          </ul>
        </SnapshotCard>
      )}
    </div>
  );
}
