import { timeAgo } from "../lib/format";
import { isStale } from "../lib/freshness";

/** Freshness timestamp for AI artifacts — dim when fresh, emphasized (not colored) once stale, so a
 *  stale read stands out without borrowing the agent orange or an alarm red. `stalled` is the one
 *  hard signal: a live session whose heartbeat froze almost always means the run died, so it alone
 *  reads red (alert). */
export function FreshnessStamp({
  iso,
  label = "updated",
  thresholdHours = 24,
  stalled = false,
}: {
  iso: string | null | undefined;
  label?: string;
  thresholdHours?: number;
  stalled?: boolean;
}) {
  if (stalled) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
        style={{ background: "var(--red-bg)", color: "var(--red-500)", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--red-500) 28%, transparent)" }}
        title={iso ?? undefined}
      >
        stalled · no heartbeat for {timeAgo(iso)}
      </span>
    );
  }
  const stale = isStale(iso, thresholdHours);
  return (
    <span
      className={`text-xs tabular-nums ${stale ? "font-medium" : ""}`}
      style={{ color: stale ? "var(--text-muted)" : "var(--text-dim)" }}
      title={iso ?? undefined}
    >
      {label} {timeAgo(iso)}
      {stale ? " · stale" : ""}
    </span>
  );
}
