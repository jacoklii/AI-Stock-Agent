/** Who initiated a research session: "user" (you requested it) vs "schedule" (the agent's own
 *  autonomous/scheduled work). Renders nothing for an unknown/missing origin. */
export function OriginBadge({ initiatedBy }: { initiatedBy?: string | null }) {
  if (initiatedBy !== "user" && initiatedBy !== "schedule") return null;
  const isUser = initiatedBy === "user";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        isUser
          ? "bg-violet-50 text-violet-700 ring-violet-200"
          : "bg-amber-50 text-amber-700 ring-amber-200"
      }`}
      title={isUser ? "You requested this research" : "The agent opened this autonomously"}
    >
      {isUser ? "Requested" : "Autonomous"}
    </span>
  );
}
