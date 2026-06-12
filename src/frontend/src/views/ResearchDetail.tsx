import { useState } from "react";
import { useParams } from "react-router-dom";

import {
  useCloseResearch,
  useRedirectResearch,
  useResearchDetail,
} from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { SnapshotCard } from "../components/SnapshotCard";
import { SourceChips } from "../components/SourceChips";
import { StatusPill } from "../components/StatusPill";
import { TaskList } from "../components/TaskList";

/** One session: live findings, its task trail, sources, and the user's direction levers. */
export function ResearchDetail() {
  const { stateId } = useParams();
  const id = Number(stateId);
  const detail = useResearchDetail(id);
  const close = useCloseResearch(id);
  const redirect = useRedirectResearch(id);
  const [promote, setPromote] = useState(true);
  const [redirectTopic, setRedirectTopic] = useState("");

  if (detail.isLoading) return <p className="text-sm text-neutral-400">Loading…</p>;
  if (detail.isError || !detail.data)
    return <p className="text-sm text-red-600">Session not found.</p>;
  const s = detail.data;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{s.topic}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusPill status={s.status} />
            <FreshnessStamp
              iso={s.status === "closed" ? s.closed_at : s.last_active_at}
              label={s.status === "closed" ? "closed" : "active"}
            />
          </div>
        </div>
        {(s.status === "open" || !close.data?.promoted) && (
          <div className="flex shrink-0 items-center gap-2">
            {s.status === "open" && (
              <label className="flex items-center gap-1 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  checked={promote}
                  onChange={(e) => setPromote(e.target.checked)}
                />
                promote findings
              </label>
            )}
            <button
              type="button"
              onClick={() => close.mutate(promote)}
              disabled={close.isPending || close.data !== undefined}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:opacity-40"
            >
              {s.status === "open"
                ? close.data
                  ? "Closed"
                  : "Close session"
                : close.data?.promoted
                  ? "Promoted"
                  : "Promote findings"}
            </button>
          </div>
        )}
      </div>

      {s.current_task && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Currently: {s.current_task}
        </p>
      )}

      <SnapshotCard title="Findings">
        {s.findings ? (
          <p className="prose-snapshot text-sm leading-relaxed text-neutral-800">{s.findings}</p>
        ) : (
          <p className="text-sm text-neutral-400">
            Nothing flushed yet — findings appear as the agent finishes tasks.
          </p>
        )}
      </SnapshotCard>

      {s.open_questions && (
        <SnapshotCard title="Open questions">
          <p className="prose-snapshot text-sm leading-relaxed text-neutral-700">
            {s.open_questions}
          </p>
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
    </div>
  );
}
