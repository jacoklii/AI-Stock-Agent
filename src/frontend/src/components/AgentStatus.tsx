import { useEffect, useState } from "react";

/** The single live-activity narrator (PROJECT.md §9). Phrases rise up from below, hold, then rise
 *  away as the next replaces them; leading typing-dots show the agent is working. When idle (no
 *  phrases) it renders a calm resting line. Replaces the old WorkingStrip. */
export function AgentStatus({
  phrases,
  interval = 2600,
  dots = true,
  idle = "Idle — watching the tape",
}: {
  phrases: string[];
  interval?: number;
  dots?: boolean;
  idle?: string;
}) {
  const [i, setI] = useState(0);
  const live = phrases.length > 0;

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = setInterval(() => setI((n) => (n + 1) % phrases.length), interval);
    return () => clearInterval(id);
  }, [phrases.length, interval]);

  const text = live ? phrases[i % phrases.length] : idle;

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {dots && live && (
        <span className="inline-flex shrink-0 items-end gap-0.5" aria-hidden>
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      )}
      <span
        key={text}
        className="truncate"
        style={{
          color: live ? "var(--text-strong)" : "var(--text-dim)",
          animation: "asa-status-in 360ms var(--ease-out)",
          fontSize: "0.8125rem",
        }}
      >
        {text}
      </span>
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1 w-1 rounded-full"
      style={{
        background: "var(--accent)",
        animation: "asa-pulse 1.2s var(--ease-out) infinite",
        animationDelay: delay,
      }}
    />
  );
}
