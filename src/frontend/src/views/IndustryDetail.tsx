import type { ReactNode } from "react";

import { useCompanies, useFlagIndustry, useIndustries, useIndustryDetail } from "../api/queries";
import { ArticleList } from "../components/ArticleList";
import { CloseIcon } from "../components/Icons";

/** A picked industry, in the left panel — mirrors the name detail: Qualitative (what the industry
 *  is + its position) then Quantitative (deferred), with its constituents and embedded news.
 *  Reads & observations only; no numeric scores. */
export function IndustryDetail({
  industryId,
  onClose,
  onResearch,
}: {
  industryId: number;
  onClose: () => void;
  onResearch: (topic: string) => void;
}) {
  const detail = useIndustryDetail(industryId);
  const industries = useIndustries();
  const companies = useCompanies();
  const flag = useFlagIndustry(industryId);

  const flagged = industries.data?.find((i) => i.industry_id === industryId)?.flagged ?? false;
  const inIndustry = (companies.data ?? []).filter((c) => c.industry_id === industryId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className="flex h-10 shrink-0 items-center gap-2 px-4"
        style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
      >
        <span className="terminal-label">Industry detail</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-sm hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-muted)" }}
          title="Back to the list"
        >
          <CloseIcon size={14} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {detail.isLoading && <p className="terminal-label">Loading…</p>}
        {detail.isError && <p className="text-sm" style={{ color: "var(--red-500)" }}>Industry not found.</p>}
        {detail.data && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>
                {detail.data.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => flag.mutate(!flagged)}
                  disabled={flag.isPending}
                  className="rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40"
                  style={
                    flagged
                      ? { background: "var(--signal-soft)", color: "var(--accent)" }
                      : { border: "1px solid var(--border-strong)", color: "var(--text-body)" }
                  }
                >
                  {flagged ? "Critical ✓" : "Flag as critical"}
                </button>
                <button
                  type="button"
                  onClick={() => onResearch(`${detail.data!.name} — `)}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  research this industry →
                </button>
              </div>
            </div>

            <Section title="Qualitative">
              <Field label="What it is">
                <p className="text-sm" style={{ color: "var(--text-body)" }}>
                  {detail.data.description ?? "No description yet."}
                </p>
              </Field>
              <Field label="Constituents">
                {inIndustry.length > 0 ? (
                  <ul className="space-y-0.5">
                    {inIndustry.map((c) => (
                      <li key={c.company_id} className="flex items-center gap-2 py-0.5">
                        <span className="font-data text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
                          {c.ticker}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--text-body)" }}>
                          {c.name}
                        </span>
                        <span className="shrink-0 font-data text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
                          {c.coverage_tier}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    No tracked companies yet — research discovers and adds them.
                  </p>
                )}
              </Field>
            </Section>

            <Section title="Quantitative">
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                Industry aggregates and supply-chain tiers aren&apos;t wired to this surface yet —
                deferred enrichment.
              </p>
            </Section>

            <Section title="News & events">
              <ArticleList articles={detail.data.articles} />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-data text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-strong)", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>
        {title}
      </h3>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="terminal-label mb-0.5">{label}</p>
      {children}
    </div>
  );
}
