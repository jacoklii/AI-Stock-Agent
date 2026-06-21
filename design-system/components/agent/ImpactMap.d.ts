import * as React from "react";

/** One read-through link: a stock, fund, or industry the findings most probably move. */
export interface ImpactItem {
  /** Display name, e.g. "NVIDIA" or "AI accelerator silicon". */
  name: string;
  /** Symbol for a stock or fund. Omit for industries. */
  ticker?: string;
  kind: "stock" | "fund" | "industry";
  /** Direction of the likely effect from the finding. Describes exposure — not a recommendation. */
  effect: "tailwind" | "headwind" | "mixed";
  /** 0–1 probability the change actually plays out. Pass only high-probability links. */
  probability: number;
  /** One line linking the finding to the effect — the data and the interpretation. */
  because?: string;
}

/**
 * ImpactMap — the analytical read-through of a research task. Maps the findings to the stocks,
 * funds, and industries they most probably move: an effect direction (tailwind / headwind /
 * mixed), the probability it plays out, and the one-line reasoning connecting finding → effect.
 *
 * Pass only the high-probability links so the pattern stays legible — the component renders what
 * it's given. Grouped by kind (Industries → Stocks → Funds) by default to aid pattern-finding.
 * It describes exposure to aid human intuition; it never recommends buy/sell/hold.
 *
 * @startingPoint section="Agent" subtitle="Findings → likely-affected names & sectors" viewport="600x560"
 */
export interface ImpactMapProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ImpactItem[];
  /** Intro line above the map. Pass `null` to hide; omit for the default reminder. */
  note?: string | null;
  /** Group rows under Industries / Stocks / Funds headers. Default true. */
  groupByKind?: boolean;
}

export function ImpactMap(props: ImpactMapProps): React.JSX.Element;
