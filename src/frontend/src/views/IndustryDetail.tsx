import { Link, useParams } from "react-router-dom";

import { useCompanies, useFlagIndustry, useIndustries, useIndustryDetail } from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { SnapshotCard } from "../components/SnapshotCard";

const TIER_STYLE: Record<string, string> = {
  watchlist: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  industry_critical: "bg-amber-50 text-amber-700 ring-amber-200",
  discovered: "bg-neutral-50 text-neutral-500 ring-neutral-200",
  archived: "bg-neutral-50 text-neutral-400 ring-neutral-200",
};

/** One industry: description, critical flag, its companies, and its article stream. */
export function IndustryDetail() {
  const { industryId } = useParams();
  const id = Number(industryId);
  const detail = useIndustryDetail(id);
  const industries = useIndustries();
  const companies = useCompanies();
  const flag = useFlagIndustry(id);

  if (detail.isLoading) return <p className="text-sm text-neutral-400">Loading…</p>;
  if (detail.isError || !detail.data)
    return <p className="text-sm text-red-600">Industry not found.</p>;
  const ind = detail.data;
  const flagged = industries.data?.find((i) => i.industry_id === id)?.flagged ?? false;
  const inIndustry = (companies.data ?? []).filter((c) => c.industry_id === id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{ind.name}</h1>
          {ind.description && <p className="mt-1 text-sm text-neutral-500">{ind.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => flag.mutate(!flagged)}
          disabled={flag.isPending}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
            flagged
              ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
              : "border border-neutral-300 hover:bg-neutral-100"
          }`}
        >
          {flagged ? "Critical ✓ (unflag)" : "Flag as critical"}
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        Critical industries get industry_critical coverage: their key companies are scored and
        read deeply, like the watchlist.
      </p>

      <SnapshotCard title="Companies">
        {inIndustry.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {inIndustry.map((c) => (
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
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      TIER_STYLE[c.coverage_tier] ?? TIER_STYLE.discovered
                    }`}
                  >
                    {c.coverage_tier}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400">
            No tracked companies in this industry yet — research discovers and adds them.
          </p>
        )}
      </SnapshotCard>

      <SnapshotCard title="Articles">
        <ArticleList articles={ind.articles} />
      </SnapshotCard>
    </div>
  );
}
