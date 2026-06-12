import { fmtTokens } from "../lib/format";
import type { BudgetOut } from "../api/types";

/** Weekly token budget posture — the agent's self-pacing limit, visible at all times. */
export function BudgetGauge({ budget, compact = false }: { budget: BudgetOut; compact?: boolean }) {
  const cap = budget.weekly_token_budget;
  const spent = budget.spent_7d;
  const ratio = cap ? Math.min(1, spent / cap) : 0;
  const tone = ratio > 0.9 ? "bg-red-500" : ratio > 0.7 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-neutral-400">Weekly budget</span>
        <span className="text-xs tabular-nums text-neutral-500">
          {fmtTokens(spent)}
          {cap != null ? ` / ${fmtTokens(cap)}` : " spent · uncapped"}
        </span>
      </div>
      {cap != null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
        </div>
      )}
    </div>
  );
}
