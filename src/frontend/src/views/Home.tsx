import { Link } from "react-router-dom";

import { useActivity, useBudget, useDigest, useResearchList } from "../api/queries";
import { BudgetGauge } from "../components/BudgetGauge";
import { EmptyState, Loading } from "../components/EmptyState";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { Prose } from "../components/Prose";
import { SnapshotCard } from "../components/SnapshotCard";
import { StatusPill } from "../components/StatusPill";
import { TaskList } from "../components/TaskList";

/** Agent state at a glance: what it's doing, what it found, what it costs. */
export function Home() {
  const activity = useActivity();
  const budget = useBudget();
  const digest = useDigest();
  const openSessions = useResearchList("open");
  const recentClosed = useResearchList("closed", 5);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Home</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SnapshotCard title="Working now">
            {activity.isLoading ? (
              <Loading />
            ) : (
              <TaskList
                tasks={activity.data?.running ?? []}
                empty="Idle — watching breadth signals; deep work resumes when something is material."
              />
            )}
          </SnapshotCard>

          <SnapshotCard
            title="Today's digest"
            aside={digest.data && <FreshnessStamp iso={digest.data.generated_at} label="generated" />}
          >
            {digest.isLoading ? (
              <Loading />
            ) : digest.data ? (
              <div className="space-y-3">
                {digest.data.top_snapshot && <Prose>{digest.data.top_snapshot}</Prose>}
                {digest.data.sections.map((s) => (
                  <div key={s.section_title} className="border-l-2 border-neutral-200 pl-3">
                    <h3 className="text-sm font-semibold text-neutral-700">{s.section_title}</h3>
                    <Prose>{s.snapshot}</Prose>
                    {s.key_tickers.length > 0 && (
                      <div className="mt-1 flex gap-1.5">
                        {s.key_tickers.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-neutral-100 px-1 font-mono text-xs text-neutral-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No digest yet." hint="The daily digest lands at 11:00 UTC." />
            )}
          </SnapshotCard>

          <SnapshotCard title="Recent activity">
            {activity.isLoading ? (
              <Loading />
            ) : (
              <TaskList tasks={activity.data?.recent ?? []} empty="No completed tasks yet." />
            )}
          </SnapshotCard>
        </div>

        <div className="space-y-4">
          {budget.data && (
            <SnapshotCard title="Cost">
              <BudgetGauge budget={budget.data} />
            </SnapshotCard>
          )}

          <SnapshotCard title="Open research">
            {openSessions.isLoading ? (
              <Loading />
            ) : (openSessions.data ?? []).length > 0 ? (
              <ul className="space-y-2">
                {(openSessions.data ?? []).map((s) => (
                  <li key={s.state_id}>
                    <Link
                      to={`/research/${s.state_id}`}
                      className="block rounded-md border border-neutral-100 p-2 hover:border-neutral-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{s.topic}</span>
                        <StatusPill status={s.status} />
                      </div>
                      {s.current_task && (
                        <p className="mt-0.5 truncate text-xs text-neutral-500">{s.current_task}</p>
                      )}
                      <FreshnessStamp iso={s.last_active_at} label="active" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-400">No open sessions — the agent is resting.</p>
            )}
          </SnapshotCard>

          <SnapshotCard title="Latest findings">
            {recentClosed.isLoading ? (
              <Loading />
            ) : (recentClosed.data ?? []).length > 0 ? (
              <ul className="space-y-2">
                {(recentClosed.data ?? []).map((s) => (
                  <li key={s.state_id}>
                    <Link
                      to={`/research/${s.state_id}`}
                      className="block rounded-md p-1.5 hover:bg-neutral-50"
                    >
                      <span className="line-clamp-1 text-sm text-neutral-800">{s.topic}</span>
                      <FreshnessStamp iso={s.closed_at} label="closed" thresholdHours={72} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-400">Nothing closed yet.</p>
            )}
          </SnapshotCard>
        </div>
      </div>
    </div>
  );
}
