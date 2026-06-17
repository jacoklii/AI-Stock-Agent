// Formatting helpers — information-dense, no locale surprises (UTC-anchored timestamps).

export function fmtTokens(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Humanize a web-tool key into a singular noun phrase for the agent's token breakdown.
 *  Known providers get friendly labels; anything else is de-snaked (e.g. "foo_bar" → "foo bar"). */
function webToolLabel(key: string): string {
  if (key === "web_search") return "web search";
  if (key === "web_fetch") return "fetch";
  return key.replace(/_/g, " ");
}

/** Pluralize a short noun for a count — handles the sibilant "-es" case (search → searches,
 *  fetch → fetches) so the breakdown doesn't read "searchs"/"fetchs". */
function pluralize(noun: string, n: number): string {
  if (n === 1) return noun;
  if (/(s|x|z|ch|sh)$/.test(noun)) return `${noun}es`;
  return `${noun}s`;
}

/** Render web-tool-use counts as compact pluralized phrases, e.g.
 *  `{ web_search: 3, web_fetch: 8 }` → ["3 web searches", "8 fetches"]. Zero/missing counts drop out. */
export function fmtWebToolUses(uses: { [name: string]: number } | null | undefined): string[] {
  if (!uses) return [];
  const out: string[] = [];
  for (const [key, n] of Object.entries(uses)) {
    if (!n || n <= 0) continue;
    out.push(`${n} ${pluralize(webToolLabel(key), n)}`);
  }
  return out;
}

export function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((now.getTime() - then) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
