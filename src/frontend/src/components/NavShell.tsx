import { NavLink, Outlet } from "react-router-dom";

import { useBudget, useInbox } from "../api/queries";
import { BudgetGauge } from "./BudgetGauge";

/** A network/5xx outage on a core polling query means the API is unreachable. We only treat it as
 *  "down" once a fetch has actually failed (isError) — never during the first in-flight load, so a
 *  healthy boot never flashes the banner. */
function ServerDownBanner({ down }: { down: boolean }) {
  return (
    <div
      aria-hidden={!down}
      className={`overflow-hidden bg-red-600 text-center text-xs font-medium text-white transition-all ${
        down ? "max-h-8 py-1.5" : "max-h-0 py-0"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
        Can&apos;t reach the server — retrying…
      </span>
    </div>
  );
}

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/research", label: "Research" },
  { to: "/industries", label: "Industries" },
  { to: "/brief", label: "Brief" },
  { to: "/inbox", label: "Inbox" },
  { to: "/settings", label: "Settings" },
];

/** Sidebar shell: navigation + the always-visible agent posture (unread count, budget). */
export function NavShell() {
  const inbox = useInbox();
  const budget = useBudget();
  const unread = (inbox.data ?? []).filter((n) => !n.read_at && !n.dismissed_at).length;
  // Both core polling queries failing is a strong "API unreachable" signal — one erroring alone
  // could be an isolated endpoint hiccup.
  const serverDown = inbox.isError && budget.isError;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <ServerDownBanner down={serverDown} />
      {/* Sidebar from md: up; a compact top bar with horizontally scrollable links below that. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-white md:w-52 md:border-b-0 md:border-r">
        <div className="border-b border-neutral-100 px-4 py-3 md:py-4">
          <span className="text-sm font-bold tracking-tight">AI Stock Agent</span>
          <p className="mt-0.5 hidden text-xs text-neutral-400 md:block">research partner</p>
        </div>
        <nav className="flex gap-0.5 overflow-x-auto p-2 md:flex-1 md:flex-col md:overflow-x-visible">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center justify-between gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                  isActive
                    ? "bg-neutral-900 font-medium text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`
              }
            >
              <span>{l.label}</span>
              {l.to === "/inbox" && unread > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        {budget.data && (
          <div className="hidden border-t border-neutral-100 p-4 md:block">
            <BudgetGauge budget={budget.data} compact />
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
      </div>
    </div>
  );
}
