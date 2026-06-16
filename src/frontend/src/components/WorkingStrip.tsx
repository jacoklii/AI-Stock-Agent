import { fmtTokens } from "../lib/format";
import type { ProgressOut } from "../api/types";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Live "working strip" — what the agent is doing right now, derived from the session heartbeat.
 *  e.g. "Gathering · turn 7/24 · 12 tool calls · 5 sources · 18.2k tok". Each segment is omitted
 *  when its counter is 0 or missing, so a fresh run reads cleanly rather than "0 sources". */
export function WorkingStrip({ progress, className = "" }: { progress: ProgressOut; className?: string }) {
  const segs: string[] = [];

  if (progress.phase) segs.push(cap(progress.phase));
  if (progress.iteration && progress.iteration > 0) {
    segs.push(progress.max_iters ? `turn ${progress.iteration}/${progress.max_iters}` : `turn ${progress.iteration}`);
  }
  if (progress.tool_calls && progress.tool_calls > 0) {
    segs.push(`${progress.tool_calls} tool call${progress.tool_calls === 1 ? "" : "s"}`);
  }
  if (progress.sources && progress.sources > 0) {
    segs.push(`${progress.sources} source${progress.sources === 1 ? "" : "s"}`);
  }
  if (progress.tokens_spent && progress.tokens_spent > 0) {
    segs.push(`${fmtTokens(progress.tokens_spent)} tok`);
  }

  if (segs.length === 0) return null;

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-500" aria-hidden />
      <span className="truncate tabular-nums">{segs.join(" · ")}</span>
    </span>
  );
}
