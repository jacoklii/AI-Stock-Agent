export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center" style={{ borderColor: "var(--border-default)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
      {hint && <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>{hint}</p>}
    </div>
  );
}

/** In-flight placeholder — empty-state copy must never show while a list is still loading. */
export function Loading() {
  return (
    <p className="animate-pulse text-sm" style={{ color: "var(--text-dim)" }} aria-busy="true">
      Loading…
    </p>
  );
}
