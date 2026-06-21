import * as React from "react";

/**
 * The signature live status line. Phrases rise up from below into place, hold, then rise away
 * as the next replaces them. Leading typing-dots show the agent is working.
 *
 * @startingPoint section="Agent" subtitle="Rotating bottom-up status line" viewport="700x80"
 */
export interface AgentStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The status phrases to cycle, e.g. ["Thinking…", "Researching TSMC capacity…", "Reading 6 sources…"]. */
  phrases?: string[];
  /** Ms each phrase holds before it rises away. */
  interval?: number;
  /** Loop back to the first phrase, or stop on the last. */
  loop?: boolean;
  /** Show the leading typing dots. */
  dots?: boolean;
  /** Override the line font-size (any CSS length / token). */
  size?: string;
}

export function AgentStatus(props: AgentStatusProps): React.JSX.Element | null;
