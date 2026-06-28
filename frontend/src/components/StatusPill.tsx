// Two-engine lifecycle marker (PROJECT.md §9). Agent states — researching / running / open /
// briefed / succeeded — vs scraper states — swept / queued — plus the terminal closed / failed /
// pending. Live states pulse their dot. Plain dot + mono label; no boxed pill.

const COLOR: Record<string, string> = {
  researching: "var(--accent)",
  running: "var(--accent)",
  open: "var(--accent)",
  briefed: "var(--accent-hover)",
  succeeded: "var(--up-500)",
  swept: "var(--text-muted)",
  queued: "var(--text-dim)",
  closed: "var(--text-dim)",
  failed: "var(--red-500)",
  pending: "var(--text-dim)",
};

const LIVE = new Set(["researching", "running", "open"]);

export function StatusPill({ status }: { status: string }) {
  const color = COLOR[status] ?? "var(--text-dim)";
  const live = LIVE.has(status);
  return (
    <span
      className="inline-flex items-center gap-1 font-data text-[10px] uppercase tracking-[0.1em]"
      style={{ color }}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? "asa-pulse" : ""}`}
        style={{ background: color }}
        aria-hidden
      />
      {status}
    </span>
  );
}
