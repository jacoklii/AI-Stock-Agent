import { NavLink, Outlet } from "react-router-dom";

import { useBudget, useInbox } from "../api/queries";
import { BudgetGauge } from "./BudgetGauge";

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

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="flex w-52 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-4">
          <span className="text-sm font-bold tracking-tight">AI Stock Agent</span>
          <p className="mt-0.5 text-xs text-neutral-400">research partner</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
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
          <div className="border-t border-neutral-100 p-4">
            <BudgetGauge budget={budget.data} compact />
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
