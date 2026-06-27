import { fmtTokens } from "../lib/format";
import type { BudgetOut } from "../api/types";

/** Weekly token budget posture — the agent's self-pacing limit, visible at all times. The fill is the
 *  agent orange (autonomy spend), turning red only as it nears the cap (an alert). */
export function BudgetGauge({ budget, compact = false }: { budget: BudgetOut; compact?: boolean }) {
  const cap = budget.weekly_token_budget;
  const spent = budget.spent_7d;
  const ratio = cap ? Math.min(1, spent / cap) : 0;
  const fill = ratio > 0.9 ? "var(--red-500)" : "var(--agent)";

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Weekly budget</span>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          {fmtTokens(spent)}
          {cap != null ? ` / ${fmtTokens(cap)}` : " spent · uncapped"}
        </span>
      </div>
      {cap != null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-inset)" }}>
          <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: fill }} />
        </div>
      )}
    </div>
  );
}
