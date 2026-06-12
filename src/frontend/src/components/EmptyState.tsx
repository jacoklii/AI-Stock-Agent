export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 p-8 text-center">
      <p className="text-sm text-neutral-500">{message}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

/** In-flight placeholder — empty-state copy must never show while a list is still loading. */
export function Loading() {
  return (
    <p className="animate-pulse text-sm text-neutral-300" aria-busy="true">
      Loading…
    </p>
  );
}
