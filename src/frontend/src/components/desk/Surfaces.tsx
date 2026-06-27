import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { useMutationState } from "@tanstack/react-query";

import {
  CHAT_SEND_KEY,
  useChatMessages,
  useCompanies,
  useEvents,
  useIndustries,
  useInbox,
  useInboxAction,
  useOpenResearch,
  useOpsSweep,
  useResearchList,
  useSendChat,
} from "../../api/queries";
import { ArticleRow } from "../ArticleRow";
import { EmptyState, Loading } from "../EmptyState";
import { FreshnessStamp } from "../FreshnessStamp";
import { ChevronRight } from "../Icons";
import { Prose } from "../Prose";
import { SourceChips } from "../SourceChips";
import { fmtDateTime } from "../../lib/format";
import type { ResearchSessionOut } from "../../api/types";

/** Shared left-panel chrome: a caps title on a hairline, then a scrollable body. */
export function SurfaceFrame({
  title,
  children,
  footer,
  action,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className="flex h-11 shrink-0 items-center px-4"
        style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
      >
        <span className="text-[15px] font-semibold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>
          {title}
        </span>
        {action && <span className="ml-auto">{action}</span>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
      {footer && (
        <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--border-default)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}

const rowClass =
  "block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]";

// --- Watchlist & industries --------------------------------------------------

export function WatchlistSurface({
  onPickCompany,
  onPickIndustry,
}: {
  onPickCompany: (id: number) => void;
  onPickIndustry: (id: number) => void;
}) {
  const watchlist = useCompanies("watchlist");
  const industries = useIndustries();

  return (
    <SurfaceFrame title="Watchlist & industries">
      <p className="terminal-label mb-1.5">Watchlist</p>
      {watchlist.isLoading ? (
        <Loading />
      ) : (watchlist.data ?? []).length > 0 ? (
        <ul>
          {(watchlist.data ?? []).map((c) => (
            <li key={c.company_id}>
              <button type="button" className={rowClass} onClick={() => onPickCompany(c.company_id)}>
                <span className="flex items-center gap-2">
                  <span className="font-data text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
                    {c.ticker}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--text-body)" }}>
                    {c.name}
                  </span>
                  {c.sector && (
                    <span className="shrink-0 text-xs" style={{ color: "var(--text-dim)" }}>
                      {c.sector}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2.5 text-sm" style={{ color: "var(--text-dim)" }}>
          Watchlist is empty — deep scoring runs only on the watchlist.
        </p>
      )}

      <p className="terminal-label mb-1.5 mt-4">Industries</p>
      {industries.isLoading ? (
        <Loading />
      ) : (industries.data ?? []).length > 0 ? (
        <ul>
          {(industries.data ?? []).map((i) => (
            <li key={i.industry_id}>
              <button type="button" className={rowClass} onClick={() => onPickIndustry(i.industry_id)}>
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="text-sm" style={{ color: "var(--text-body)" }}>{i.name}</span>
                    {i.description && (
                      <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                        {i.description}
                      </span>
                    )}
                  </span>
                  {i.flagged && (
                    <span className="shrink-0 terminal-label" style={{ color: "var(--accent)" }}>
                      critical
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2.5 text-sm" style={{ color: "var(--text-dim)" }}>
          No industries seeded yet.
        </p>
      )}
    </SurfaceFrame>
  );
}

// --- Research sessions -------------------------------------------------------

function fmtSessionWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  return `${date} · ${time}`;
}

function fmtElapsed(fromIso: string, toIso: string): string {
  const secs = Math.max(0, Math.floor((+new Date(toIso) - +new Date(fromIso)) / 1000));
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

/** The single live session, surfaced at the top — a pulsing "active research" mark, the topic, and a
 *  one-line telemetry read (turn · sources · elapsed). */
function ActiveSession({ session, onSelect }: { session: ResearchSessionOut; onSelect: (id: number) => void }) {
  const p = session.progress;
  const elapsed = fmtElapsed(session.opened_at, session.last_active_at);
  return (
    <button type="button" onClick={() => onSelect(session.state_id)} className="block w-full text-left">
      <span className="mb-1.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full asa-pulse" style={{ background: "var(--accent)" }} />
        <span className="terminal-label" style={{ color: "var(--accent)" }}>Active research</span>
      </span>
      <span className="block text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>
        {session.topic}
      </span>
      <span className="mt-1 block font-data text-[11px]" style={{ color: "var(--text-muted)" }}>
        {p
          ? `turn ${p.iteration}/${p.max_iters} · ${p.sources} source${p.sources === 1 ? "" : "s"} · ${elapsed}`
          : `running · ${elapsed}`}
      </span>
    </button>
  );
}

/** A session row in the list — title + chevron, then a clean status·date·time meta line. The full
 *  findings render in the right Agent panel, never as a markdown dump here. */
function SessionRow({ session, onSelect }: { session: ResearchSessionOut; onSelect: (id: number) => void }) {
  const closed = session.status === "closed";
  const when = closed ? session.closed_at ?? session.last_active_at : session.last_active_at;
  return (
    <button
      type="button"
      onClick={() => onSelect(session.state_id)}
      className="group block w-full rounded-md px-1.5 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>
          {session.topic}
        </span>
        <ChevronRight size={14} className="mt-0.5 shrink-0 opacity-30 transition-opacity group-hover:opacity-70" style={{ color: "var(--text-muted)" }} />
      </span>
      <span className="mt-1 flex items-center gap-1.5 font-data text-[11px]" style={{ color: "var(--text-dim)" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: closed ? "var(--text-muted)" : "var(--accent)" }} />
        <span>{closed ? "done" : "open"}</span>
        <span>· {fmtSessionWhen(when)}</span>
      </span>
    </button>
  );
}

export function ResearchSurface({
  onSelect,
  draft,
  setDraft,
}: {
  onSelect: (id: number) => void;
  draft: string;
  setDraft: (s: string) => void;
}) {
  const open = useResearchList("open");
  const closed = useResearchList("closed", 30);
  const openResearch = useOpenResearch();
  const openList = open.data ?? [];
  const closedList = closed.data ?? [];
  const total = openList.length + closedList.length;
  // The most recently active open session leads as "active now"; everything else is the log.
  const sortByActive = (a: ResearchSessionOut, b: ResearchSessionOut) =>
    +new Date(b.last_active_at) - +new Date(a.last_active_at);
  const active = [...openList].sort(sortByActive)[0] ?? null;
  const rest = [...openList.filter((s) => s !== active), ...closedList].sort(sortByActive);

  const start = () => {
    const t = draft.trim();
    if (!t || openResearch.isPending) return;
    openResearch.mutate({ topic: t }, { onSuccess: (res) => { setDraft(""); onSelect(res.state_id); } });
  };

  return (
    <SurfaceFrame
      title="Research"
      action={
        <span className="font-data text-[11px]" style={{ color: "var(--text-dim)" }}>
          {total} session{total === 1 ? "" : "s"}
        </span>
      }
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Open a research session…"
            className="min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
            style={{ background: "var(--surface-inset)", border: "1px solid var(--border-strong)", color: "var(--text-strong)" }}
          />
          <button
            type="submit"
            disabled={openResearch.isPending || !draft.trim()}
            className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            {openResearch.isPending ? "…" : "Research"}
          </button>
        </form>
      }
    >
      {active && (
        <section className="mb-5 px-1.5">
          <p className="terminal-label mb-2">Active now</p>
          <ActiveSession session={active} onSelect={onSelect} />
        </section>
      )}

      <p className="terminal-label mb-1 px-1.5">Sessions</p>
      {open.isLoading ? (
        <Loading />
      ) : rest.length === 0 ? (
        <p className="px-1.5 py-1 text-sm" style={{ color: "var(--text-dim)" }}>
          {active
            ? "No other sessions yet."
            : "Nothing yet. The agent opens its own when breadth surfaces something material."}
        </p>
      ) : (
        <ul>
          {rest.map((s) => (
            <li key={s.state_id}>
              <SessionRow session={s} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </SurfaceFrame>
  );
}

// --- Chat --------------------------------------------------------------------

export function ChatSurface({
  draft,
  setDraft,
  askRef,
  onSelectSession,
}: {
  draft: string;
  setDraft: (s: string) => void;
  askRef: RefObject<HTMLInputElement | null>;
  onSelectSession: (id: number) => void;
}) {
  const messages = useChatMessages();
  const send = useSendChat();
  const openResearch = useOpenResearch();
  const bottomRef = useRef<HTMLDivElement>(null);

  const pendingAsks = useMutationState({
    filters: { mutationKey: [CHAT_SEND_KEY], status: "pending" },
    select: (m) => (m.state.variables as { content: string }).content,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length, pendingAsks.length]);

  const submit = () => {
    const content = draft.trim();
    if (!content || send.isPending) return;
    setDraft("");
    send.mutate({ content });
  };

  const goDeeper = (topic: string) =>
    openResearch.mutate({ topic }, { onSuccess: (res) => onSelectSession(res.state_id) });

  return (
    <SurfaceFrame
      title="Chat"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <input
            ref={askRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the researcher…"
            className="min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
            style={{ background: "var(--surface-inset)", border: "1px solid var(--border-strong)", color: "var(--text-strong)" }}
          />
          <button
            type="submit"
            disabled={send.isPending || !draft.trim()}
            className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Send
          </button>
        </form>
      }
    >
      {(messages.data ?? []).length === 0 && pendingAsks.length === 0 && (
        <p className="px-1 text-sm" style={{ color: "var(--text-dim)" }}>
          Ask anything the agent watches. Answers cite their sources; "go deeper" opens a bounded
          research session in the Agent panel.
        </p>
      )}
      <div className="space-y-3">
        {(messages.data ?? []).map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className="max-w-[88%] rounded-md px-2.5 py-1.5"
              style={
                m.role === "user"
                  ? { background: "var(--accent)", color: "var(--on-accent)" }
                  : { background: "var(--surface-hover)", color: "var(--text-strong)" }
              }
            >
              {m.role === "assistant" ? (
                <Prose>{m.content}</Prose>
              ) : (
                <p className="prose-snapshot text-sm leading-relaxed">{m.content}</p>
              )}
              {m.role === "assistant" && <SourceChips urls={m.source_urls ?? []} />}
              {m.role === "assistant" && m.suggest_deeper && m.deeper_topic && (
                <button
                  type="button"
                  onClick={() => goDeeper(m.deeper_topic as string)}
                  disabled={openResearch.isPending}
                  className="mt-1.5 block rounded-md px-2 py-1 text-xs font-medium hover:underline disabled:opacity-50"
                  style={{ background: "var(--signal-soft)", color: "var(--accent-hover)" }}
                  title="Open a bounded research session on this"
                >
                  the agent suggests digging deeper →
                </button>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: "var(--text-dim)" }}>
                <span>{fmtDateTime(m.created_at)}</span>
                {m.role === "user" && (
                  <button
                    type="button"
                    onClick={() => goDeeper(m.content)}
                    disabled={openResearch.isPending}
                    className="font-medium hover:underline disabled:opacity-50"
                    style={{ color: "var(--accent)" }}
                  >
                    go deeper →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {pendingAsks.map((content, i) => (
          <div key={`pending-${i}`} className="flex justify-end">
            <div className="max-w-[88%] rounded-md px-2.5 py-1.5 opacity-70" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
              <p className="prose-snapshot text-sm leading-relaxed">{content}</p>
              <span className="mt-1 block text-xs" style={{ color: "color-mix(in oklch, var(--on-accent) 55%, transparent)" }}>sending…</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </SurfaceFrame>
  );
}

// --- News & events -----------------------------------------------------------

const CHANNEL_LABEL: Record<string, string> = {
  in_app: "in-app",
  email: "email",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
};

// The four surveillance domains, in the fixed top-down order /world renders, with section titles.
const NEWS_DOMAINS: [key: string, title: string][] = [
  ["geopolitics", "Geopolitics & global events"],
  ["macro", "Macroeconomics"],
  ["industry", "Industry trends"],
  ["market", "General market"],
];

export function NewsSurface() {
  const [tab, setTab] = useState<"events" | "deliveries">("events");
  const sweep = useOpsSweep();

  return (
    <SurfaceFrame
      title="News & events"
      action={
        <button
          type="button"
          onClick={() => sweep.mutate()}
          disabled={sweep.isPending}
          className="rounded px-1.5 py-0.5 text-xs font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50"
          style={{ color: "var(--accent)" }}
          title="Run a news sweep now (the scraper pulls + classifies the latest events)"
        >
          {sweep.isPending ? "sweeping…" : "sweep now"}
        </button>
      }
    >
      <div className="mb-2 flex gap-1">
        {(["events", "deliveries"] as const).map((id) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="rounded px-2 py-0.5 text-xs font-medium capitalize"
              style={{
                color: on ? "var(--accent)" : "var(--text-muted)",
                background: on ? "var(--signal-soft)" : "transparent",
              }}
            >
              {id}
            </button>
          );
        })}
      </div>
      {tab === "events" ? <EventsStream /> : <Deliveries />}
    </SurfaceFrame>
  );
}

/** The flat cross-domain stream, grouped into distinct per-domain sections. */
function EventsStream() {
  const events = useEvents();
  const rows = events.data ?? [];
  if (events.isLoading) return <Loading />;
  if (rows.length === 0) {
    return <EmptyState message="No events yet." hint="Run a sweep to pull the latest news." />;
  }
  return (
    <div className="space-y-4">
      {NEWS_DOMAINS.map(([key, title]) => {
        const inDomain = rows.filter((r) => r.domain === key);
        if (inDomain.length === 0) return null;
        return (
          <section key={key}>
            <p className="terminal-label mb-1">{title}</p>
            {inDomain.map((a) => (
              <ArticleRow key={a.news_event_id} article={a} showDomain={false} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** Delivered notifications (digest / brief / alert mirrors) — the inbox. */
function Deliveries() {
  const inbox = useInbox();
  const markRead = useInboxAction("read");
  const dismiss = useInboxAction("dismiss");
  const items = (inbox.data ?? []).filter((n) => !n.dismissed_at);

  if (inbox.isLoading) return <Loading />;
  if (items.length === 0) {
    return <EmptyState message="Nothing yet." hint="Digest, brief, and alert deliveries mirror here." />;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((n) => {
        const unread = !n.read_at;
        return (
          <li
            key={n.id}
            className="rounded-md p-2.5"
            style={{ border: "1px solid var(--border-default)", background: unread ? "var(--signal-soft)" : "var(--surface-panel)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {unread && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
                  <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                    {n.title ?? n.template ?? n.ref_type ?? "notification"}
                  </span>
                  <span className="terminal-label">{CHANNEL_LABEL[n.channel] ?? n.channel}</span>
                </div>
                {n.body && (
                  <p className="prose-snapshot mt-1 line-clamp-4 text-sm" style={{ color: "var(--text-body)" }}>
                    {n.body}
                  </p>
                )}
                <span className="mt-1 block">
                  <FreshnessStamp iso={n.sent_at} label="sent" thresholdHours={48} />
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                {unread && (
                  <button type="button" onClick={() => markRead.mutate(n.id)} className="rounded px-1.5 py-0.5 text-xs hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-muted)" }}>
                    read
                  </button>
                )}
                <button type="button" onClick={() => dismiss.mutate(n.id)} className="rounded px-1.5 py-0.5 text-xs hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-muted)" }}>
                  dismiss
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
