import type { ReactNode } from "react";

/** Minimal terminal surface: a caps header on a hairline rule, a hairline-bordered body. No glow,
 *  no scanline, no left-border accent — the information takes over, not the chrome (PROJECT.md §8). */
export function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md ${className}`}
      style={{ border: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
    >
      {title && (
        <header
          className="flex items-center justify-between gap-2 px-3 py-2"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <span className="terminal-label">{title}</span>
          {aside}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}
