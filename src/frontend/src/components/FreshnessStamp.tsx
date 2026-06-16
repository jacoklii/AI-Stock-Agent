import { timeAgo } from "../lib/format";
import { isStale } from "../lib/freshness";

/** Freshness timestamp for AI artifacts — muted when fresh, amber past the threshold.
 *  `stalled` is a stronger signal than `stale`: a live session whose heartbeat has frozen, which
 *  almost always means the run died. It reads as red rather than amber. */
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
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium tabular-nums text-red-700 ring-1 ring-inset ring-red-200"
        title={iso ?? undefined}
      >
        stalled · no heartbeat for {timeAgo(iso)}
      </span>
    );
  }
  const stale = isStale(iso, thresholdHours);
  return (
    <span
      className={`text-xs tabular-nums ${stale ? "text-amber-600 font-medium" : "text-neutral-400"}`}
      title={iso ?? undefined}
    >
      {label} {timeAgo(iso)}
      {stale ? " · stale" : ""}
    </span>
  );
}
