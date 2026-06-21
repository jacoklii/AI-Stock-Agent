import * as React from "react";

/**
 * The terminal action control: square-ish, mono-labelled, glows on hover when primary.
 *
 * @startingPoint section="Core" subtitle="Mono terminal button, 4 variants" viewport="700x140"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. Primary is the bright phosphor fill; use one per view. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  /** Leading icon node (SVG/glyph), sized to 1em. */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
}

export function Button(props: ButtonProps): React.JSX.Element;
