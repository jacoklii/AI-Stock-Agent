import type { Horizon } from "../lib/freshness";

/** Significance as TIME, never a number (PROJECT.md §8). "Now" = act on the tape today;
 *  "Building" = expected to matter ahead. Plain text — no box, no score. */
export function HorizonTag({ horizon }: { horizon: Horizon }) {
  const now = horizon === "now";
  return (
    <span
      className="font-data text-[10px] uppercase tracking-[0.12em]"
      style={{ color: now ? "var(--accent)" : "var(--text-dim)" }}
      title={now ? "Act on the tape today" : "Expected to matter ahead"}
    >
      {now ? "Now" : "Building"}
    </span>
  );
}
