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

/** Compact large-money formatting: 1.23T / 45.6B / 789M / 12.3K. Reports the figure as-is —
 *  it never implies a judgment. Negatives (e.g. capex) keep their sign. */
export function fmtBig(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [scale, suffix] of units) {
    if (abs >= scale) return `${sign}${(abs / scale).toFixed(2)}${suffix}`;
  }
  return `${sign}${abs.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
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

/** Flatten markdown to a clean plain-text snippet for list-row previews (e.g. a research session's
 *  findings). The full markdown still renders where the agent's prose belongs (via `Prose`); a teaser
 *  must never leak `**`, `##`, or `[text](url)` syntax. */
export function plainText(md: string | null | undefined, max = 200): string {
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // ATX headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // bullet markers
    .replace(/^\s*\d+\.\s+/gm, "") // ordered markers
    .replace(/^\s*([-*_]\s*){3,}$/gm, " ") // horizontal rules
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/[|*_#>`]/g, " ") // any stragglers
    .replace(/\s+/g, " ") // collapse whitespace + newlines
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
