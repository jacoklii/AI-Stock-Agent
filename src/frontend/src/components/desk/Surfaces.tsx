import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { useMutationState } from "@tanstack/react-query";

import {
  CHAT_SEND_KEY,
  useChatMessages,
  useCompanies,
  useIndustries,
  useInbox,
  useInboxAction,
  useOpenResearch,
  useOpsSweep,
  useResearchList,
  useSendChat,
} from "../../api/queries";
import { EmptyState, Loading } from "../EmptyState";
import { FreshnessStamp } from "../FreshnessStamp";
import { OriginBadge } from "../OriginBadge";
import { Prose } from "../Prose";
import { SourceChips } from "../SourceChips";
import { StatusPill } from "../StatusPill";
import { AgentStatus } from "../AgentStatus";
import { progressPhrases } from "./agentPhrases";
import { fmtDateTime } from "../../lib/format";
import { isStalled } from "../../lib/freshness";
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
        className="flex h-10 shrink-0 items-center px-4"
        style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
      >
        <span className="terminal-label">{title}</span>
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
                    <span className="shrink-0 terminal-label" style={{ color: "var(--amber-500)" }}>
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

function SessionRow({ session, onSelect }: { session: ResearchSessionOut; onSelect: (id: number) => void }) {
  const stalled = session.status === "open" && isStalled(session.last_active_at);
  return (
    <button type="button" className={rowClass} onClick={() => onSelect(session.state_id)}>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm" style={{ color: "var(--text-strong)" }}>{session.topic}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <OriginBadge initiatedBy={session.initiated_by} />
          <StatusPill status={session.status} />
        </span>
      </span>
      {session.status === "open" && session.progress ? (
        <span className="mt-1 block">
          <AgentStatus phrases={progressPhrases(session.progress)} />
        </span>
      ) : (
        session.findings && (
          <span className="mt-1 line-clamp-2 block text-xs" style={{ color: "var(--text-muted)" }}>
            {session.findings}
          </span>
        )
      )}
      <span className="mt-1 block">
        <FreshnessStamp
          iso={session.status === "closed" ? session.closed_at : session.last_active_at}
          label={session.status === "closed" ? "closed" : "active"}
          thresholdHours={session.status === "closed" ? 168 : 24}
          stalled={stalled}
        />
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

  const start = () => {
    const t = draft.trim();
    if (!t || openResearch.isPending) return;
    openResearch.mutate({ topic: t }, { onSuccess: (res) => { setDraft(""); onSelect(res.state_id); } });
  };

  return (
    <SurfaceFrame
      title="Research"
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
            style={{ background: "var(--accent)", color: "var(--paper-0)" }}
          >
            {openResearch.isPending ? "…" : "Research"}
          </button>
        </form>
      }
    >
      <p className="terminal-label mb-1.5">Open ({open.data?.length ?? 0} / 3)</p>
      {open.isLoading ? (
        <Loading />
      ) : (open.data ?? []).length > 0 ? (
        <ul className="space-y-0.5">
          {(open.data ?? []).map((s) => (
            <li key={s.state_id}>
              <SessionRow session={s} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2.5 text-sm" style={{ color: "var(--text-dim)" }}>
          Nothing open. The agent opens its own when breadth surfaces something material.
        </p>
      )}

      <p className="terminal-label mb-1.5 mt-4">Closed</p>
      {(closed.data ?? []).length > 0 ? (
        <ul className="space-y-0.5">
          {(closed.data ?? []).map((s) => (
            <li key={s.state_id}>
              <SessionRow session={s} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2.5 text-sm" style={{ color: "var(--text-dim)" }}>No closed sessions yet.</p>
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
            style={{ background: "var(--accent)", color: "var(--paper-0)" }}
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
                  ? { background: "var(--ink-1)", color: "var(--paper-0)" }
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
            <div className="max-w-[88%] rounded-md px-2.5 py-1.5 opacity-70" style={{ background: "var(--ink-1)", color: "var(--paper-0)" }}>
              <p className="prose-snapshot text-sm leading-relaxed">{content}</p>
              <span className="mt-1 block text-xs" style={{ color: "var(--paper-200)" }}>sending…</span>
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

export function NewsSurface() {
  const inbox = useInbox();
  const markRead = useInboxAction("read");
  const dismiss = useInboxAction("dismiss");
  const sweep = useOpsSweep();
  const items = (inbox.data ?? []).filter((n) => !n.dismissed_at);

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
      {inbox.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState message="Nothing yet." hint="Digest, brief, and alert deliveries mirror here." />
      ) : (
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
      )}
    </SurfaceFrame>
  );
}
