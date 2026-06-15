import { OriginBadge } from "./OriginBadge";
import { StatusPill } from "./StatusPill";
import { fmtDateTime, fmtTokens, timeAgo } from "../lib/format";
import type { TaskOut } from "../api/types";

/** The tasks ledger — what the agent is doing / just did, with its cost. */
export function TaskList({ tasks, empty = "Nothing here." }: { tasks: TaskOut[]; empty?: string }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-400">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {tasks.map((t) => {
        // Finished tasks show when the agent *finished* (absolute date + time of day); a
        // still-running one shows how long ago it started. Hover gives the exact UTC timestamp.
        const when = t.completed_at
          ? `finished ${fmtDateTime(t.completed_at)}`
          : `started ${timeAgo(t.started_at)}`;
        return (
        <li key={t.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-sm text-neutral-800">{t.type}</span>
              <OriginBadge initiatedBy={t.initiated_by} />
              <StatusPill status={t.status} />
            </div>
            <div
              className="mt-0.5 line-clamp-2 break-words text-xs text-neutral-400"
              title={t.error_message ?? t.completed_at ?? t.started_at ?? undefined}
            >
              {when}
              {t.message ? ` · ${t.message}` : ""}
              {t.error_message ? ` · ${t.error_message}` : ""}
            </div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-neutral-500">
            {t.tokens_used != null ? `${fmtTokens(t.tokens_used)} tok` : ""}
          </span>
        </li>
        );
      })}
    </ul>
  );
}
