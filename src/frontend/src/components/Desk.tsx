import { useEffect, useRef, useState } from "react";

import { useBudget, useWorld } from "../api/queries";
import { World } from "../views/World";
import { CompanyDetail } from "../views/CompanyDetail";
import { IndustryDetail } from "../views/IndustryDetail";
import { Settings } from "../views/Settings";
import { AgentPanel } from "./desk/AgentPanel";
import {
  ChatSurface,
  NewsSurface,
  ResearchSurface,
  WatchlistSurface,
} from "./desk/Surfaces";
import {
  ChevronsLeft,
  ChevronsRight,
  LayersIcon,
  MessageIcon,
  NewspaperIcon,
  SearchIcon,
  SettingsIcon,
} from "./Icons";

type Surface = "research" | "watchlist" | "chat" | "news";

const RAIL: { id: Surface; label: string; Icon: typeof SearchIcon }[] = [
  { id: "research", label: "Research", Icon: SearchIcon },
  { id: "watchlist", label: "Watchlist & industries", Icon: LayersIcon },
  { id: "chat", label: "Chat", Icon: MessageIcon },
  { id: "news", label: "News & events", Icon: NewspaperIcon },
];

/** A network/5xx outage on the core polling queries means the API is unreachable. Only "down" once
 *  a fetch has actually failed — never during the first in-flight load, so a healthy boot is silent. */
function ServerDownBanner() {
  const world = useWorld();
  const budget = useBudget();
  const down = world.isError && budget.isError;
  return (
    <div
      aria-hidden={!down}
      className="overflow-hidden text-center text-xs font-medium transition-all"
      style={{
        background: "var(--red-500)",
        color: "var(--paper-0)",
        maxHeight: down ? "1.6rem" : 0,
        padding: down ? "0.25rem 0" : 0,
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full asa-pulse" style={{ background: "var(--paper-0)" }} />
        Can&apos;t reach the server — retrying…
      </span>
    </div>
  );
}

export function Desk() {
  const [now, setNow] = useState(() => new Date());
  const [sidePanel, setSidePanel] = useState<Surface | null>("watchlist");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickedCompany, setPickedCompany] = useState<number | null>(null);
  const [pickedIndustry, setPickedIndustry] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [agentOpen, setAgentOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const askRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clearPicks = () => {
    setPickedCompany(null);
    setPickedIndustry(null);
  };

  const openSide = (id: Surface) => {
    clearPicks();
    setSettingsOpen(false);
    setSidePanel((cur) => (cur === id ? null : id));
  };

  const pickCompany = (id: number) => {
    setPickedIndustry(null);
    setPickedCompany(id);
  };
  const pickIndustry = (id: number) => {
    setPickedCompany(null);
    setPickedIndustry(id);
  };

  const selectSession = (id: number | null) => {
    setSelectedSession(id);
    if (id != null) setAgentOpen(true);
  };

  // Open research from a surveillance statement — drop the topic into the chat composer.
  const researchTopic = (topic: string) => {
    clearPicks();
    setSettingsOpen(false);
    setSidePanel("chat");
    setDraft(topic.endsWith(" ") ? topic : `${topic} `);
    setTimeout(() => askRef.current?.focus(), 30);
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const fmtClock = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
  };

  const leftDetail =
    pickedCompany != null ? (
      <CompanyDetail companyId={pickedCompany} onClose={() => setPickedCompany(null)} onResearch={researchTopic} />
    ) : pickedIndustry != null ? (
      <IndustryDetail industryId={pickedIndustry} onClose={() => setPickedIndustry(null)} onResearch={researchTopic} />
    ) : null;

  const leftSurface = (() => {
    switch (sidePanel) {
      case "watchlist":
        return <WatchlistSurface onPickCompany={pickCompany} onPickIndustry={pickIndustry} />;
      case "research":
        return <ResearchSurface onSelect={selectSession} draft={draft} setDraft={setDraft} />;
      case "chat":
        return <ChatSurface draft={draft} setDraft={setDraft} askRef={askRef} onSelectSession={selectSession} />;
      case "news":
        return <NewsSurface />;
      default:
        return null;
    }
  })();

  const showLeft = leftDetail != null || leftSurface != null;

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <ServerDownBanner />

      {/* Thin header — time & date only, no logo. */}
      <div
        className="flex h-8 shrink-0 items-center gap-3 px-4"
        style={{ borderBottom: "1px solid var(--border-strong)", background: "var(--surface-panel)" }}
      >
        <span className="font-data text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtDate(now)}</span>
        <span className="flex-1" />
        <span className="font-data text-[11px] tnum" style={{ color: "var(--text-muted)" }}>{fmtClock(now)}</span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1">
        {/* Icon rail — toggles the left panel; Settings is the only full-view swap. */}
        <nav
          className="flex w-[50px] shrink-0 flex-col items-center gap-1 py-2.5"
          style={{ borderRight: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
        >
          {RAIL.map(({ id, label, Icon }) => {
            const on = !settingsOpen && sidePanel === id;
            return (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => openSide(id)}
                className="flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                style={{
                  color: on ? "var(--accent)" : "var(--text-muted)",
                  background: on ? "var(--signal-soft)" : "transparent",
                }}
              >
                <Icon size={18} />
              </button>
            );
          })}
          <span className="flex-1" />
          <button
            type="button"
            title="Settings"
            onClick={() => setSettingsOpen((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors"
            style={{
              color: settingsOpen ? "var(--accent)" : "var(--text-muted)",
              background: settingsOpen ? "var(--signal-soft)" : "transparent",
            }}
          >
            <SettingsIcon size={18} />
          </button>
        </nav>

        {settingsOpen ? (
          <div className="flex min-h-0 flex-1 overflow-y-auto">
            <Settings />
          </div>
        ) : (
          <>
            {showLeft && (
              <div
                className="flex w-[360px] shrink-0 flex-col"
                style={{ borderRight: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
              >
                {leftDetail ?? leftSurface}
              </div>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <World onResearch={researchTopic} />
            </div>

            {agentOpen ? (
              <aside
                className="flex w-[360px] shrink-0 flex-col"
                style={{ borderLeft: "1px solid var(--border-default)", background: "var(--bg-app)" }}
              >
                <header
                  className="flex h-10 shrink-0 items-center gap-2 px-3 pl-4"
                  style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-panel)" }}
                >
                  <span className="text-sm font-bold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>
                    Agent
                  </span>
                  <span className="terminal-label" style={{ fontSize: "0.5625rem" }}>
                    {selectedSession ? "research" : "live state"}
                  </span>
                  <button
                    type="button"
                    title="Collapse"
                    onClick={() => setAgentOpen(false)}
                    className="ml-auto flex h-6 w-6 items-center justify-center rounded-sm hover:bg-[var(--surface-hover)]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronsRight size={15} />
                  </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col">
                  <AgentPanel
                    selectedId={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onSelectSession={selectSession}
                  />
                </div>
              </aside>
            ) : (
              <button
                type="button"
                title="Show agent"
                onClick={() => setAgentOpen(true)}
                className="flex w-10 shrink-0 flex-col items-center gap-3 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                style={{ borderLeft: "1px solid var(--border-default)", background: "var(--surface-panel)", color: "var(--text-muted)" }}
              >
                <ChevronsLeft size={15} />
                <span className="terminal-label [writing-mode:vertical-rl]" style={{ fontSize: "0.625rem" }}>
                  Agent
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
