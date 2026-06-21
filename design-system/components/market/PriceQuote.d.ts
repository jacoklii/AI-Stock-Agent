import * as React from "react";

/**
 * One instrument line: symbol, name, price, signed change, and an inline sparkline. Up/down
 * drives color and the ▲/▼ arrow; the row can flash on tick.
 *
 * @startingPoint section="Market" subtitle="Quote row with spark + delta" viewport="700x120"
 */
export interface PriceQuoteProps extends React.HTMLAttributes<HTMLDivElement> {
  symbol: string;
  name?: string;
  price?: number | null;
  changePct?: number | null;
  /** Recent price series for the inline sparkline. */
  series?: number[];
  showSpark?: boolean;
  /** Briefly flash the row background on a tick. */
  flash?: "up" | "down" | null;
}

export function PriceQuote(props: PriceQuoteProps): React.JSX.Element;
