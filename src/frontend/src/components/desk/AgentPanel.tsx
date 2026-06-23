import { useState } from "react";

import {
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
import { Panel } from "../Panel";
import { Prose } from "../Prose";
import { SourceChips } from "../SourceChips";
import { StatusPill } from "../StatusPill";
import { TaskList } from "../TaskList";
import { CloseIcon } from "../Icons";
import { progressPhrases } from "./agentPhrases";
import { fmtTokens } from "../../lib/format";
import { isStalled } from "../../lib/freshness";
import type { ProgressOut } from "../../api/types";

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

function Telemetry({ progress }: { progress: ProgressOut }) {
  const cells: [string, string][] = [
    ["turn", progress.max_iters ? `${progress.iteration}/${progress.max_iters}` : `${progress.iteration}`],
    ["tools", String(progress.tool_calls)],
    ["sources", String(progress.sources)],
    ["in", fmtTokens(progress.input_tokens)],
    ["out", fmtTokens(progress.output_tokens)],
  ];
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

function LiveState({ onSelectSession }: { onSelectSession: (id: number) => void }) {
  const open = useResearchList("open");
  const budget = useBudget();
  // The most recently active open session is "what the agent is doing now".
  const active = [...(open.data ?? [])].sort(
    (a, b) => +new Date(b.last_active_at) - +new Date(a.last_active_at),
  )[0];

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
      <Panel title="Working now">
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
      </Panel>

      <Panel title="Weekly token budget">
        {budget.data ? (
          <BudgetGauge budget={budget.data} />
        ) : (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>—</p>
        )}
        <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
          The agent paces itself against this — it stops deep work as it approaches the cap.
        </p>
      </Panel>
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

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {detail.isLoading && <p className="terminal-label">Loading…</p>}
        {detail.isError && <p className="text-sm" style={{ color: "var(--red-500)" }}>Session not found.</p>}
        {detail.data &&
          (() => {
            const s = detail.data;
            const stalled = s.status === "open" && isStalled(s.last_active_at);
            return (
              <>
                <div>
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

                {(s.current_task || s.progress) && (
                  <Panel title="Working now">
                    {s.current_task && (
                      <p className="text-sm" style={{ color: "var(--text-body)" }}>{s.current_task}</p>
                    )}
                    {s.progress && (
                      <div className={s.current_task ? "mt-2" : ""}>
                        <AgentStatus phrases={progressPhrases(s.progress)} />
                        <div className="mt-2">
                          <Telemetry progress={s.progress} />
                        </div>
                      </div>
                    )}
                  </Panel>
                )}

                <Panel title="Findings">
                  {s.findings ? (
                    <Prose>{s.findings}</Prose>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                      Nothing flushed yet — findings appear as the agent finishes tasks.
                    </p>
                  )}
                </Panel>

                {s.open_questions && (
                  <Panel title="Open questions">
                    <Prose>{s.open_questions}</Prose>
                  </Panel>
                )}

                {s.status === "open" && (
                  <Panel title="Steer">
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
                  </Panel>
                )}

                <Panel title="Source articles">
                  <ArticleList articles={s.source_articles ?? []} />
                  <SourceChips urls={s.source_urls ?? []} />
                </Panel>

                <Panel title="Task trail">
                  <TaskList tasks={s.tasks ?? []} empty="No tasks recorded for this session yet." />
                </Panel>
              </>
            );
          })()}
      </div>
    </div>
  );
}
