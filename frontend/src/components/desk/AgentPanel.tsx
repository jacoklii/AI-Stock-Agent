import { useState, type ReactNode } from "react";

import {
  useActivity,
  useBudget,
  useCloseResearch,
  useRedirectResearch,
  useResearchDetail,
  useResearchList,
} from "../../api/queries";
import { ArticleList } from "../ArticleList";
import { AgentStatus } from "../AgentStatus";
import { BudgetGauge } from "../BudgetGauge";
import { FreshnessStamp } from "../FreshnessStamp";
import { OriginBadge } from "../OriginBadge";
import { Prose } from "../Prose";
import { SourceChips } from "../SourceChips";
import { StatusPill } from "../StatusPill";
import { TaskList } from "../TaskList";
import { CloseIcon } from "../Icons";
import { progressPhrases } from "./agentPhrases";
import { fmtTokens, timeAgo } from "../../lib/format";
import { isStalled } from "../../lib/freshness";
import type { ArticleOut, ProgressOut, TaskOut } from "../../api/types";

// Provider/filing hosts whose URLs the agent reached via APIs (vs. open web search). Heuristic —
// explicit per-URL provenance tagging on the research state is a future upgrade.
const PROVIDER_HOSTS = ["sec.gov"];

function isFilingUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return PROVIDER_HOSTS.some((p) => h === p || h.endsWith(`.${p}`));
  } catch {
    return false;
  }
}

/** The agent's consulted sources, grouped by provenance: the local watch DB (news events it read),
 *  filings / provider APIs (e.g. SEC), and the open web (web_search / web_fetch). Every entry is a
 *  clickable link. */
function SourcesPanel({ articles, urls }: { articles: ArticleOut[]; urls: string[] }) {
  const filings = urls.filter(isFilingUrl);
  const web = urls.filter((u) => !isFilingUrl(u));
  if (articles.length === 0 && urls.length === 0) {
    return (
      <Section title="Sources">
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>No sources cited yet.</p>
      </Section>
    );
  }
  return (
    <Section title="Sources">
      {articles.length > 0 && (
        <div>
          <p className="terminal-label mb-1">From the watch database</p>
          <ArticleList articles={articles} />
        </div>
      )}
      {filings.length > 0 && (
        <div className="mt-3">
          <p className="terminal-label mb-1">Filings &amp; APIs</p>
          <SourceChips urls={filings} />
        </div>
      )}
      {web.length > 0 && (
        <div className="mt-3">
          <p className="terminal-label mb-1">Web search</p>
          <SourceChips urls={web} />
        </div>
      )}
    </Section>
  );
}

/** The right Agent panel — strictly agent state. With no session selected it shows the live
 *  narrator + the active session's telemetry + the weekly budget. Selecting a session swaps in its
 *  full trace (findings, tasks, sources, the direction levers). */
export function AgentPanel({
  selectedId,
  onClose,
  onSelectSession,
}: {
  selectedId: number | null;
  onClose: () => void;
  onSelectSession: (id: number | null) => void;
}) {
  if (selectedId != null) {
    return <SessionDetail stateId={selectedId} onClose={onClose} />;
  }
  return <LiveState onSelectSession={onSelectSession} />;
}

/** Compact telemetry cell grid. */
function TelemetryGrid({ cells }: { cells: [string, string][] }) {
  return (
    <div className="grid grid-cols-3 gap-px" style={{ background: "var(--border-default)" }}>
      {cells.map(([label, value]) => (
        <div key={label} className="px-2 py-1.5" style={{ background: "var(--surface-panel)" }}>
          <div className="terminal-label" style={{ fontSize: "0.5625rem" }}>{label}</div>
          <div className="font-data text-sm" style={{ color: "var(--text-strong)" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function Telemetry({ progress }: { progress: ProgressOut }) {
  return (
    <TelemetryGrid
      cells={[
        ["turn", progress.max_iters ? `${progress.iteration}/${progress.max_iters}` : `${progress.iteration}`],
        ["tools", String(progress.tool_calls)],
        ["sources", String(progress.sources)],
        ["in", fmtTokens(progress.input_tokens)],
        ["out", fmtTokens(progress.output_tokens)],
      ]}
    />
  );
}

function fmtElapsedMs(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000));
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

type SessionData = NonNullable<ReturnType<typeof useResearchDetail>["data"]>;

/** Full-trace telemetry for a session — works closed (summed from its tasks + sources + timing) or
 *  live (from the running progress). The transparency layer the right panel exists for. */
function SessionTelemetry({ s }: { s: SessionData }) {
  const tasks = s.tasks ?? [];
  const p = s.progress;
  // "tokens in" is the full prompt volume — fresh input plus the cached read/write the provider
  // bills separately; counting only `input` undercounts a cache-heavy run by orders of magnitude.
  const sumIn = tasks.reduce(
    (n, t) => n + (t.token_usage?.input ?? 0) + (t.token_usage?.cache_read ?? 0) + (t.token_usage?.cache_write ?? 0),
    0,
  );
  const sumOut = tasks.reduce((n, t) => n + (t.token_usage?.output ?? 0), 0);
  const toolUses = tasks.reduce(
    (n, t) => n + Object.values(t.token_usage?.web_tool_uses ?? {}).reduce((a, b) => a + b, 0),
    0,
  );
  const sources = (s.source_articles?.length ?? 0) + (s.source_urls?.length ?? 0);
  const endIso = s.status === "closed" ? s.closed_at ?? s.last_active_at : s.last_active_at;
  const elapsed = fmtElapsedMs(+new Date(endIso) - +new Date(s.opened_at));
  return (
    <TelemetryGrid
      cells={[
        [p ? "turn" : "tasks", p?.max_iters ? `${p.iteration}/${p.max_iters}` : p ? `${p.iteration}` : `${tasks.length}`],
        ["tools", String(p?.tool_calls || toolUses)],
        ["sources", String(p?.sources || sources)],
        ["tokens in", fmtTokens(p?.input_tokens || sumIn)],
        ["tokens out", fmtTokens(p?.output_tokens || sumOut)],
        ["elapsed", elapsed],
      ]}
    />
  );
}

// The breadth automation never stops, even while the researcher rests (PROJECT.md §2–3): the
// scraper sweeps, cheap models synthesize sections, financials rescore. This feed is that
// heartbeat — what keeps the world fresh between deep sessions.
const TASK_LABEL: Record<string, string> = {
  news_ingest: "News sweep",
  section_synthesis: "World synthesis",
  deep_research: "Deep research",
  followup: "Follow-up research",
  company_rescore: "Company rescore",
  prose_regeneration: "Prose refresh",
  significance_recheck: "Significance recheck",
  daily_digest: "Daily digest",
  market_pulse: "Market pulse",
};

function taskLabel(type: string): string {
  return TASK_LABEL[type] ?? type.replace(/_/g, " ");
}

/** A short human result from a task's counts — "12 fetched · 3 deduped", "4 domains · 1 industry",
 *  "promoted 1". Falls back to any non-zero counts; empty when there's nothing worth saying. */
function taskHint(t: TaskOut): string {
  const c = t.counts ?? {};
  if (t.type === "news_ingest") {
    if ((c.fetched ?? 0) > 0) {
      const bits = [`${c.fetched} fetched`];
      if (c.deduped) bits.push(`${c.deduped} deduped`);
      if (c.dropped_low_relevance) bits.push(`${c.dropped_low_relevance} dropped`);
      return bits.join(" · ");
    }
    if (t.status === "succeeded") return "nothing new cleared the bar";
  }
  if (t.type === "section_synthesis") {
    const d = c.domain_sections ?? 0;
    const i = c.industry_sections ?? 0;
    const bits: string[] = [];
    if (d) bits.push(`${d} domain${d === 1 ? "" : "s"}`);
    if (i) bits.push(`${i} ${i === 1 ? "industry" : "industries"}`);
    return bits.join(" · ");
  }
  if (t.type === "deep_research" && c.promoted) return `promoted ${c.promoted} finding${c.promoted === 1 ? "" : "s"}`;
  if (t.type === "company_rescore" && c.companies) return `${c.companies} companies`;
  return Object.entries(c)
    .filter(([, v]) => v)
    .map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`)
    .join(" · ");
}

function StatusDot({ status }: { status: string }) {
  const color = status === "failed" ? "var(--red-500)" : "var(--accent)";
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === "running" ? "asa-pulse" : ""}`}
      style={{ background: color, opacity: status === "succeeded" ? 0.65 : 1 }}
    />
  );
}

function AutomationFeed() {
  const activity = useActivity();
  const running = activity.data?.running ?? [];
  const recent = activity.data?.recent ?? [];
  const rows = [...running, ...recent].slice(0, 7);
  if (activity.isLoading) return <p className="text-sm" style={{ color: "var(--text-dim)" }}>—</p>;
  if (rows.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-dim)" }}>No runs recorded yet.</p>;
  }
  return (
    <ul>
      {rows.map((t) => {
        const hint = taskHint(t);
        const when =
          t.status === "running" ? "now" : timeAgo(t.completed_at ?? t.started_at ?? "");
        return (
          <li key={t.id} className="py-1.5" style={{ borderTop: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <StatusDot status={t.status} />
              <span
                className="text-sm"
                style={{ color: t.status === "failed" ? "var(--text-muted)" : "var(--text-strong)" }}
              >
                {taskLabel(t.type)}
              </span>
              {t.status === "failed" && (
                <span className="font-data text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--red-500)" }}>
                  failed
                </span>
              )}
              <span className="ml-auto font-data text-[11px] tnum" style={{ color: "var(--text-dim)" }}>
                {when}
              </span>
            </div>
            {hint && (
              <p className="mt-0.5 pl-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {hint}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A flat at-rest section: caps label over content, separated from the previous section by a single
 *  hairline rule across the panel — no card border or fill (the rail itself is the surface). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className="border-t px-4 py-4 first:border-t-0"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div className="terminal-label mb-2.5">{title}</div>
      {children}
    </section>
  );
}

function LiveState({ onSelectSession }: { onSelectSession: (id: number) => void }) {
  const open = useResearchList("open");
  const budget = useBudget();
  // The most recently active open session is "what the agent is doing now".
  const active = [...(open.data ?? [])].sort(
    (a, b) => +new Date(b.last_active_at) - +new Date(a.last_active_at),
  )[0];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Section title="Working now">
        <AgentStatus phrases={active?.progress ? progressPhrases(active.progress) : []} />
        {active && (
          <>
            <button
              type="button"
              onClick={() => onSelectSession(active.state_id)}
              className="mt-2 block w-full truncate text-left text-sm hover:underline"
              style={{ color: "var(--text-strong)" }}
            >
              {active.topic}
            </button>
            {active.progress && (
              <div className="mt-2">
                <Telemetry progress={active.progress} />
              </div>
            )}
          </>
        )}
      </Section>

      <Section title="Weekly token budget">
        {budget.data ? (
          <BudgetGauge budget={budget.data} />
        ) : (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>—</p>
        )}
        <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
          The agent paces itself against this — it stops deep work as it approaches the cap.
        </p>
      </Section>

      <Section title="Automation">
        <p className="mb-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
          The breadth sensor net keeps running while the researcher rests.
        </p>
        <AutomationFeed />
      </Section>
    </div>
  );
}

function SessionDetail({ stateId, onClose }: { stateId: number; onClose: () => void }) {
  const detail = useResearchDetail(stateId);
  const close = useCloseResearch(stateId);
  const redirect = useRedirectResearch(stateId);
  const [redirectTopic, setRedirectTopic] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className="flex h-10 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
      >
        <span className="terminal-label">Research session</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-sm hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-muted)" }}
          title="Back to live state"
        >
          <CloseIcon size={14} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {detail.isLoading && <p className="terminal-label px-4 py-4">Loading…</p>}
        {detail.isError && <p className="px-4 py-4 text-sm" style={{ color: "var(--red-500)" }}>Session not found.</p>}
        {detail.data &&
          (() => {
            const s = detail.data;
            const stalled = s.status === "open" && isStalled(s.last_active_at);
            return (
              <>
                <div className="px-4 pb-3 pt-3.5">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>
                    {s.topic}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <OriginBadge initiatedBy={s.initiated_by} />
                    <StatusPill status={s.status} />
                    <FreshnessStamp
                      iso={s.status === "closed" ? s.closed_at : s.last_active_at}
                      label={s.status === "closed" ? "closed" : "active"}
                      stalled={stalled}
                    />
                  </div>
                </div>

                <Section title="Telemetry">
                  <SessionTelemetry s={s} />
                </Section>

                {(s.current_task || s.progress) && (
                  <Section title="Working now">
                    {s.current_task && (
                      <p className="text-sm" style={{ color: "var(--text-body)" }}>{s.current_task}</p>
                    )}
                    {s.progress && (
                      <div className={s.current_task ? "mt-2" : ""}>
                        <AgentStatus phrases={progressPhrases(s.progress)} />
                      </div>
                    )}
                  </Section>
                )}

                <Section title="Findings">
                  {s.findings ? (
                    <Prose serif>{s.findings}</Prose>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                      Nothing flushed yet — findings appear as the agent finishes tasks.
                    </p>
                  )}
                </Section>

                {s.open_questions && (
                  <Section title="Open questions">
                    <Prose>{s.open_questions}</Prose>
                  </Section>
                )}

                {s.status === "open" && (
                  <Section title="Steer">
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const t = redirectTopic.trim();
                        if (!t) return;
                        redirect.mutate({ topic: t });
                        setRedirectTopic("");
                      }}
                    >
                      <input
                        value={redirectTopic}
                        onChange={(e) => setRedirectTopic(e.target.value)}
                        placeholder="Steer this session toward…"
                        className="min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
                        style={{ background: "var(--surface-inset)", border: "1px solid var(--border-strong)", color: "var(--text-strong)" }}
                      />
                      <button
                        type="submit"
                        disabled={redirect.isPending || !redirectTopic.trim()}
                        className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                        style={{ border: "1px solid var(--border-strong)", color: "var(--text-body)" }}
                      >
                        Redirect
                      </button>
                    </form>
                    {redirect.isSuccess && (
                      <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>Queued — picked up on the next turn.</p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => close.mutate(true)}
                        disabled={close.isPending}
                        className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                        style={{ border: "1px solid var(--border-strong)", color: "var(--text-body)" }}
                      >
                        {close.isPending ? "Closing…" : "Close & promote"}
                      </button>
                    </div>
                  </Section>
                )}

                <SourcesPanel articles={s.source_articles ?? []} urls={s.source_urls ?? []} />

                <Section title="Task trail">
                  <TaskList tasks={s.tasks ?? []} empty="No tasks recorded for this session yet." />
                </Section>
              </>
            );
          })()}
      </div>
    </div>
  );
}
