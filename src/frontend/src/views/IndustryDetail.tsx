import { useParams } from "react-router-dom";

import { useFlagIndustry, useIndustries, useIndustryDetail } from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { SnapshotCard } from "../components/SnapshotCard";

/** One industry: description, critical flag, and its article stream. */
export function IndustryDetail() {
  const { industryId } = useParams();
  const id = Number(industryId);
  const detail = useIndustryDetail(id);
  const industries = useIndustries();
  const flag = useFlagIndustry(id);

  if (detail.isLoading) return <p className="text-sm text-neutral-400">Loading…</p>;
  if (detail.isError || !detail.data)
    return <p className="text-sm text-red-600">Industry not found.</p>;
  const ind = detail.data;
  const flagged = industries.data?.find((i) => i.industry_id === id)?.flagged ?? false;

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

      <SnapshotCard title="Articles">
        <ArticleList articles={ind.articles} />
      </SnapshotCard>
    </div>
  );
}
