import * as React from "react";

/**
 * Research/task lifecycle marker. Live states (researching, running, open) pulse their dot.
 * `swept` distinguishes what the cheap scraper stored from what the agent actually researched.
 *
 * @startingPoint section="Status" subtitle="Lifecycle pill with pulsing dot" viewport="700x120"
 */
export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?:
    | "researching"
    | "running"
    | "open"
    | "briefed"
    | "succeeded"
    | "swept"
    | "closed"
    | "failed"
    | "queued"
    | "pending";
}

export function StatusPill(props: StatusPillProps): React.JSX.Element;
