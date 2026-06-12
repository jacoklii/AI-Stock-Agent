import { Link } from "react-router-dom";

import { useCompanies, useIndustries } from "../api/queries";
import { EmptyState } from "../components/EmptyState";
import { SnapshotCard } from "../components/SnapshotCard";

/** Tracked industries (controlled vocabulary) + the watchlist — coverage at a glance. */
export function Industries() {
  const industries = useIndustries();
  const watchlist = useCompanies("watchlist");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Industries & coverage</h1>

      <SnapshotCard title="Industries">
        {(industries.data ?? []).length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {(industries.data ?? []).map((i) => (
              <li key={i.industry_id}>
                <Link
                  to={`/industries/${i.industry_id}`}
                  className="flex items-center justify-between gap-3 py-2 hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-neutral-900">{i.name}</span>
                    {i.description && (
                      <p className="truncate text-xs text-neutral-500">{i.description}</p>
                    )}
                  </div>
                  {i.flagged && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                      critical
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            message="No industries seeded yet."
            hint="Industries come from the controlled vocabulary in the database."
          />
        )}
      </SnapshotCard>

      <SnapshotCard title="Watchlist (deep coverage)">
        {(watchlist.data ?? []).length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {(watchlist.data ?? []).map((c) => (
              <li key={c.company_id}>
                <Link
                  to={`/companies/${c.company_id}`}
                  className="flex items-center justify-between gap-3 py-2 hover:bg-neutral-50"
                >
                  <span className="font-mono text-sm font-semibold text-neutral-900">
                    {c.ticker}
                  </span>
                  <span className="min-w-0 flex-1 truncate px-3 text-sm text-neutral-600">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">{c.sector ?? ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            message="Watchlist is empty."
            hint="Promote companies from their detail page; deep scoring runs only on the watchlist."
          />
        )}
      </SnapshotCard>
    </div>
  );
}
