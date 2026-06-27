import { useState } from "react";

import { useWorld } from "../api/queries";
import { ExternalIcon } from "../components/Icons";
import { Prose } from "../components/Prose";
import { fmtDateTime, plainText } from "../lib/format";
import type { Horizon } from "../lib/freshness";
import type { DigestView, WorldDomain, WorldItem, WorldSignal } from "../api/types";

// Market moves originate top-down: geopolitics is the origin, market is the effect (PROJECT.md §4).
const DOMAIN_ORDER = ["geopolitics", "macro", "industry", "market"] as const;

/** Per-domain identity: a short masthead, a 3-letter station code, and the accent CSS var that
 *  color-codes the whole zone (rule, header, glyph, signal dot). Defined in styles.css under
 *  `.world-console` so the dark surveillance scope owns the palette. */
const DOMAIN_META: Record<string, { short: string; code: string; cssVar: string }> = {
  geopolitics: { short: "Geopolitics", code: "GEO", cssVar: "--geo" },
  macro: { short: "Macroeconomics", code: "MAC", cssVar: "--mac" },
  industry: { short: "Industry trends", code: "IND", cssVar: "--ind" },
  market: { short: "General market", code: "MKT", cssVar: "--mkt" },
};

const domainVar = (key: string) => `var(${DOMAIN_META[key]?.cssVar ?? "--accent"})`;

/** Image slot is wired in the UI now; the ingest doesn't carry article images yet (slots-only),
 *  so this is optional and falls back to a domain-glyph placeholder until the pipeline lands. */
type Story = WorldItem & { image_url?: string | null };

/** A domain is "Now" if anything under it is acute on today's tape, else "Building". */
function domainHorizon(d: WorldDomain): Horizon {
  return (d.items ?? []).some((it) => it.horizon === "now") ? "now" : "building";
}

/** First sentence of a string, plain and capped — the shape of a one-line thread read. */
function firstSentence(text: string, max = 180): string {
  const t = plainText(text, 600);
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  let s = (m ? m[0] : t).trim();
  if (s.length > max) s = `${s.slice(0, max).trimEnd()}…`;
  return s;
}

/** True for a paragraph that wouldn't make a good one-line read: a title line, a list lead-in
 *  ("The arc, in sequence:"), or anything too short to be a real sentence. */
function isWeakRead(plain: string): boolean {
  return plain.length < 30 || /[:—-]$/.test(plain) || (plain.length < 60 && !/[.!?]/.test(plain));
}

/** A short read for the overview thread — the first substantive prose sentence of the domain's
 *  synthesis, skipping the `## Domain — date` title, sub-heads, and list lead-ins. */
function domainRead(d: WorldDomain): string {
  if (!d.summary) return "";
  const paras = d.summary.split(/\n\s*\n/);
  for (const para of paras) {
    const p = para.trim();
    if (!p || /^#{1,6}\s/.test(p)) continue;
    const plain = plainText(p, 400);
    if (isWeakRead(plain)) continue;
    return firstSentence(plain);
  }
  for (const para of paras) {
    const p = para.trim();
    if (p && !/^#{1,6}\s/.test(p)) return firstSentence(plainText(p, 400));
  }
  const { headline } = splitSynthesis(d.summary);
  return headline ? firstSentence(headline) : "";
}

/** Headline + lead + body for the cross-domain overview. The digest opens with a **bold throughline**
 *  sentence (its de-facto headline); the origin-domain fallback opens with a `### subhead`. Handle
 *  both, stripping the "The throughline:/central story:" label so the headline reads clean. */
function overviewParts(md: string): { headline: string | null; lead: string; body: string } {
  let s = stripTitle(md).trim();
  let headline: string | null = null;
  const bold = s.match(/^\*\*(.+?)\*\*\s*/s);
  const hdr = s.match(/^#{2,6}\s+(.+?)(?:\n|$)/);
  if (bold) {
    headline = bold[1].trim();
    s = s.slice(bold[0].length).trim();
  } else if (hdr) {
    headline = hdr[1].replace(/\*\*/g, "").trim();
    s = s.slice(hdr[0].length).trim();
  }
  if (headline) {
    headline = headline.replace(/^(the\s+)?(throughline|central story|bottom line|takeaway)\s*[:—-]\s*/i, "");
    headline = headline.charAt(0).toUpperCase() + headline.slice(1);
  }
  const parts = s.split(/\n\s*\n/);
  const lead = (parts.shift() ?? "").trim();
  const body = parts.join("\n\n").trim();
  return { headline, lead, body };
}

/** Drop the synthesis's own `# Title — date` line so it doesn't double the section head. */
function stripTitle(md: string): string {
  return md.replace(/^\s*#{1,2}\s+.*(?:\n|$)/, "").trimStart();
}

/** Pull a headline + lead paragraph out of the agent's synthesis, leaving the rest as the body. */
function splitSynthesis(md: string): { headline: string | null; lead: string; body: string } {
  let s = stripTitle(md);
  let headline: string | null = null;
  const h = s.match(/^\s*#{3,6}\s+(.+?)\s*(?:\n|$)/);
  if (h) {
    headline = h[1].replace(/\*\*/g, "").replace(/^The central story:\s*/i, "").trim();
    s = s.slice(h[0].length).trimStart();
  }
  const parts = s.split(/\n\s*\n/);
  const lead = (parts.shift() ?? "").trim();
  const body = parts.join("\n\n").trim();
  return { headline, lead, body };
}

/** Headlines often carry their outlet as a trailing " - Reuters". Lift it out so the outlet reads
 *  as a station tag and the headline stays clean. */
function splitSource(title: string): { title: string; source: string | null } {
  const idx = title.lastIndexOf(" - ");
  if (idx > 0) {
    const tail = title.slice(idx + 3).trim();
    if (tail.length >= 2 && tail.length <= 25 && /^[A-Z0-9]/.test(tail) && !/[.!?]$/.test(tail)) {
      return { title: title.slice(0, idx).trim(), source: tail };
    }
  }
  return { title, source: null };
}

/** Significance as TIME, never a number (PROJECT.md §8), styled for the console: a tiny pill that
 *  glows on the domain/alert color when "Now", recedes to a hairline when "Building". */
function HorizonPill({ horizon }: { horizon: Horizon }) {
  const now = horizon === "now";
  return (
    <span className={`hz ${now ? "hz-now" : "hz-building"}`} title={now ? "Act on the tape today" : "Expected to matter ahead"}>
      {now && <span className="hz-dot" />}
      {now ? "Now" : "Building"}
    </span>
  );
}

/** The always-on middle surveillance view, as a dark command console. A sticky status bar reads the
 *  station; the agent's cross-domain brief anchors the page; a priority Signals strip ranks Now vs.
 *  Building; then each domain is its own color-coded zone of image tiles. Font roles hold: Space
 *  Grotesk titles, JetBrains Mono telemetry, Spectral serif only for the agent's read. */
export function World({ onResearch }: { onResearch: (topic: string) => void }) {
  const world = useWorld();
  const data = world.data;
  const domains = data?.domains ?? [];
  const ordered = [...domains].sort((a, b) => DOMAIN_ORDER.indexOf(a.key) - DOMAIN_ORDER.indexOf(b.key));
  const generatedDate = data?.generated_at ? new Date(data.generated_at) : null;
  const totalItems = domains.reduce((n, d) => n + (d.items?.length ?? 0), 0);
  const digest = data?.overview ?? null;
  const originDomain = ordered.find((d) => d.summary) ?? null;
  const hasOverview = !!digest?.top_snapshot || !!originDomain;
  const empty = !!data && !hasOverview && domains.every((d) => (d.items ?? []).length === 0);

  return (
    <div className="world-console h-full overflow-y-auto">
      <StatusBar date={generatedDate} domains={ordered} total={totalItems} loading={world.isLoading} />

      <div className="mx-auto max-w-[1080px] px-6 pb-16 pt-5">
        {hasOverview && (
          <Overview
            digest={digest}
            originDomain={originDomain}
            domains={ordered}
            onResearch={onResearch}
          />
        )}

        <Signals now={data?.signals_now ?? []} building={data?.signals_building ?? []} onResearch={onResearch} />

        <div className="zone-stack">
          {ordered.map((d) => (
            <DomainZone
              key={d.key}
              domain={d}
              onResearch={onResearch}
              consumeLead={!digest?.top_snapshot && d === originDomain}
            />
          ))}
        </div>

        {empty && (
          <div className="mt-10 border border-dashed p-8 text-center" style={{ borderColor: "var(--border-default)" }}>
            <p className="terminal-label" style={{ color: "var(--text-muted)" }}>No signal on the wire</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
              The surveillance feed populates as the scraper sweeps. The agent&apos;s synthesis appears after the first digest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** The command-console status strip — sticky at the top of the feed. Live indicator + station name
 *  + date on the left; per-domain count chips (color-coded station codes) on the right. */
function StatusBar({ date, domains, total, loading }: { date: Date | null; domains: WorldDomain[]; total: number; loading: boolean }) {
  return (
    <header className="console-status sticky top-0 z-20">
      <div className="mx-auto flex max-w-[1080px] items-center gap-3 px-6 py-2.5">
        <span className="status-live" />
        <span className="font-data text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-strong)" }}>
          World Surveillance
        </span>
        {date && (
          <span className="font-data text-[10.5px] tracking-wide" style={{ color: "var(--text-dim)" }}>
            {fmtDay(date)} · {date.toISOString().slice(11, 16)}Z
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {domains.map((d) => {
            const n = d.items?.length ?? 0;
            return (
              <span key={d.key} className="stat-chip" style={{ ["--zone" as string]: domainVar(d.key) }} title={DOMAIN_META[d.key]?.short}>
                <span className="stat-dot" />
                {DOMAIN_META[d.key]?.code ?? d.key.slice(0, 3).toUpperCase()}
                <span className="tnum" style={{ color: "var(--text-strong)" }}>{n}</span>
              </span>
            );
          })}
          <span className="ml-1 font-data text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--text-dim)" }}>
            {loading ? "syncing…" : `${total} tracked`}
          </span>
        </span>
      </div>
    </header>
  );
}

/** The agent's cross-domain brief — the analyst read that opens the console. A bright sans headline,
 *  a serif lead (the agent's voice), an expandable full read, then the four domains threaded as a
 *  compact signal matrix (color dot · code · horizon · one-line read). */
function Overview({
  digest,
  originDomain,
  domains,
  onResearch,
}: {
  digest: DigestView | null;
  originDomain: WorldDomain | null;
  domains: WorldDomain[];
  onResearch: (topic: string) => void;
}) {
  const fromDigest = !!digest?.top_snapshot;
  const { headline, lead, body } = overviewParts(fromDigest ? digest!.top_snapshot! : originDomain?.summary ?? "");
  const [open, setOpen] = useState(false);
  const threads = domains.filter((d) => domainRead(d));

  return (
    <section className="console-brief mb-6">
      <div className="flex items-center gap-2 px-5 pt-4">
        <span className="brief-mark" />
        <span className="terminal-label" style={{ color: "var(--agent)" }}>Analyst read</span>
        <span className="font-data text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--text-dim)" }}>
          · cross-domain synthesis
        </span>
      </div>

      <div className="px-5 pb-4 pt-2">
        {headline && (
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "1.85rem", fontWeight: 700, lineHeight: 1.14, letterSpacing: "-0.025em", color: "var(--text-strong)" }}>
            {headline}
          </h1>
        )}
        {lead && (
          <div className="hero-lead mt-3" style={{ fontSize: "1.02rem", lineHeight: 1.6 }}>
            <Prose serif>{lead}</Prose>
          </div>
        )}
        {fromDigest && body && (
          <>
            {open && <div className="mt-3"><Prose serif>{body}</Prose></div>}
            <button type="button" onClick={() => setOpen((o) => !o)} className="console-more mt-3">
              {open ? "× close the read" : "read the full read →"}
            </button>
          </>
        )}
      </div>

      {threads.length > 0 && (
        <div className="brief-matrix">
          {threads.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => onResearch(DOMAIN_META[d.key]?.short ?? d.title)}
              className="brief-row group"
              style={{ ["--zone" as string]: domainVar(d.key) }}
              title="Open research on this domain"
            >
              <span className="brief-rail" />
              <span className="w-[6.5rem] shrink-0 font-data text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                {DOMAIN_META[d.key]?.short ?? d.title}
              </span>
              <span className="w-[4.25rem] shrink-0"><HorizonPill horizon={domainHorizon(d)} /></span>
              <span className="flex-1 group-hover:underline" style={{ fontFamily: "var(--font-serif)", fontSize: "0.92rem", lineHeight: 1.45, color: "var(--text-body)" }}>
                {domainRead(d)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** Priority feed — the ranked Now / Building band, tactical chips rather than an editorial list. */
function Signals({ now, building, onResearch }: { now: WorldSignal[]; building: WorldSignal[]; onResearch: (topic: string) => void }) {
  if (now.length === 0 && building.length === 0) return null;
  return (
    <section className="mb-6">
      <ZoneLabel text="Signals" kicker="priority feed" />
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SignalLane label="Now" alert caption="on the tape today" signals={now} onResearch={onResearch} />
        <SignalLane label="Building" caption="expected to matter ahead" signals={building} onResearch={onResearch} />
      </div>
    </section>
  );
}

function SignalLane({ label, caption, signals, onResearch, alert = false }: { label: string; caption: string; signals: WorldSignal[]; onResearch: (topic: string) => void; alert?: boolean }) {
  return (
    <div className={`signal-lane ${alert ? "signal-lane-now" : ""}`}>
      <div className="mb-2 flex items-center gap-2">
        {alert && <span className="status-live" />}
        <span className="font-data text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: alert ? "var(--alert)" : "var(--text-muted)" }}>{label}</span>
        <span className="font-data text-[10px] tnum" style={{ color: "var(--text-dim)" }}>{signals.length}</span>
        <span className="text-[10.5px]" style={{ color: "var(--text-dim)" }}>· {caption}</span>
      </div>
      {signals.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>{alert ? "Nothing acute on the tape right now." : "Nothing building yet."}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {signals.map((s, i) => (
            <button key={i} type="button" onClick={() => onResearch(s.title)} className="signal-item group" title="Open research on this">
              <span className="signal-bullet" style={{ background: alert ? "var(--alert)" : "var(--border-strong)" }} />
              <span className="min-w-0 flex-1 truncate text-[13px] group-hover:underline" style={{ color: "var(--text-body)" }}>{splitSource(s.title).title}</span>
              {(s.tickers ?? []).length > 0 && (
                <span className="shrink-0 font-data text-[10.5px]" style={{ color: "var(--text-muted)" }}>{(s.tickers ?? []).slice(0, 3).join(" ")}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A zone section label — a color rule + a big sans title + a mono kicker. */
function ZoneLabel({ text, kicker, color }: { text: string; kicker?: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3.5 w-1" style={{ background: color ?? "var(--accent)" }} />
      <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>{text}</h2>
      {kicker && <span className="font-data text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--text-dim)" }}>· {kicker}</span>}
    </div>
  );
}

/** Synthesis as a digestible lead + opt-in full read, on the dark zone surface. */
function DomainSynthesis({ md, consumeLead = false }: { md: string; consumeLead?: boolean }) {
  const { headline, lead, body } = splitSynthesis(md);
  const [open, setOpen] = useState(false);
  if (consumeLead) {
    if (!body) return null;
    const parts = body.split(/\n\s*\n/);
    const first = parts.shift() ?? "";
    const rest = parts.join("\n\n").trim();
    return (
      <div className="domain-read">
        <Prose serif>{first}</Prose>
        {rest && (
          <>
            {open && <div className="mt-2"><Prose serif>{rest}</Prose></div>}
            <button type="button" onClick={() => setOpen((o) => !o)} className="console-more mt-2">{open ? "× close the read" : "read the full read →"}</button>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="domain-read">
      {headline && <p className="mb-1" style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>{headline}</p>}
      {lead && <Prose serif>{lead}</Prose>}
      {body && (
        <>
          {open && <div className="mt-2"><Prose serif>{body}</Prose></div>}
          <button type="button" onClick={() => setOpen((o) => !o)} className="console-more mt-2">{open ? "× close the read" : "read the full read →"}</button>
        </>
      )}
    </div>
  );
}

/** Compact relative age for the telemetry column — "2h" / "5m" / "3d" / "now" (vs. the full
 *  `fmtDateTime` kept as the hover title). Mirrors `timeAgo` minus the " ago". */
function compactAge(iso?: string | null, now: Date = new Date()): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** A domain zone — the console's core unit, framed like an intelligence dossier: a color-coded
 *  header, the agent's read welded on as a labeled Synthesis block (amber rail + "synthesized from N
 *  events" provenance), then a dense, scannable event feed — a lead row with weight and its source
 *  summary, then one-line rows closing on a monospace country · age · source column. */
function DomainZone({ domain, onResearch, consumeLead = false }: { domain: WorldDomain; onResearch: (topic: string) => void; consumeLead?: boolean }) {
  const items = (domain.items ?? []) as Story[];
  const tickers = domain.key_tickers ?? [];
  if (items.length === 0 && !domain.summary) return null;
  const meta = DOMAIN_META[domain.key];
  const zone = domainVar(domain.key);
  const lead = items[0];
  const rest = items.slice(1, 6);
  const more = Math.max(0, items.length - 1 - rest.length);
  const evCount = domain.source_event_ids?.length ?? 0;

  return (
    <section className="domain-zone" style={{ ["--zone" as string]: zone }}>
      <header className="zone-head">
        <span className="zone-code">{meta?.code ?? domain.key.slice(0, 3).toUpperCase()}</span>
        <h2 className="zone-title">{domain.title}</h2>
        <span className="zone-count tnum">{items.length}</span>
        <span className="ml-auto flex items-center gap-3">
          {tickers.length > 0 && <span className="hidden font-data text-[10.5px] tracking-wide sm:inline" style={{ color: "var(--text-muted)" }}>{tickers.slice(0, 5).join(" · ")}</span>}
          <HorizonPill horizon={domainHorizon(domain)} />
        </span>
      </header>

      {domain.summary && (
        <div className="zone-synth">
          <div className="synth-label">
            <span className="synth-mark" />
            <span className="synth-kicker">Synthesis</span>
            <span className="synth-sub">· agent read</span>
          </div>
          <DomainSynthesis md={domain.summary} consumeLead={consumeLead} />
          {(evCount > 0 || tickers.length > 0) && (
            <div className="synth-prov">
              {evCount > 0 && <>synthesized from <span className="prov-em">{evCount} event{evCount === 1 ? "" : "s"}</span></>}
              {evCount > 0 && tickers.length > 0 && " · "}
              {tickers.length > 0 && <>key <span className="prov-tk">{tickers.slice(0, 5).join(" ")}</span></>}
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="zone-feed">
          <div className="feed-label">
            <span className="feed-kicker">Feed</span>
            <span className="feed-rule" />
            <span className="feed-count tnum">{items.length} events</span>
          </div>
          {lead && <FeatureRow item={lead} onResearch={onResearch} />}
          {rest.map((it, i) => <StoryRow key={i} item={it} onResearch={onResearch} />)}
          {more > 0 && (
            <p className="feed-more">+ {more} more in this domain — open News &amp; events for the full feed</p>
          )}
        </div>
      )}
    </section>
  );
}

/** Optional article thumbnail — renders only when the ingest carries a photo (slots-only today). No
 *  glyph fallback: a text-only feed stays text-only rather than padding rows with empty image boxes. */
function RowThumb({ src, className = "" }: { src: string; className?: string }) {
  return <span className={`row-thumb ${className}`}><img src={src} alt="" loading="lazy" /></span>;
}

/** The lead row of a zone's feed — the headline carries weight and its API-grabbed source summary
 *  shows inline; key tickers and the monospace telemetry column (country · age · source ↗) close it. */
function FeatureRow({ item, onResearch }: { item: Story; onResearch: (topic: string) => void }) {
  const { title } = splitSource(item.title);
  const summary = item.detail && item.detail.trim() !== title.trim() ? item.detail : null;
  const tickers = item.tickers ?? [];
  return (
    <article className="feed-lead">
      <span className={`feed-dot ${item.horizon === "now" ? "dot-now" : "dot-build"}`} />
      {item.image_url && <RowThumb src={item.image_url} className="lead-thumb" />}
      <div className="min-w-0 flex-1">
        <button type="button" className="lead-title" onClick={() => onResearch(title)}>{title}</button>
        {summary && <p className="lead-summary">{summary}</p>}
        {tickers.length > 0 && (
          <div className="lead-tickers">{tickers.slice(0, 4).map((t) => <span key={t}>{t}</span>)}</div>
        )}
      </div>
      <RowMeta item={item} stacked />
    </article>
  );
}

/** A compact feed row — one scannable line: horizon dot · headline · country · age · source ↗. */
function StoryRow({ item, onResearch }: { item: Story; onResearch: (topic: string) => void }) {
  const { title } = splitSource(item.title);
  return (
    <div className="feed-row">
      <span className={`feed-dot-sm ${item.horizon === "now" ? "dot-now" : "dot-build"}`} />
      <button type="button" className="row-title" onClick={() => onResearch(title)}>{title}</button>
      <RowMeta item={item} />
    </div>
  );
}

/** The monospace telemetry that closes every feed row — source country, compact age, and the
 *  first-class source link (hard rule: URLs are content). Stacked under the lead, inline elsewhere. */
function RowMeta({ item, stacked = false }: { item: Story; stacked?: boolean }) {
  const age = compactAge(item.published_at);
  return (
    <div className={stacked ? "lead-meta" : "row-meta"}>
      {item.source_country && <span className="meta-cc">{item.source_country}</span>}
      {age && <span className="meta-age" title={fmtDateTime(item.published_at)}>{age}</span>}
      {item.source_url && (
        <a href={item.source_url} target="_blank" rel="noreferrer" className="meta-src" title="Open the source article">
          {stacked ? <>source <ExternalIcon size={10} /></> : <ExternalIcon size={11} />}
        </a>
      )}
    </div>
  );
}
