import { useEffect, useRef, useState } from "react";

import {
  usePreferences,
  useUpdateBriefUser,
  useUpdateBudget,
  useUpdateChannels,
} from "../api/queries";
import { SnapshotCard } from "../components/SnapshotCard";

const DELIVERY_SHAPES = [
  { key: "digest_channels" as const, label: "Daily digest" },
  { key: "brief_channels" as const, label: "Market brief" },
];
const CHANNELS = ["email", "imessage", "whatsapp", "in_app"];

/** Direction levers: who to notify where, the brief set, and the weekly budget. */
export function Settings() {
  const prefs = usePreferences();
  const updateBriefUser = useUpdateBriefUser();
  const updateBudget = useUpdateBudget();
  const updateChannels = useUpdateChannels();

  const [briefSymbols, setBriefSymbols] = useState("");
  const [budget, setBudget] = useState("");
  const [email, setEmail] = useState("");
  const [imessage, setImessage] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [routes, setRoutes] = useState<{ digest_channels: string[]; brief_channels: string[] }>({
    digest_channels: ["email", "in_app"],
    brief_channels: ["imessage", "in_app"],
  });

  // Seed the forms once when preferences first arrive. Re-syncing on every refetch would
  // clobber in-progress edits in one card whenever another card saves (saving invalidates
  // the prefs query); each save's onSuccess below re-syncs only its own field instead.
  const seeded = useRef(false);
  useEffect(() => {
    const p = prefs.data;
    if (!p || seeded.current) return;
    seeded.current = true;
    setBriefSymbols(p.brief_user.join(", "));
    setBudget(p.weekly_token_budget != null ? String(p.weekly_token_budget) : "");
    setEmail(p.channels?.email ?? "");
    setImessage(p.channels?.imessage ?? "");
    setWhatsapp(p.channels?.whatsapp ?? "");
    setRoutes({
      digest_channels: p.channels?.digest_channels ?? ["email", "in_app"],
      brief_channels: p.channels?.brief_channels ?? ["imessage", "in_app"],
    });
  }, [prefs.data]);

  if (prefs.isLoading) return <p className="text-sm" style={{ color: "var(--text-dim)" }}>Loading…</p>;
  if (prefs.data === null)
    return (
      <p className="text-sm text-red-600">
        Preferences not initialized — seed the user_preferences row (id=1) first.
      </p>
    );

  const toggleRoute = (shape: "digest_channels" | "brief_channels", channel: string) => {
    setRoutes((r) => {
      const current = r[shape];
      return {
        ...r,
        [shape]: current.includes(channel)
          ? current.filter((c) => c !== channel)
          : [...current, channel],
      };
    });
  };

  const saveChannels = () => {
    updateChannels.mutate({
      email: email.trim() || null,
      imessage: imessage.trim() || null,
      whatsapp: whatsapp.trim() || null,
      digest_channels: routes.digest_channels,
      brief_channels: routes.brief_channels,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Settings</h1>

      <SnapshotCard title="Notifications">
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-[color:var(--text-muted)]">Email address</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm focus:border-[var(--text-muted)] focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-[color:var(--text-muted)]">iMessage (macOS host only)</span>
              <input
                value={imessage}
                onChange={(e) => setImessage(e.target.value)}
                placeholder="+1 555 0100"
                className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm focus:border-[var(--text-muted)] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[color:var(--text-muted)]">WhatsApp (not yet wired)</span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 555 0100"
                className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm focus:border-[var(--text-muted)] focus:outline-none"
              />
            </label>
          </div>

          {DELIVERY_SHAPES.map((shape) => (
            <div key={shape.key}>
              <span className="text-xs text-[color:var(--text-muted)]">{shape.label} goes to</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const active = routes[shape.key].includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleRoute(shape.key, c)}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        active
                          ? { background: "var(--accent)", color: "var(--on-accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                          : { background: "var(--surface-inset)", color: "var(--text-muted)", boxShadow: "inset 0 0 0 1px var(--border-default)" }
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={saveChannels}
            disabled={updateChannels.isPending}
            className="rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            {updateChannels.isPending ? "Saving…" : "Save notifications"}
          </button>
          {updateChannels.isSuccess && <span className="ml-2 text-xs text-emerald-600">saved</span>}
          {updateChannels.isError && (
            <span className="ml-2 text-xs text-red-600">
              {updateChannels.error instanceof Error ? updateChannels.error.message : "failed"}
            </span>
          )}
        </div>
      </SnapshotCard>

      <SnapshotCard title="Brief mega-caps">
        <p className="mb-2 text-xs text-[color:var(--text-dim)]">
          Added to the fixed core (indices, gold, 10Y, DXY, VIX). Comma-separated tickers.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateBriefUser.mutate(
              briefSymbols
                .split(",")
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean),
              { onSuccess: (data) => setBriefSymbols(data.brief_user.join(", ")) },
            );
          }}
        >
          <input
            value={briefSymbols}
            onChange={(e) => setBriefSymbols(e.target.value)}
            placeholder="NVDA, MSFT, TSM"
            className="flex-1 rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-mono text-sm focus:border-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={updateBriefUser.isPending}
            className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            Save
          </button>
        </form>
        {updateBriefUser.isSuccess && <span className="text-xs text-emerald-600">saved</span>}
        {updateBriefUser.isError && <span className="text-xs text-red-600">failed</span>}
      </SnapshotCard>

      <SnapshotCard title="Weekly token budget">
        <p className="mb-2 text-xs text-[color:var(--text-dim)]">
          The agent self-paces against this cap (tokens per trailing 7 days). Empty = uncapped.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = budget.trim() === "" ? null : Number(budget);
            if (n !== null && (!Number.isFinite(n) || n < 0)) return;
            updateBudget.mutate(n);
          }}
        >
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 2000000"
            inputMode="numeric"
            className="flex-1 rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-mono text-sm focus:border-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={updateBudget.isPending}
            className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            Save
          </button>
        </form>
        {updateBudget.isSuccess && <span className="text-xs text-emerald-600">saved</span>}
        {updateBudget.isError && <span className="text-xs text-red-600">failed</span>}
      </SnapshotCard>
    </div>
  );
}
