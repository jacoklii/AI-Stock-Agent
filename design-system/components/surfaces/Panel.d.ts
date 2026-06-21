import * as React from "react";

/**
 * The terminal surface that frames a section — a caps header bar with a live signal dot, an
 * optional right aside, and a hairline-bordered body. Minimal by design: no glow, no scan.
 *
 * @startingPoint section="Surfaces" subtitle="Terminal panel with caps header" viewport="700x200"
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Caps header label. Omit (with no aside) to render a borderless body-only panel. */
  title?: React.ReactNode;
  /** Right-aligned meta (freshness stamp, count). */
  aside?: React.ReactNode;
  /** Pulse the header dot — use when the panel shows continuously-updating state. */
  live?: boolean;
  /** Remove body padding (for tables/lists that manage their own). */
  noPad?: boolean;
}

export function Panel(props: PanelProps): React.JSX.Element;
