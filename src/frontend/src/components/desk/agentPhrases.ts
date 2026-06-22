import { fmtTokens } from "../../lib/format";
import type { ProgressOut } from "../../api/types";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Turn a session heartbeat into the narrator's rotating phrases (PROJECT.md §9 — AgentStatus is
 *  the single live-activity line). Each segment is omitted when its counter is 0/missing, so a
 *  fresh run reads cleanly rather than "0 sources". Returns [] when there's nothing to narrate. */
export function progressPhrases(progress: ProgressOut | null | undefined): string[] {
  if (!progress) return [];
  const out: string[] = [];

  if (progress.phase) {
    out.push(
      progress.iteration && progress.iteration > 0
        ? progress.max_iters
          ? `${cap(progress.phase)} · turn ${progress.iteration}/${progress.max_iters}`
          : `${cap(progress.phase)} · turn ${progress.iteration}`
        : cap(progress.phase),
    );
  }
  if (progress.sources && progress.sources > 0) {
    out.push(`Reading ${progress.sources} source${progress.sources === 1 ? "" : "s"}`);
  }
  if (progress.tool_calls && progress.tool_calls > 0) {
    out.push(`${progress.tool_calls} tool call${progress.tool_calls === 1 ? "" : "s"} so far`);
  }
  // Input/output on their own scales — never summed (input volume dwarfs output; output costs more).
  if (
    (progress.input_tokens && progress.input_tokens > 0) ||
    (progress.output_tokens && progress.output_tokens > 0)
  ) {
    out.push(`${fmtTokens(progress.input_tokens)} in · ${fmtTokens(progress.output_tokens)} out`);
  }
  return out;
}
