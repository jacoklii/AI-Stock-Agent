import * as React from "react";

/**
 * A compact phosphor price trace. Auto-colors up/down from series direction, fills the area,
 * draws itself in, and pulses the leading dot.
 *
 * @startingPoint section="Market" subtitle="Animated price sparkline" viewport="700x120"
 */
export interface SparklineProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The price series, oldest → newest. Needs ≥2 finite numbers. */
  data?: number[];
  width?: number;
  height?: number;
  /** Override the auto up/down color. */
  color?: string;
  /** Fill the area under the line. */
  area?: boolean;
  /** Animate the line drawing in on mount. */
  draw?: boolean;
  /** Pulse the leading-edge dot. */
  liveDot?: boolean;
}

export function Sparkline(props: SparklineProps): React.JSX.Element;
