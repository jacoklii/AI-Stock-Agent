/** Who initiated a research session: "user" (you requested it) vs "schedule" (the agent's own
 *  autonomous/scheduled work). User-requested reads in the theme green; autonomous reads in the
 *  agent orange (reserved for the agent & autonomy). Renders nothing for an unknown origin. */
export function OriginBadge({ initiatedBy }: { initiatedBy?: string | null }) {
  if (initiatedBy !== "user" && initiatedBy !== "schedule") return null;
  const isUser = initiatedBy === "user";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={
        isUser
          ? { background: "var(--signal-soft)", color: "var(--accent)", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--accent) 28%, transparent)" }
          : { background: "var(--agent-bg)", color: "var(--agent)", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--agent) 30%, transparent)" }
      }
      title={isUser ? "You requested this research" : "The agent opened this autonomously"}
    >
      {isUser ? "Requested" : "Autonomous"}
    </span>
  );
}
