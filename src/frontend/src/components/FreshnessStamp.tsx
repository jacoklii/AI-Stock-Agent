import { timeAgo } from "../lib/format";
import { isStale } from "../lib/freshness";

/** Freshness timestamp for AI artifacts — muted when fresh, amber past the threshold. */
export function FreshnessStamp({
  iso,
  label = "updated",
  thresholdHours = 24,
}: {
  iso: string | null | undefined;
  label?: string;
  thresholdHours?: number;
}) {
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
