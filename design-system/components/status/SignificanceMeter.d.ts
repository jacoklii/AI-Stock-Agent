import * as React from "react";

/**
 * A 0–1 signal-vs-noise score as a 5-segment bar + value. Color steps neutral → amber → red.
 *
 * @startingPoint section="Status" subtitle="Significance 0–1 segment meter" viewport="700x120"
 */
export interface SignificanceMeterProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 0–1 significance. >=0.4 amber, >=0.7 red. */
  value?: number;
  /** Prefix a "SIG" caps label. */
  showLabel?: boolean;
}

export function SignificanceMeter(props: SignificanceMeterProps): React.JSX.Element;
