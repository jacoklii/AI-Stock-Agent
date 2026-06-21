import * as React from "react";

export interface TraceStep {
  /** What the agent did, e.g. "Read TSMC Q1 transcript". */
  label: string;
  /** Lifecycle: done (check), active (pulses), pending (dim). Defaults to "done". */
  status?: "done" | "active" | "pending";
  /** Tool invoked, e.g. "web.search", "filings.fetch". */
  tool?: string;
  /** Source domains touched in this step. */
  sources?: string[];
  /** Input tokens for the step (display string or number). */
  inTok?: string | number;
  /** Output tokens for the step. */
  outTok?: string | number;
  /** Cross-platform reuse note, e.g. "Brief · Jun 14". */
  reuse?: string;
  /** Timestamp, e.g. "09:14:22". */
  at?: string;
}

/**
 * The transparency log — a vertical list of the agent's steps with full visibility: tool,
 * sources, input/output tokens, timestamp, and cross-platform reuse.
 *
 * @startingPoint section="Agent" subtitle="Agent step trace with full visibility" viewport="700x320"
 */
export interface AgentTraceProps extends React.HTMLAttributes<HTMLDivElement> {
  steps?: TraceStep[];
}

export function AgentTrace(props: AgentTraceProps): React.JSX.Element;
