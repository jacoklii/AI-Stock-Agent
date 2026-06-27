import type { ReactNode } from "react";

/** A bordered card with a small uppercase header — the page building block. */
export function SnapshotCard({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border p-4" style={{ borderColor: "var(--border-default)", background: "var(--surface-panel)" }}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
