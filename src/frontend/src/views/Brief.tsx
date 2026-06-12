import { useBriefLatest, useBriefState, useRunBrief } from "../api/queries";
import { FreshnessStamp } from "../components/FreshnessStamp";
import { SnapshotCard } from "../components/SnapshotCard";
import { fmtPct, fmtPrice } from "../lib/format";

/** Live quotes for the brief set + the last delivered snapshot, with run-now. */
export function Brief() {
  const state = useBriefState();
  const latest = useBriefLatest();
  const run = useRunBrief();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Market brief</h1>
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={run.isPending}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {run.isPending ? "Generating…" : "Run brief now"}
        </button>
      </div>
      {run.isError && (
        <p className="text-xs text-red-600">
          {run.error instanceof Error ? run.error.message : "brief failed"}
        </p>
      )}

      <SnapshotCard title="Live state">
        {state.data && state.data.instruments.length > 0 ? (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-100">
              {state.data.instruments.map((i) => {
                const up = (i.change_pct ?? 0) >= 0;
                return (
                  <tr key={i.symbol}>
                    <td className="py-1.5 pr-3 font-mono text-neutral-800">{i.symbol}</td>
                    <td className="py-1.5 pr-3 text-neutral-500">{i.label ?? ""}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{fmtPrice(i.price)}</td>
                    <td
                      className={`py-1.5 text-right font-medium tabular-nums ${
                        i.change_pct == null
                          ? "text-neutral-400"
                          : up
                            ? "text-emerald-600"
                            : "text-red-600"
                      }`}
                    >
                      {fmtPct(i.change_pct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-neutral-400">
            {state.isLoading ? "Quoting…" : "No quotes available (market provider unreachable?)."}
          </p>
        )}
      </SnapshotCard>

      <SnapshotCard
        title="Last delivered snapshot"
        aside={latest.data && <FreshnessStamp iso={latest.data.sent_at} label="sent" thresholdHours={12} />}
      >
        {latest.data ? (
          <>
            {latest.data.title && (
              <h3 className="mb-1 text-sm font-semibold text-neutral-800">{latest.data.title}</h3>
            )}
            <p className="prose-snapshot text-sm leading-relaxed text-neutral-800">
              {latest.data.body ?? ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">
            Nothing delivered yet — scheduled morning / midday / close, or run it now.
          </p>
        )}
      </SnapshotCard>
    </div>
  );
}
