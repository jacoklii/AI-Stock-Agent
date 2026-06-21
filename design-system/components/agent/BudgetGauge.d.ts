import * as React from "react";

/**
 * The agent's weekly token self-pacing limit as a segmented terminal bar. Tone shifts
 * green → amber → red as spend approaches the cap; the leading lit segment pulses.
 *
 * @startingPoint section="Agent" subtitle="Segmented token budget gauge" viewport="700x120"
 */
export interface BudgetGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tokens spent over the trailing 7 days. */
  spent?: number;
  /** Weekly cap; null = uncapped (no segments lit). */
  cap?: number | null;
  /** Number of segments in the bar. */
  segments?: number;
  /** Tighter bar for the sidebar. */
  compact?: boolean;
}

export function BudgetGauge(props: BudgetGaugeProps): React.JSX.Element;
