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
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
