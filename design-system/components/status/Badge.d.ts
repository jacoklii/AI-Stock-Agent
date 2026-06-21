import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color role. "blue" renders as plain blue link text (no fill); "clear" is an outline-only bubble. */
  tone?: "neutral" | "signal" | "amber" | "blue" | "clear" | "red";
  /** Show a leading status dot. */
  dot?: boolean;
  /** Uppercase + wider tracking. */
  caps?: boolean;
}

/** A compact label/tag. Carries coverage tiers, origins, and any short marker. */
export function Badge(props: BadgeProps): React.JSX.Element;

/** Coverage tier (watchlist / industry_critical / discovered / archived) as a toned badge. */
export function TierBadge(props: { tier?: string } & React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element;

/** Research origin: "user" → requested (clear outline), "schedule" → autonomous (amber). */
export function OriginBadge(props: { initiatedBy?: string | null }): React.JSX.Element | null;
