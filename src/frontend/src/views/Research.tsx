import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useOpenResearch, useResearchList } from "../api/queries";
import { EmptyState, Loading } from "../components/EmptyState";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { fmtDateTime } from "../lib/format";
import { OriginBadge } from "../components/OriginBadge";
import { SnapshotCard } from "../components/SnapshotCard";
import { StatusPill } from "../components/StatusPill";
import type { ResearchSessionOut } from "../api/types";

function SessionRow({ session }: { session: ResearchSessionOut }) {
  return (
    <Link
      to={`/research/${session.state_id}`}
      className="block rounded-md border border-neutral-100 p-3 hover:border-neutral-300"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-neutral-900">{session.topic}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <OriginBadge initiatedBy={session.initiated_by} />
          <StatusPill status={session.status} />
        </div>
      </div>
      {session.current_task && (
        <p className="mt-1 truncate text-xs text-neutral-500">→ {session.current_task}</p>
      )}
      {session.findings && (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{session.findings}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* When the research actually took place — absolute date + time of day. A closed session
            shows its span (opened → closed); an open one shows when it started. */}
        <span className="text-xs tabular-nums text-neutral-500" title={session.opened_at}>
          {fmtDateTime(session.opened_at)}
          {session.status === "closed" && session.closed_at
            ? ` → ${fmtDateTime(session.closed_at)}`
            : ""}
        </span>
        <FreshnessStamp
          iso={session.status === "closed" ? session.closed_at : session.last_active_at}
          label={session.status === "closed" ? "closed" : "active"}
          thresholdHours={session.status === "closed" ? 168 : 24}
        />
      </div>
    </Link>
  );
}

/** Sessions list + the entry point for user-directed deep work. */
export function Research() {
  const open = useResearchList("open");
  const closed = useResearchList("closed", 30);
  const openResearch = useOpenResearch();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");

  const start = () => {
    const t = topic.trim();
    if (!t || openResearch.isPending) return;
    openResearch.mutate(
      { topic: t },
      { onSuccess: (res) => navigate(`/research/${res.state_id}`) },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Research</h1>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Open a research session — e.g. 'TSMC advanced-node capacity vs. 2026 demand'"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={openResearch.isPending || !topic.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {openResearch.isPending ? "Opening…" : "Research"}
        </button>
      </form>
      {openResearch.isError && (
        <p className="text-xs text-red-600">
          {openResearch.error instanceof Error ? openResearch.error.message : "failed to open"}
        </p>
      )}

      <SnapshotCard title={`Open (${open.data?.length ?? 0} / 3)`}>
        {open.isLoading ? (
          <Loading />
        ) : (open.data ?? []).length > 0 ? (
          <div className="space-y-2">
            {(open.data ?? []).map((s) => (
              <SessionRow key={s.state_id} session={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">
            Nothing open. The agent opens its own sessions when breadth surfaces something
            material, or start one above.
          </p>
        )}
      </SnapshotCard>

      <SnapshotCard title="Closed">
        {closed.isLoading ? (
          <Loading />
        ) : (closed.data ?? []).length > 0 ? (
          <div className="space-y-2">
            {(closed.data ?? []).map((s) => (
              <SessionRow key={s.state_id} session={s} />
            ))}
          </div>
        ) : (
          <EmptyState message="No closed sessions yet." />
        )}
      </SnapshotCard>
    </div>
  );
}
