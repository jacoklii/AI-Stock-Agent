import { useWorld } from "../api/queries";
import { HorizonTag } from "../components/HorizonTag";
import { ExternalIcon } from "../components/Icons";
import { fmtDateTime } from "../lib/format";
import type { Horizon } from "../lib/freshness";
import type { WorldDomain, WorldItem, WorldSignal } from "../api/types";

/** The always-on middle surveillance view. Ordered top-down by where market moves originate —
 *  Overview → Geopolitics → Macro → Industry → Market — with a Signals band split Now / Building.
 *  Every line leads with the fact + numbers; the read and the source sit behind the expand. */
export function World({ onResearch }: { onResearch: (topic: string) => void }) {
  const world = useWorld();
  const data = world.data;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg-app)" }}>
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-7">
        {world.isLoading && <p className="terminal-label">Loading the world…</p>}

        {data?.overview?.top_snapshot && (
          <section>
            <SectionHead title="Overview" origin="researched" />
            <p className="asa-prose mt-2">{data.overview.top_snapshot}</p>
            {(data.overview.sections ?? []).length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {data.overview.sections.map((s, i) => (
                  <li key={i} className="text-sm" style={{ color: "var(--text-body)" }}>
                    <span className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.section_title}
                    </span>{" "}
                    {s.snapshot}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <Signals now={data?.signals_now ?? []} building={data?.signals_building ?? []} onResearch={onResearch} />

        {(data?.domains ?? []).map((d) => (
          <DomainBlock key={d.key} domain={d} onResearch={onResearch} />
        ))}

        {data && !data.overview && (data.domains ?? []).every((d) => (d.items ?? []).length === 0) && (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Nothing swept yet. The scraper populates the world as it runs; the agent's overview
            appears after the first digest.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHead({ title, origin }: { title: string; origin?: "swept" | "researched" }) {
  return (
    <div className="flex items-baseline gap-2" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "0.35rem" }}>
      <h2 className="font-data text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-strong)" }}>
        {title}
      </h2>
      {origin && (
        <span className="terminal-label" style={{ fontSize: "0.625rem" }}>
          {origin === "researched" ? "· researched by the agent" : "· swept by the scraper"}
        </span>
      )}
    </div>
  );
}

function Signals({
  now,
  building,
  onResearch,
}: {
  now: WorldSignal[];
  building: WorldSignal[];
  onResearch: (topic: string) => void;
}) {
  if (now.length === 0 && building.length === 0) return null;
  return (
    <section>
      <SectionHead title="Signals" />
      <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <SignalColumn label="Now" horizon="now" signals={now} onResearch={onResearch} />
        <SignalColumn label="Building" horizon="building" signals={building} onResearch={onResearch} />
      </div>
    </section>
  );
}

function SignalColumn({
  label,
  horizon,
  signals,
  onResearch,
}: {
  label: string;
  horizon: Horizon;
  signals: WorldSignal[];
  onResearch: (topic: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5">
        <HorizonTag horizon={horizon} />
        <span className="ml-1.5 terminal-label" style={{ fontSize: "0.625rem" }}>
          {label}
        </span>
      </div>
      {signals.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>—</p>
      ) : (
        <ul className="space-y-1.5">
          {signals.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onResearch(s.title)}
                className="text-left text-sm hover:underline"
                style={{ color: "var(--text-body)" }}
                title="Open research on this"
              >
                {s.title}
              </button>
              {(s.tickers ?? []).length > 0 && (
                <span className="ml-1.5 font-data text-xs" style={{ color: "var(--text-muted)" }}>
                  {(s.tickers ?? []).join(" ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DomainBlock({ domain, onResearch }: { domain: WorldDomain; onResearch: (topic: string) => void }) {
  const items = domain.items ?? [];
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHead title={domain.title} origin="swept" />
      <ul className="mt-1">
        {items.map((it, i) => (
          <ItemRow key={i} item={it} onResearch={onResearch} />
        ))}
      </ul>
    </section>
  );
}

/** Fact + numbers lead; the read (summary), the source link, and tickers sit behind the expand. */
function ItemRow({ item, onResearch }: { item: WorldItem; onResearch: (topic: string) => void }) {
  return (
    <li style={{ borderBottom: "1px solid var(--border-default)" }}>
      <details className="group py-2">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <span className="text-sm" style={{ color: "var(--text-strong)" }}>
            {item.title}
          </span>
          <span className="mt-0.5 shrink-0">
            <HorizonTag horizon={item.horizon} />
          </span>
        </summary>
        <div className="mt-2 space-y-2 pl-0">
          {item.detail && (
            <p className="text-sm leading-snug" style={{ color: "var(--text-body)" }}>
              {item.detail}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {item.published_at && <span className="tnum">{fmtDateTime(item.published_at)}</span>}
            {(item.tickers ?? []).map((t) => (
              <span key={t} className="font-data" style={{ color: "var(--text-muted)" }}>
                {t}
              </span>
            ))}
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--link)" }}
              >
                source <ExternalIcon size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onResearch(item.title)}
              className="hover:underline"
              style={{ color: "var(--link)" }}
            >
              research →
            </button>
          </div>
        </div>
      </details>
    </li>
  );
}
