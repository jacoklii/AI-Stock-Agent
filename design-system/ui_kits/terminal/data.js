/* Data for the AI Stock Agent — unified research desk. Mirrors the real schema vocabulary from
 * ARCHITECTURE.md (coverage tiers, significance, research state, origin, the brief) but every
 * value is invented for demo. The agent researches / analyzes / updates — it never recommends
 * buy/sell/hold. The point of this view is FULL VISIBILITY: every step, tool, source, token. */
(function () {
  function series(seed, n, drift) {
    const out = []; let v = 100, s = seed;
    for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const r = s / 233280 - 0.5; v = Math.max(1, v + r * 4 + drift); out.push(+v.toFixed(2)); }
    return out;
  }

  const ACTIVE = {
    id: 101,
    topic: "TSMC advanced-node capacity vs. 2026 AI demand",
    origin: "schedule",
    openedAt: "Jun 17 · 08:12",
    statusPhrases: [
      "Thinking…",
      "Researching TSMC advanced-node capacity…",
      "Reading 6 sources…",
      "Cross-checking against your Jun 14 brief…",
      "Scoring significance…",
      "Drafting findings…",
      "Finding related topics…",
    ],
    telemetry: { turn: 9, maxTurns: 24, tools: 17, sources: 6, inTok: "22.4k", outTok: "1.1k", elapsed: "2m 14s" },
    impact: [
      { kind: "industry", name: "AI accelerator silicon", effect: "tailwind", probability: 0.80, because: "The confirming packaging step-up relieves the binding supply constraint — names gated by CoWoS get more units to ship." },
      { kind: "industry", name: "Memory / HBM", effect: "tailwind", probability: 0.66, because: "More packaged accelerators pull matching HBM stacks; demand reads through to the memory makers." },
      { kind: "stock", ticker: "NVDA", name: "NVIDIA", effect: "tailwind", probability: 0.78, because: "Most unit-constrained on advanced packaging — added capacity flows most directly to shippable volume (3 corroborating sources)." },
      { kind: "stock", ticker: "AVGO", name: "Broadcom", effect: "tailwind", probability: 0.61, because: "Custom-silicon programs share the same packaging line; benefits, but one step removed from the lead allocation." },
      { kind: "fund", ticker: "SMH", name: "VanEck Semiconductor ETF", effect: "tailwind", probability: 0.62, because: "Broad semiconductor basket — captures the packaging-driven volume across the chain, diluted vs. single names." },
    ],
    trace: [
      { label: "Reconstructed context from your watchlist & last brief", tool: "memory.read", reuse: "Watchlist · Brief Jun 14", inTok: "1.2k", outTok: "0.1k", at: "08:12:02", status: "done" },
      { label: "Searched advanced-packaging capex guidance", tool: "web.search", sources: ["reuters.com", "bloomberg.com"], inTok: "6.1k", outTok: "0.5k", at: "08:12:20", status: "done" },
      { label: "Fetched & read OSAT earnings transcript", tool: "filings.fetch", sources: ["sec.gov"], inTok: "8.8k", outTok: "0.2k", at: "08:12:48", status: "done" },
      { label: "Reading 6 sources for corroboration", tool: "web.fetch", sources: ["ft.com", "wsj.com", "+4"], inTok: "6.3k", outTok: "0.3k", at: "08:13:31", status: "active" },
      { label: "Score significance & write findings", status: "pending" },
      { label: "Surface related topics across coverage", status: "pending" },
    ],
  };

  const SESSIONS = [
    {
      id: 88, topic: "Advanced packaging — names exposed to the 2026 CoWoS step-up", origin: "schedule", status: "closed",
      openedAt: "Jun 16 · 06:00", closedAt: "Jun 16 · 07:12",
      summary: "Starting from the advanced-packaging thread, the agent mapped the supply chain and ranked names by exposure and corroboration. Three cleared the surfacing threshold; it added the highest-significance name to your watchlist on its own and left the rest for you to confirm.",
      telemetry: { turn: 11, maxTurns: 16, tools: 15, sources: 8, inTok: "38.7k", outTok: "2.0k", elapsed: "1h 12m" },
      impact: [
        { kind: "industry", name: "OSAT / packaging", effect: "tailwind", probability: 0.74, because: "CoWoS additions land first at the outsourced assembly & test houses — the most direct beneficiaries of the step-up." },
        { kind: "industry", name: "Packaging inspection / metrology", effect: "tailwind", probability: 0.62, because: "More packaging volume pulls inspection demand one layer up the line." },
        { kind: "stock", ticker: "TSM", name: "Taiwan Semiconductor", effect: "tailwind", probability: 0.68, because: "Owns the front-end node the packaging feeds; the ramp is unit-accretive but capacity-paced." },
      ],
      sources: [
        { domain: "reuters.com", title: "CoWoS capacity additions detailed by supplier", at: "Jun 16", sig: 0.70 },
        { domain: "digitimes.com", title: "OSAT packaging allocation tightens", at: "Jun 16", sig: 0.58 },
      ],
      // Names the agent found from the research and ranked. addedBy:'agent' = auto-stored to the
      // watchlist (cleared the significance threshold); the rest are proposed for the user.
      surfaced: [
        { ticker: "ASX", name: "ASE Technology", sig: 0.71, addedBy: "agent", why: "Largest OSAT; the most direct read on the packaging step-up. Corroborated across 4 sources — auto-added at significance 0.71." },
        { ticker: "CAMT", name: "Camtek", sig: 0.52, why: "Inspection demand levered to 2.5D/3D packaging. Higher beta, thinner source breadth — proposed for your review." },
        { ticker: "AEHR", name: "Aehr Test Systems", sig: 0.38, why: "Tangential test/burn-in exposure. Below the auto-add threshold; flagged for completeness." },
      ],
      trace: [
        { label: "Loaded the advanced-packaging thread from memory", tool: "memory.read", reuse: "Research #101", inTok: "1.5k", outTok: "0.1k", at: "06:00:08", status: "done" },
        { label: "Mapped the CoWoS supply chain", tool: "reasoning", inTok: "9.0k", outTok: "0.6k", at: "06:11:40", status: "done" },
        { label: "Searched & ranked exposed names", tool: "web.search", sources: ["reuters.com", "digitimes.com"], inTok: "15.2k", outTok: "0.5k", at: "06:31:02", status: "done" },
        { label: "Scored significance & stored the watchlist name", tool: "memory.write", reuse: "Watchlist ← ASX", inTok: "6.0k", outTok: "0.8k", at: "07:10:30", status: "done" },
      ],
      related: ["HBM suppliers exposed to the same ramp", "Substrate makers — ABF capacity"],
    },
    {
      id: 92, topic: "HBM pricing trajectory into Q3", origin: "user", status: "open",
      openedAt: "Jun 17 · 07:40", activeAgo: "21m",
      summary: "Spot and contract memory prints are diverging; the agent is reconciling which signal leads. Early read: contract firming is the durable one.",
      telemetry: { turn: 4, maxTurns: 16, tools: 6, sources: 3, inTok: "9.1k", outTok: "0.4k", elapsed: "21m" },
      impact: [
        { kind: "industry", name: "DRAM / memory makers", effect: "tailwind", probability: 0.72, because: "Contract pricing firming is the durable signal — it flows straight to memory-maker margins." },
        { kind: "stock", ticker: "MU", name: "Micron", effect: "tailwind", probability: 0.70, because: "Most-levered US memory name to contract HBM pricing; margin sensitivity is highest here." },
        { kind: "industry", name: "Smartphone / PC OEMs", effect: "headwind", probability: 0.61, because: "Rising memory input cost is a margin headwind for downstream device makers." },
        { kind: "fund", ticker: "SOXX", name: "iShares Semiconductor ETF", effect: "tailwind", probability: 0.60, because: "Captures the memory-cycle read across the basket, muted vs. a pure-play memory name." },
      ],
      sources: [
        { domain: "trendforce.com", title: "Contract DRAM pricing firms into Q3", at: "1h ago", sig: 0.62 },
        { domain: "digitimes.com", title: "HBM allocation tightens at lead foundry", at: "3h ago", sig: 0.55 },
        { domain: "bloomberg.com", title: "Memory makers signal disciplined supply", at: "5h ago", sig: 0.41 },
      ],
      trace: [
        { label: "Pulled prior memory-cycle notes", tool: "memory.read", reuse: "Research #71", inTok: "0.9k", outTok: "0.1k", at: "07:40:05", status: "done" },
        { label: "Searched spot vs. contract prints", tool: "web.search", sources: ["trendforce.com"], inTok: "4.2k", outTok: "0.3k", at: "07:40:22", status: "done" },
        { label: "Reconciling lead/lag between the two", tool: "reasoning", inTok: "3.0k", outTok: "0.0k", at: "07:48:10", status: "active" },
      ],
      related: ["Samsung vs. SK Hynix HBM share", "DRAM capex discipline"],
    },
    {
      id: 71, topic: "Nuclear SMR permitting timeline — US vs. EU", origin: "user", status: "closed",
      openedAt: "Jun 14 · 13:02", closedAt: "Jun 14 · 14:48",
      summary: "Permitting cadence diverges. In the base case the US NRC pathway gates the first commercial deployments to 2029–2031; the EU track is earlier on paper but politically contingent.",
      telemetry: { turn: 18, maxTurns: 20, tools: 24, sources: 11, inTok: "84.0k", outTok: "3.2k", elapsed: "1h 46m" },
      impact: [
        { kind: "industry", name: "Nuclear SMR developers", effect: "headwind", probability: 0.66, because: "The US NRC pathway gates first deployments to 2029–2031 — later than consensus, pushing out the revenue timeline." },
        { kind: "industry", name: "Uranium / fuel cycle", effect: "mixed", probability: 0.60, because: "Demand thesis intact but timing slips; the near-term read is muted rather than negative." },
        { kind: "fund", ticker: "NLR", name: "VanEck Uranium & Nuclear ETF", effect: "headwind", probability: 0.62, because: "Basket reflects the deployment-timeline slip; broad exposure dampens single-name idiosyncrasy." },
      ],
      sources: [
        { domain: "nrc.gov", title: "Combined license application status", at: "Jun 14", sig: 0.71 },
        { domain: "iaea.org", title: "SMR regulatory harmonisation note", at: "Jun 14", sig: 0.58 },
        { domain: "world-nuclear.org", title: "Deployment pipeline by jurisdiction", at: "Jun 13", sig: 0.49 },
      ],
      trace: [
        { label: "Framed the US vs. EU comparison", tool: "reasoning", inTok: "2.1k", outTok: "0.4k", at: "13:02:10", status: "done" },
        { label: "Read NRC licensing docket", tool: "filings.fetch", sources: ["nrc.gov"], inTok: "21.0k", outTok: "0.6k", at: "13:08:40", status: "done" },
        { label: "Compared EU national timelines", tool: "web.fetch", sources: ["iaea.org", "world-nuclear.org"], inTok: "18.4k", outTok: "0.7k", at: "13:31:02", status: "done" },
        { label: "Wrote findings & significance", tool: "synthesis", inTok: "9.0k", outTok: "1.5k", at: "14:46:55", status: "done" },
      ],
      related: ["Uranium fuel-cycle bottlenecks", "Grid interconnect queues"],
    },
    {
      id: 65, topic: "ASML China revenue mix sensitivity", origin: "schedule", status: "closed",
      openedAt: "Jun 13 · 09:20", closedAt: "Jun 13 · 10:05",
      summary: "Export-control scenarios bound the China mix; the spread between the lenient and strict cases is wider than the consensus model implies, which matters more for cadence than for the annual total.",
      telemetry: { turn: 12, maxTurns: 16, tools: 14, sources: 7, inTok: "41.2k", outTok: "2.1k", elapsed: "45m" },
      impact: [
        { kind: "stock", ticker: "ASML", name: "ASML", effect: "headwind", probability: 0.64, because: "The stricter export-control case widens the China-mix downside — the effect is on cadence more than the annual total." },
        { kind: "industry", name: "Semi equipment (WFE)", effect: "headwind", probability: 0.61, because: "Policy overhang reads across the equipment basket, not just the litho monopoly." },
        { kind: "fund", ticker: "SOXX", name: "iShares Semiconductor ETF", effect: "mixed", probability: 0.60, because: "Equipment weight carries the policy risk; the rest of the basket dilutes it to a mixed read." },
      ],
      sources: [
        { domain: "asml.com", title: "Investor deck — regional split", at: "Jun 13", sig: 0.64 },
        { domain: "reuters.com", title: "Draft export-license framework circulates", at: "Jun 12", sig: 0.66 },
      ],
      trace: [
        { label: "Loaded ASML coverage memory", tool: "memory.read", reuse: "Industry · Semi equip", inTok: "1.4k", outTok: "0.1k", at: "09:20:08", status: "done" },
        { label: "Modelled three export-control cases", tool: "reasoning", inTok: "12.0k", outTok: "0.9k", at: "09:31:20", status: "done" },
        { label: "Wrote findings", tool: "synthesis", inTok: "7.5k", outTok: "1.1k", at: "10:03:40", status: "done" },
      ],
      related: ["DUV vs. EUV demand split", "Semi-equipment backlog"],
    },
    {
      id: 58, topic: "Defense primes — munitions replenishment backlog", origin: "schedule", status: "closed",
      openedAt: "Jun 12 · 16:10", closedAt: "Jun 12 · 17:31",
      summary: "Backlog converts slowly; throughput — not orders — is the binding constraint named across three transcripts. The replenishment story is real but multi-year.",
      telemetry: { turn: 14, maxTurns: 18, tools: 19, sources: 9, inTok: "52.6k", outTok: "2.6k", elapsed: "1h 21m" },
      impact: [
        { kind: "industry", name: "Sub-tier / solid rocket motor suppliers", effect: "tailwind", probability: 0.66, because: "The throughput constraint sits at the sub-tier — suppliers that relieve it capture an outsized share of backlog conversion." },
        { kind: "industry", name: "Defense primes", effect: "tailwind", probability: 0.62, because: "Replenishment demand underpins revenue visibility, but throughput — not orders — caps the pace, so the tailwind is durable and slow." },
        { kind: "fund", ticker: "ITA", name: "iShares Aerospace & Defense ETF", effect: "tailwind", probability: 0.60, because: "Basket captures the multi-year replenishment, smoothing single-name throughput timing." },
      ],
      sources: [
        { domain: "sec.gov", title: "Prime contractor 10-Q — backlog detail", at: "Jun 12", sig: 0.59 },
        { domain: "defensenews.com", title: "Production-line throughput commentary", at: "Jun 11", sig: 0.52 },
      ],
      trace: [
        { label: "Gathered prime-contractor transcripts", tool: "filings.fetch", sources: ["sec.gov"], inTok: "22.0k", outTok: "0.5k", at: "16:10:30", status: "done" },
        { label: "Extracted throughput language", tool: "reasoning", inTok: "14.1k", outTok: "0.8k", at: "16:48:00", status: "done" },
        { label: "Wrote findings", tool: "synthesis", inTok: "8.0k", outTok: "1.3k", at: "17:29:10", status: "done" },
      ],
      related: ["Solid rocket motor supply", "Shipbuilding labor constraints"],
    },
  ];

  // CANDIDATES — names the agent surfaces from autonomous industry research. Each is a full
  // store record so it works the moment it's added to the watchlist (tier: "discovered").
  const CANDIDATES = {
    ASX: {
      id: 7101, ticker: "ASX", name: "ASE Technology", exchange: "NYSE", price: 11.42, changePct: -1.90,
      series: series(31, 30, 0.6), tier: "discovered", alert: "±6% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: 0.33, sources: 5, asOf: "1h ago",
        read: "Constructive — surfaced repeatedly as the OSAT most levered to the CoWoS step-up; advanced-packaging revenue mix is the cited driver.",
        trend: [0.06, 0.10, 0.08, 0.14, 0.12, 0.18, 0.16, 0.22, 0.20, 0.26, 0.30, 0.33],
      },
      financialsAsOf: "FY filings · Jun 06",
      financials: [
        { label: "Revenue (ttm)", value: "$19.4B" },
        { label: "Rev growth", value: "+9%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "16.8%" },
        { label: "Operating margin", value: "7.9%" },
        { label: "Free cash flow", value: "$1.4B" },
        { label: "Net debt", value: "$4.7B", dir: "down" },
      ],
      industry: {
        asOf: "Jun 07", sector: "Information Technology", subIndustry: "Semiconductors — OSAT / packaging",
        position: "Largest outsourced assembly & test house; a direct beneficiary of advanced-packaging demand.",
        peers: [
          { ticker: "AMKR", name: "Amkor Technology", changePct: 0.92 },
          { ticker: "TSM", name: "Taiwan Semiconductor", changePct: -0.92 },
          { ticker: "CAMT", name: "Camtek", changePct: 2.40 },
        ],
        supplyChain: ["TSMC (partner)", "NVDA (end demand)", "CoWoS (packaging)"],
      },
      findingsAsOf: "1h ago",
      findings: [
        { domain: "digitimes.com", title: "OSAT capacity additions target advanced packaging", at: "1h ago", sig: 0.60 },
        { domain: "reuters.com", title: "Assembly & test pricing firms on AI mix", at: "7h ago", sig: 0.45 },
      ],
      memoryAsOf: "Jun 16",
      memory: "The agent surfaced ASX from your advanced-packaging research and added it on its own (significance 0.71). You haven't reviewed it yet — open to confirm or archive.",
    },
    CAMT: {
      id: 7102, ticker: "CAMT", name: "Camtek", exchange: "NASDAQ", price: 96.70, changePct: 2.40,
      series: series(41, 30, 1.1), tier: "discovered", alert: "±7% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: 0.29, sources: 4, asOf: "2h ago",
        read: "Constructive but thin source breadth — inspection demand for advanced packaging is the recurring theme.",
        trend: [0.08, 0.12, 0.10, 0.16, 0.14, 0.20, 0.18, 0.24, 0.22, 0.27, 0.26, 0.29],
      },
      financialsAsOf: "FY filings · Jun 05",
      financials: [
        { label: "Revenue (ttm)", value: "$430M" },
        { label: "Rev growth", value: "+38%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "50.1%" },
        { label: "Operating margin", value: "28.0%" },
        { label: "Free cash flow", value: "$92M" },
        { label: "Net cash", value: "$310M" },
      ],
      industry: {
        asOf: "Jun 06", sector: "Information Technology", subIndustry: "Semiconductor equipment — inspection",
        position: "Inspection & metrology for advanced packaging; small-cap, high-beta to the CoWoS ramp.",
        peers: [
          { ticker: "KLAC", name: "KLA Corp", changePct: 0.11 },
          { ticker: "ONTO", name: "Onto Innovation", changePct: 1.30 },
          { ticker: "ASX", name: "ASE Technology", changePct: 1.86 },
        ],
        supplyChain: ["OSAT houses (customers)", "TSMC (end node)", "Packaging lines"],
      },
      findingsAsOf: "2h ago",
      findings: [
        { domain: "barrons.com", title: "Inspection demand cited for 2.5D/3D packaging", at: "2h ago", sig: 0.52 },
      ],
      memoryAsOf: "Jun 16",
      memory: "Surfaced from advanced-packaging research as a higher-beta way to play inspection. Proposed, not added — source breadth is thin, so the agent left the call to you.",
    },
    AEHR: {
      id: 7103, ticker: "AEHR", name: "Aehr Test Systems", exchange: "NASDAQ", price: 14.10, changePct: -1.20,
      series: series(53, 30, -0.3), tier: "discovered", alert: "±8% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: -0.08, sources: 3, asOf: "3h ago",
        read: "Mixed — burn-in / test exposure is real but the read is noisy, and customer-concentration risk is flagged across sources.",
        trend: [0.05, 0.02, 0.04, -0.01, 0.02, -0.03, 0.00, -0.04, -0.02, -0.06, -0.05, -0.08],
      },
      financialsAsOf: "FY filings · Jun 04",
      financials: [
        { label: "Revenue (ttm)", value: "$66M" },
        { label: "Rev growth", value: "-8%", dir: "down", note: "YoY" },
        { label: "Gross margin", value: "49.0%" },
        { label: "Operating margin", value: "12.4%" },
        { label: "Free cash flow", value: "$9M" },
        { label: "Net cash", value: "$48M" },
      ],
      industry: {
        asOf: "Jun 05", sector: "Information Technology", subIndustry: "Semiconductor equipment — test / burn-in",
        position: "Wafer-level burn-in; a small, concentrated customer base makes it high-variance.",
        peers: [
          { ticker: "TER", name: "Teradyne", changePct: 0.40 },
          { ticker: "COHU", name: "Cohu", changePct: -0.60 },
        ],
        supplyChain: ["Device makers (customers)", "Foundries (end node)"],
      },
      findingsAsOf: "3h ago",
      findings: [
        { domain: "seekingalpha.com", title: "Customer concentration remains the watch item", at: "3h ago", sig: 0.38 },
      ],
      memoryAsOf: "Jun 16",
      memory: "Surfaced as a tangential test-equipment name. The agent flagged it low-significance and did not add it — concentration risk and weak source breadth.",
    },
  };

  // The watchlist. Each name carries the standing quote PLUS the per-name record the store keeps:
  // the agent's sentiment read, operational financials, industry position, recent material
  // findings, and what it remembers about the name. Click a row → StockDetail fills the panel.
  // Reads and observations only — never a buy/sell/hold or valuation call.
  const FOLLOWING = [
    {
      id: 5190, ticker: "NVDA", name: "NVIDIA", exchange: "NASDAQ", price: 131.26, changePct: -2.80,
      series: series(3, 30, 1.4), tier: "watchlist", alert: "±5% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: 0.42, sources: 14, asOf: "12m ago",
        read: "Source tone firmed this week — supply commentary reads constructive, with three independent corroborations of a 2026 packaging step-up. Not unanimous; channel notes stay cautious on lead times.",
        trend: [0.10, 0.08, 0.14, 0.05, 0.18, 0.22, 0.19, 0.28, 0.31, 0.27, 0.36, 0.42],
      },
      financialsAsOf: "FY filings · Jun 14",
      financials: [
        { label: "Revenue (ttm)", value: "$110.9B" },
        { label: "Rev growth", value: "+126%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "75.0%", dir: "up" },
        { label: "Operating margin", value: "62.1%" },
        { label: "Free cash flow", value: "$56.5B" },
        { label: "Net cash", value: "$34.8B" },
      ],
      industry: {
        asOf: "Jun 13", sector: "Information Technology", subIndustry: "Semiconductors — accelerators",
        position: "Sets the cadence for AI training silicon; demand-bound, not supply-led.",
        peers: [
          { ticker: "AMD", name: "Advanced Micro Devices", changePct: 1.18 },
          { ticker: "AVGO", name: "Broadcom", changePct: 1.12 },
          { ticker: "TSM", name: "Taiwan Semiconductor", changePct: -0.92 },
        ],
        supplyChain: ["TSMC (foundry)", "SK Hynix (HBM)", "Vertiv (cooling)", "CoWoS (packaging)"],
      },
      findingsAsOf: "2h ago",
      findings: [
        { domain: "reuters.com", title: "Third source corroborates 2026 CoWoS capacity step-up", at: "2h ago", sig: 0.78 },
        { domain: "bloomberg.com", title: "Hyperscaler capex guidance reiterated into next FY", at: "6h ago", sig: 0.54 },
        { domain: "digitimes.com", title: "Channel note: lead times stable, no spot premium", at: "1d ago", sig: 0.33 },
      ],
      memoryAsOf: "Jun 14",
      memory: "On your watchlist since Mar. You care most about packaging capacity and HBM allocation as the lead indicators — I weight those when scoring significance here, and cross-check against your Jun 14 brief.",
    },
    {
      id: 4821, ticker: "TSM", name: "Taiwan Semiconductor", exchange: "NYSE", price: 188.04, changePct: -2.10,
      series: series(7, 30, 0.5), tier: "watchlist", alert: "±4% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: 0.18, sources: 9, asOf: "34m ago",
        read: "Net constructive but quieter than NVDA — the read leans on capex discipline and node-mix commentary. One transcript flagged utilization timing as the open question.",
        trend: [0.05, 0.09, 0.04, 0.12, 0.08, 0.14, 0.11, 0.16, 0.13, 0.18, 0.15, 0.18],
      },
      financialsAsOf: "FY filings · Jun 10",
      financials: [
        { label: "Revenue (ttm)", value: "$92.6B" },
        { label: "Rev growth", value: "+33%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "56.2%" },
        { label: "Operating margin", value: "45.7%" },
        { label: "Free cash flow", value: "$28.1B" },
        { label: "Net cash", value: "$41.0B" },
      ],
      industry: {
        asOf: "Jun 11", sector: "Information Technology", subIndustry: "Semiconductors — foundry",
        position: "The advanced-node bottleneck for the whole AI stack; capacity, not demand, is the throttle.",
        peers: [
          { ticker: "INTC", name: "Intel", changePct: -1.40 },
          { ticker: "GFS", name: "GlobalFoundries", changePct: 0.22 },
          { ticker: "UMC", name: "United Microelectronics", changePct: -0.31 },
        ],
        supplyChain: ["ASML (litho)", "NVDA (customer)", "AVGO (customer)", "Applied Materials"],
      },
      findingsAsOf: "5h ago",
      findings: [
        { domain: "ft.com", title: "Advanced-node utilization holds above 90% into Q3", at: "5h ago", sig: 0.61 },
        { domain: "sec.gov", title: "Capex guidance unchanged in latest filing", at: "1d ago", sig: 0.44 },
      ],
      memoryAsOf: "Jun 14",
      memory: "You track TSM as the supply read behind your NVDA thesis. I link findings here back to your advanced-packaging session and flag any divergence between the two.",
    },
    {
      id: 6001, ticker: "AVGO", name: "Broadcom", exchange: "NASDAQ", price: 1642.9, changePct: -1.60,
      series: series(11, 30, 1.0), tier: "watchlist", alert: "±5% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: 0.27, sources: 7, asOf: "1h ago",
        read: "Constructive on custom-silicon traction; networking commentary is the swing factor in the read.",
        trend: [0.12, 0.10, 0.16, 0.14, 0.20, 0.18, 0.24, 0.22, 0.25, 0.23, 0.28, 0.27],
      },
      financialsAsOf: "FY filings · Jun 09",
      financials: [
        { label: "Revenue (ttm)", value: "$54.5B" },
        { label: "Rev growth", value: "+44%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "63.0%" },
        { label: "Operating margin", value: "30.4%" },
        { label: "Free cash flow", value: "$19.4B" },
        { label: "Net debt", value: "$57.6B", dir: "down" },
      ],
      industry: {
        asOf: "Jun 10", sector: "Information Technology", subIndustry: "Semiconductors — custom & networking",
        position: "Second-source custom AI silicon plus the networking layer; diversified across the rack.",
        peers: [
          { ticker: "NVDA", name: "NVIDIA", changePct: 2.41 },
          { ticker: "MRVL", name: "Marvell", changePct: 0.84 },
          { ticker: "ANET", name: "Arista Networks", changePct: 1.05 },
        ],
        supplyChain: ["TSMC (foundry)", "Hyperscalers (customers)", "Optical module makers"],
      },
      findingsAsOf: "8h ago",
      findings: [
        { domain: "wsj.com", title: "Two more custom-accelerator design wins reported", at: "8h ago", sig: 0.57 },
        { domain: "theinformation.com", title: "Networking attach rate cited as the watch item", at: "1d ago", sig: 0.39 },
      ],
      memoryAsOf: "Jun 12",
      memory: "Added when you asked about second-source AI silicon. I treat its custom-compute findings as a cross-check on the NVDA concentration in your watchlist.",
    },
    {
      id: 6002, ticker: "ASML", name: "ASML", exchange: "NASDAQ", price: 1024.5, changePct: -1.40,
      series: series(19, 30, 0.3), tier: "industry_critical", alert: "±4% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: -0.14, sources: 8, asOf: "2h ago",
        read: "Leaning negative this week — export-control headlines dominate the read and outweigh order-book commentary. Tone is policy-driven, not fundamentals-driven.",
        trend: [0.08, 0.04, 0.02, -0.03, 0.01, -0.05, -0.02, -0.08, -0.06, -0.11, -0.09, -0.14],
      },
      financialsAsOf: "FY filings · Jun 08",
      financials: [
        { label: "Revenue (ttm)", value: "$29.8B" },
        { label: "Rev growth", value: "+3%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "51.5%" },
        { label: "Operating margin", value: "31.8%" },
        { label: "Free cash flow", value: "$3.2B" },
        { label: "Net cash", value: "$5.1B" },
      ],
      industry: {
        asOf: "Jun 09", sector: "Information Technology", subIndustry: "Semiconductor equipment — litho",
        position: "Sole EUV supplier; the single chokepoint upstream of every advanced node.",
        peers: [
          { ticker: "AMAT", name: "Applied Materials", changePct: -0.18 },
          { ticker: "LRCX", name: "Lam Research", changePct: -0.52 },
          { ticker: "KLAC", name: "KLA Corp", changePct: 0.11 },
        ],
        supplyChain: ["Zeiss (optics)", "TSMC (customer)", "Intel (customer)", "Samsung (customer)"],
      },
      findingsAsOf: "2h ago",
      findings: [
        { domain: "reuters.com", title: "Draft export-license framework circulates", at: "2h ago", sig: 0.66 },
        { domain: "asml.com", title: "Order book commentary unchanged at investor update", at: "2d ago", sig: 0.41 },
      ],
      memoryAsOf: "Jun 13",
      memory: "Marked industry-critical, not on your core watchlist — I watch it as the upstream constraint. You flagged China revenue mix sensitivity as the thing to track; I scored that session for you on Jun 13.",
    },
    {
      id: 6003, ticker: "VRT", name: "Vertiv", exchange: "NYSE", price: 102.8, changePct: 0.90,
      series: series(23, 30, 1.2), tier: "watchlist", alert: "±6% / day", quoteAt: "delayed 15m",
      sentiment: {
        value: 0.51, sources: 6, asOf: "47m ago",
        read: "Most constructive name on your list — liquid-cooling demand commentary is corroborated across orders, backlog, and two channel checks. Small-cap source breadth is the caveat.",
        trend: [0.20, 0.24, 0.22, 0.30, 0.28, 0.36, 0.33, 0.41, 0.39, 0.46, 0.48, 0.51],
      },
      financialsAsOf: "FY filings · Jun 07",
      financials: [
        { label: "Revenue (ttm)", value: "$8.6B" },
        { label: "Rev growth", value: "+17%", dir: "up", note: "YoY" },
        { label: "Gross margin", value: "36.2%" },
        { label: "Operating margin", value: "16.9%" },
        { label: "Free cash flow", value: "$1.1B" },
        { label: "Net debt", value: "$2.0B", dir: "down" },
      ],
      industry: {
        asOf: "Jun 08", sector: "Industrials", subIndustry: "Data-center power & thermal",
        position: "Picks-and-shovels on AI buildout — thermal and power density is the binding constraint at the rack.",
        peers: [
          { ticker: "ETN", name: "Eaton", changePct: 0.74 },
          { ticker: "NVT", name: "nVent Electric", changePct: 1.30 },
          { ticker: "SMCI", name: "Super Micro", changePct: 2.88 },
        ],
        supplyChain: ["NVDA (demand driver)", "Hyperscalers (customers)", "Colo operators"],
      },
      findingsAsOf: "47m ago",
      findings: [
        { domain: "barrons.com", title: "Liquid-cooling backlog cited up sharply QoQ", at: "47m ago", sig: 0.69 },
        { domain: "datacenterdynamics.com", title: "Two hyperscaler cooling retrofits confirmed", at: "9h ago", sig: 0.48 },
      ],
      memoryAsOf: "Jun 11",
      memory: "You added VRT to play the AI buildout one layer down from silicon. I link its findings to data-center capex signals and watch the small-cap source breadth before I treat anything as material.",
    },
    // Discovered by the agent from autonomous research (session #88) and stored on its own.
    { ...CANDIDATES.ASX, addedBy: "agent" },
  ];

  const TODAY = {
    generatedAt: "9m ago",
    date: "Wednesday, June 18",
    headline: "Advanced packaging is the day's throughline",
    body: "Semis lead the pre-open bid on firming HBM pricing; three converging signals in advanced packaging overnight. Energy quiet into inventories. No watchlist name cleared the alert threshold.",
    threads: [
      "TSMC's CoWoS step-up now has a third independent corroboration — the supply constraint behind your NVDA thesis is easing at the margin.",
      "Contract HBM pricing is firming faster than spot; the agent reads the contract print as the durable signal into Q3.",
      "Export-control headlines are back on ASML — a policy read, not a fundamentals one, but it caps near-term China cadence.",
    ],
  };

  // NEWS — today's live wire: the significant articles, reports, filings and clips the scraper
  // matched to the world it's watching. "used" = pulled into active research; "related" = a scraper
  // match kept for context. Ephemeral — nothing is stored unless you research it.
  const NEWS = [
    {
      id: "n1", kind: "report", media: "video", mediaLabel: "live · Gulf correspondent",
      topic: "Tanker detained near Hormuz; Iran warns it can close the strait",
      industry: "Energy · oil & shipping", macro: "Energy shock · inflation risk",
      excerpt: "The IRGC says it can shut the strait 'within hours'. Roughly a fifth of seaborne crude and a third of global LNG transit it — the disruption premium is already in crude and freight.",
      source: "reuters.com", url: "https://www.reuters.com", at: "3h ago",
      relevance: "used", relTo: "Strait of Hormuz closure — pass-through to my book",
    },
    {
      id: "n2", kind: "article", media: "image", mediaLabel: "chart · Brent intraday",
      topic: "Brent gaps to $94 as a war-risk premium returns to crude",
      industry: "Commodities · crude", macro: "Headline inflation · Fed repricing",
      excerpt: "The biggest one-day move since the last Gulf scare. The agent's read: sustained above $90 into the next CPI is what makes the hawkish rate repricing stick.",
      source: "bloomberg.com", url: "https://www.bloomberg.com", at: "2h ago",
      relevance: "used", relTo: "Energy-driven inflation — the Fed reaction function",
    },
    {
      id: "n3", kind: "report", media: "video", mediaLabel: "live · Pentagon briefing",
      topic: "US carrier strike group ordered into the Gulf",
      industry: "Defense · naval", macro: "Geopolitical risk premium",
      excerpt: "The deployment is meant to keep the strait open — and is itself the signal markets are pricing. Defense replenishment names catch a bid on the redeployment.",
      source: "defensenews.com", url: "https://www.defensenews.com", at: "5h ago",
      relevance: "related", relTo: "Strait of Hormuz closure — pass-through to my book",
    },
    {
      id: "n4", kind: "article", media: "image", mediaLabel: "photo · strait transit",
      topic: "PLA extends drills around Taiwan into a third day",
      industry: "Geopolitics · semiconductors", macro: "Supply concentration",
      excerpt: "No fab output affected, but the timing — with US assets pulled toward the Gulf — re-prices the standing tail risk under the entire advanced-node chain.",
      source: "reuters.com", url: "https://www.reuters.com", at: "6h ago",
      relevance: "related", relTo: "Taiwan supply concentration — scenario tree",
    },
    {
      id: "n5", kind: "filing", media: "image", mediaLabel: "document · draft framework",
      topic: "Draft US export-license framework circulates in Washington",
      industry: "Semiconductor equipment · lithography", macro: "US–China export controls",
      excerpt: "Would widen the China-mix downside for litho and WFE. Policy-driven — it caps cadence more than the annual total, and concentrates on ASML.",
      source: "reuters.com", url: "https://www.reuters.com", at: "8h ago",
      relevance: "related", relTo: "Export-control draft — ASML China-mix sensitivity",
    },
    {
      id: "n6", kind: "report", media: "image", mediaLabel: "report · supplier note",
      topic: "TSMC lifts its 2026 advanced-packaging capacity guidance",
      industry: "Semiconductors · packaging", macro: "AI capex cycle",
      excerpt: "A third independent source corroborates the CoWoS step-up — the binding constraint on shippable accelerator volume eases. The week's one clean tailwind, buried by the risk-off tape.",
      source: "digitimes.com", url: "https://www.digitimes.com", at: "7h ago",
      relevance: "used", relTo: "CoWoS 2026 step-up — names most exposed",
    },
  ];

  const BUDGET = { spent: 1_284_000, cap: 2_000_000 };

  // WORLD — the always-on surveillance layer. The cheap scraper continuously stores prices, prints
  // and headlines; the agent reads them and writes the synthesis. Organized by the research
  // database's top-level domains, lead by an OVERVIEW that threads one origin event down through
  // every domain to the names you hold. Reads & observations only — never buy/sell/hold.
  const WORLD = {
    sweptAt: "2m ago",
    asOf: "Jun 20 · 13:18 UTC",
    regime: "Risk-off · Gulf energy shock",

    // OVERVIEW — the agent's synthesis across every domain it swept overnight: one briefing that
    // names the origin event and threads it down through macro, industry and the market. The
    // "aspects" list is the overview of all aspects found — one declarative line per domain.
    overview: {
      at: "06:31 ET · refired 8m ago",
      retention: "kept 7 days, then a brief memory",
      source: "generated before the open, then re-fired on significance — not on a clock",
      headline: "An energy shock out of the Gulf is colliding with a disinflation that was nearly won.",
      body:
        "Overnight the world's most important oil chokepoint became the story. Iran's IRGC detained a tanker and threatened to close the Strait of Hormuz after a strike on its soil; the US moved a carrier group into the Gulf. Roughly a fifth of seaborne crude and a third of global LNG transit that strait — Brent gapped +6.4% to $94 and clean-tanker rates doubled. The agent traced the event through every domain it watches: it re-arms the inflation the Fed had been declaring beaten, pushes the next cut off the table, bids energy and defense, and lays a fresh risk premium over the long-duration tech that dominates your book.",
      context:
        "What it means for you: the disinflation trade that has carried your semis is on hold until the strait clears. Energy and defense lead the tape; rates are caught between a growth scare and an inflation scare; and renewed Taiwan headlines stack a second supply-risk premium under the AI names. No watchlist name tripped an alert — but the regime beneath them changed tonight.",
      aspects: [
        { domain: "Geopolitics", jump: "geopolitics", sig: 0.91, horizon: "now",
          line: "Iran threatens to close the Strait of Hormuz; a US carrier group redeploys. This is the origin — it sets everything below it in motion." },
        { domain: "Macroeconomics", jump: "macro", sig: 0.78, horizon: "now",
          line: "The crude spike threatens to re-accelerate headline inflation; futures price out the next cut and the 2-year jumps 9bp. Disinflation paused, not reversed." },
        { domain: "Industry trends", jump: "industries", sig: 0.64, horizon: "ahead",
          line: "The AI buildout holds — TSMC lifted 2026 packaging capacity — but energy, defense and shipping are the week's real movers." },
        { domain: "General market", jump: "market", sig: 0.71, horizon: "now",
          line: "Risk-off: crude, gold and the dollar bid, semis sold on the duration premium, VIX back to 19. Your book is net lower into the open." },
      ],
    },

    // The five things the agent checks first in this regime — the live ribbon at the top.
    tape: [
      { label: "Brent", value: "$94.10", chg: +6.4, unit: "%", series: series(61, 24, 1.6) },
      { label: "US 10Y", value: "4.41%", chg: +7, unit: "bp", series: series(62, 24, 0.5) },
      { label: "Gold", value: "$2,418", chg: +1.5, unit: "%", series: series(64, 24, 0.6) },
      { label: "VIX", value: "19.2", chg: +21, unit: "%", series: series(65, 24, 0.9) },
      { label: "S&P 500", value: "5,431", chg: -1.1, unit: "%", series: series(66, 24, -0.6) },
    ],

    // SIGNALS — the few movements that actually MEAN something, split by horizon: what matters NOW
    // vs. what's building and will matter AHEAD. Each carries the fact + data, the agent's read, the
    // propagation chain, the names it touches, and (on expand) the reports behind it and a thread
    // into research. `sig` orders within a horizon; it is internal and never shown to the user.
    signals: [
      {
        id: "s1", sig: 0.91, horizon: "now", domain: "Geopolitics",
        fact: "Iran threatened to close the Strait of Hormuz; a US carrier group is redeploying to the Gulf.",
        datum: "~20% of seaborne crude · ~33% of LNG · Brent +6.4% to $94 · clean-tanker rates 2×",
        chain: ["Strait closure threatened", "Crude & freight spike", "Inflation re-arms, risk-off"],
        affects: [{ t: "NVDA", dir: "headwind" }, { t: "TSM", dir: "headwind" }, { t: "VRT", dir: "mixed" }],
        sources: 9,
        read: "The origin event and the most significant print in weeks. It doesn't hit your holdings directly — none touch the Gulf — but it propagates: a sustained crude spike re-arms inflation, holds the Fed, and re-prices every long-duration name. Your semis carry that premium until the strait clears.",
        detail: "Closure is the tail, not the base case — the strait has been threatened before and never fully shut, and the Fifth Fleet is positioned to keep it open. But the agent scores the disruption premium as durable for days, not hours: insurers have pulled war-risk cover on Gulf transits, and re-routing around Africa adds ~2 weeks per cargo. The read for your book is macro, not name-level: watch the 10-year and headline CPI expectations, not the tape on any single holding.",
        findings: [
          { source: "reuters.com", title: "IRGC detains tanker, warns it can close Hormuz 'within hours'", at: "3h ago", sig: 0.86, url: "https://www.reuters.com" },
          { source: "lloydslist.com", title: "War-risk insurance pulled on Gulf transits; rates double", at: "2h ago", sig: 0.71, url: "https://lloydslist.com" },
          { source: "bloomberg.com", title: "Carrier strike group ordered into the Gulf", at: "5h ago", sig: 0.64, url: "https://www.bloomberg.com" },
        ],
        research: "Strait of Hormuz closure — pass-through to my book",
      },
      {
        id: "s2", sig: 0.78, horizon: "now", domain: "Macroeconomics",
        fact: "Rate-cut expectations unwound — futures took the next Fed cut off the table as the energy spike hit.",
        datum: "Sept cut priced 78% → 34% · US 2Y +9bp to 4.86% · breakevens +11bp",
        chain: ["Crude spike", "Headline inflation re-accelerates", "Fed holds, front end repriced"],
        affects: [{ t: "NVDA", dir: "headwind" }, { t: "ASML", dir: "headwind" }, { t: "TSM", dir: "headwind" }],
        sources: 6,
        read: "The macro transmission of the Gulf shock. Core disinflation is intact, but the Fed reacts to headline — and headline just got an energy problem. Higher-for-longer is the direct headwind to the high-duration tech that dominates your watchlist.",
        detail: "The move is in expectations, not data: no print has changed, but fed-funds futures and breakevens repriced within the hour the Hormuz headline crossed. If crude holds above $90 into the next CPI, the agent expects the hawkish repricing to stick; if the strait de-escalates, it unwinds as fast as it came. This single variable matters more for your book this week than any company-level news.",
        findings: [
          { source: "cmegroup.com", title: "Fed-funds futures unwind September cut probability", at: "2h ago", sig: 0.70, url: "https://www.cmegroup.com" },
          { source: "ft.com", title: "Oil shock revives the inflation question for central banks", at: "4h ago", sig: 0.58, url: "https://www.ft.com" },
        ],
        research: "Energy-driven inflation — the Fed reaction function",
      },
      {
        id: "s3", sig: 0.66, horizon: "ahead", domain: "Geopolitics · Industries",
        fact: "China opened a third day of military exercises encircling Taiwan as the Gulf drew US attention.",
        datum: "PLA drills, 3rd day · advanced-node & CoWoS capacity ~90% concentrated on the island",
        chain: ["Taiwan pressure rises", "Supply-concentration premium", "AI-silicon tail risk re-prices"],
        affects: [{ t: "TSM", dir: "headwind" }, { t: "NVDA", dir: "headwind" }],
        sources: 5,
        read: "A second, separate supply-risk premium — and the timing is the story. With US carrier assets pulled toward the Gulf, the agent reads the exercises as opportunistic signalling. No production is affected, but the standing tail risk under your entire AI stack got louder this week.",
        detail: "Nothing physical has changed at the fabs — TSMC is running normally and no shipments are disrupted. What changed is the probability the market assigns to the tail: with two flashpoints live at once and US attention divided, the concentration risk under TSM and NVDA is being re-priced rather than realised. The line to watch is whether drills cross from exercise posture toward a blockade.",
        findings: [
          { source: "reuters.com", title: "PLA extends drills around Taiwan into third day", at: "6h ago", sig: 0.62, url: "https://www.reuters.com" },
          { source: "csis.org", title: "Advanced-node concentration remains the structural chokepoint", at: "1d ago", sig: 0.49, url: "https://www.csis.org" },
        ],
        research: "Taiwan supply concentration — scenario tree",
      },
      {
        id: "s4", sig: 0.58, horizon: "ahead", domain: "Industries",
        fact: "TSMC lifted its 2026 advanced-packaging capacity guidance — a third independent source corroborated the step-up.",
        datum: "CoWoS capacity guide raised · 3rd corroborating source",
        chain: ["Packaging capacity steps up", "Accelerator constraint eases", "Shippable AI volume rises"],
        affects: [{ t: "NVDA", dir: "tailwind" }, { t: "TSM", dir: "tailwind" }],
        sources: 4,
        read: "The week's one clean tailwind, and a reminder the structural AI story is intact underneath the macro noise. Packaging is the binding constraint on accelerator volume; easing it reads straight through to units NVDA can ship. Today's risk-off tape buries it — but it survives the headlines.",
        detail: "This is the kind of slow, corroborated supply signal the agent weights heavily because it changes the denominator, not the sentiment. It won't move the tape on a day the Gulf owns the headlines, but it's the durable thread under your book — the reason the agent still scores AI-silicon a structural tailwind even as it sells off today.",
        findings: [
          { source: "digitimes.com", title: "OSAT packaging allocation lifts for 2026", at: "7h ago", sig: 0.56, url: "https://www.digitimes.com" },
          { source: "reuters.com", title: "Third supplier note corroborates CoWoS step-up", at: "1d ago", sig: 0.52, url: "https://www.reuters.com" },
        ],
        research: "CoWoS 2026 step-up — names most exposed",
      },
    ],

    // GEOPOLITICS — the origin layer. Each event leads with the neutral fact + the numbers; the
    // agent's read, the propagation chain, the reports behind it and the names threaded sit on the
    // expand. News & events live INSIDE the event they belong to.
    geopolitics: {
      asOf: "continuously scraped",
      intro: "The origin layer. Most of what moves your book starts upstream in the physical world — who controls the shipping lanes, who can make the advanced chips, who writes the export rules. The agent watches these first, then threads each one down to the names you hold. Open any event for the full read, the reports behind it, and the names it touches.",
      events: [
        {
          id: "g1", sig: 0.91, horizon: "now", title: "Iran threatens to close the Strait of Hormuz", region: "Gulf · Iran", risk: "acute", since: "12h",
          fact: "Iran's IRGC detained a tanker and warned it can close the strait 'within hours'; the US ordered a carrier group into the Gulf.",
          datum: "~20% of seaborne crude · ~33% of LNG · Brent +6.4% to $94 · tanker rates 2×",
          media: { kind: "video", label: "live · Gulf correspondent", live: true },
          read: "The single most significant event the scraper surfaced this cycle, and the origin of today's whole tape. A sustained closure premium re-arms inflation and forces the Fed to hold — which is how a Gulf shipping story becomes a headwind on your semiconductors.",
          chain: ["Strait threatened", "Crude & LNG freight spike", "Headline inflation re-arms", "Fed holds → duration premium on tech"],
          threads: ["Crude", "Tankers", "Defense", "Inflation", "NVDA", "TSM"],
          detail: "Full closure remains the tail case — the strait has been threatened repeatedly and never fully shut, and the Fifth Fleet exists to keep it open. But the disruption premium is real now: insurers pulled war-risk cover on Gulf transits this morning and re-routing around Africa adds roughly two weeks per cargo. The agent is tracking three escalation markers — a second seizure, a mining report, or a formal US rules-of-engagement change. Any one would move this from premium to event.",
          findings: [
            { source: "reuters.com", title: "IRGC detains tanker, warns it can close Hormuz 'within hours'", at: "3h ago", sig: 0.86, url: "https://www.reuters.com" },
            { source: "lloydslist.com", title: "War-risk insurance pulled on Gulf transits; freight rates double", at: "2h ago", sig: 0.71, url: "https://lloydslist.com" },
            { source: "bloomberg.com", title: "US carrier strike group ordered into the Gulf", at: "5h ago", sig: 0.64, url: "https://www.bloomberg.com" },
          ],
          research: "Strait of Hormuz closure — pass-through to my book",
        },
        {
          id: "g2", sig: 0.66, horizon: "ahead", title: "PLA exercises encircle Taiwan for a third day", region: "Taiwan Strait", risk: "elevated", since: "3 days",
          fact: "China extended live-fire drills around Taiwan into a third day while US carrier assets shifted toward the Gulf.",
          datum: "Advanced-node & CoWoS capacity ~90% concentrated on the island",
          media: { kind: "image", label: "satellite · strait transit" },
          read: "A second supply-risk premium running in parallel with the Gulf. No fab output is affected, but the standing tail risk under your entire AI stack — TSM and NVDA both — is re-pricing louder while US attention is divided.",
          chain: ["Taiwan pressure rises", "Supply-concentration premium", "AI-silicon tail risk re-prices"],
          threads: ["TSM", "NVDA", "Advanced packaging"],
          detail: "Production is normal; this is a probability story, not a supply story. The agent's read is that the timing — coinciding with the Hormuz crisis — is deliberate signalling rather than a prelude to blockade. The score changes only on a move from exercise posture toward sustained airspace or maritime closure, which would convert the premium into a genuine supply event for the whole advanced-node chain.",
          findings: [
            { source: "reuters.com", title: "PLA extends drills around Taiwan into third day", at: "6h ago", sig: 0.62, url: "https://www.reuters.com" },
            { source: "csis.org", title: "Advanced-node concentration remains the structural chokepoint", at: "1d ago", sig: 0.49, url: "https://www.csis.org" },
          ],
          research: "Taiwan supply concentration — scenario tree",
        },
        {
          id: "g3", sig: 0.59, horizon: "ahead", title: "US circulates a tighter AI-chip export framework", region: "US · China", risk: "elevated", since: "active",
          fact: "A draft US export-license framework would widen restrictions on advanced lithography and AI accelerators bound for China.",
          datum: "China mix ~30% for litho equipment · draft text circulating in Washington",
          read: "Policy, not fundamentals — but it's the dominant overhang on the equipment makers. It widens the China-mix downside for ASML specifically and caps the cadence of advanced-node tool sales, even with order books steady.",
          chain: ["US tightens export rules", "China-mix downside widens", "Litho & WFE cadence capped"],
          threads: ["ASML", "Semi equipment", "TSM"],
          detail: "The draft is not final and the lenient and strict cases are far apart — the spread is wider than the consensus model implies, which matters more for the timing of revenue than the annual total. The agent treats this as a cadence risk concentrated in ASML, not a demand problem for the group. The clause to watch is its treatment of mature-node tools — it decides whether the hit stays contained to the leading edge.",
          findings: [
            { source: "reuters.com", title: "Draft export-license framework circulates", at: "8h ago", sig: 0.66, url: "https://www.reuters.com" },
            { source: "asml.com", title: "Order-book commentary unchanged at investor update", at: "2d ago", sig: 0.41, url: "https://www.asml.com" },
          ],
          research: "Export-control draft — ASML China-mix sensitivity",
        },
        {
          id: "g4", sig: 0.44, horizon: "now", title: "European gas firms on Gulf LNG-supply fears", region: "Europe", risk: "watch", since: "1 day",
          fact: "European gas benchmarks rose on fears the Hormuz disruption pulls Qatari LNG into a tighter global market.",
          datum: "TTF +8% · ~20% of traded LNG routes through the strait",
          read: "A second-order effect of the Gulf event, not a standalone story. It widens the European industrial-cost headwind and feeds the same inflation read driving the Fed repricing — relevant to your book only through the macro channel.",
          chain: ["Hormuz LNG risk", "European gas tightens", "Industrial cost & inflation pressure"],
          threads: ["Nat gas", "European industry", "Inflation"],
          detail: "Europe rebuilt storage and diversified off Russian pipeline gas, so this is a price event rather than a shortage one — but a sustained Gulf disruption tightens the entire seaborne LNG market at once. The agent keeps it in the geopolitics layer because its only path to your holdings is the macro inflation channel it already scores under the Fed-repricing signal.",
          findings: [
            { source: "bloomberg.com", title: "European gas jumps on Gulf LNG-supply concern", at: "1d ago", sig: 0.44, url: "https://www.bloomberg.com" },
          ],
          research: "Gulf LNG disruption — European gas pass-through",
        },
      ],
    },

    // MACROECONOMICS — the channel through which the Gulf shock reaches your book. The data hasn't
    // changed yet; expectations have. Headline is where the energy spike bites; core still eases.
    macro: {
      asOf: "latest prints · futures repricing live",
      intro: "The state of the economies the agent tracks, and the channel through which the Gulf shock reaches your book. Core disinflation is intact — but the Fed reacts to headline, and headline just got an energy problem.",
      economies: [
        { code: "US", name: "United States", regime: "Late cycle · inflation risk back", metrics: [["GDP", "+2.4%"], ["Core PCE", "2.6%"], ["Headline", "3.1%"], ["Unemp.", "4.1%"]], note: "Core disinflation intact, but headline carries the energy spike. Futures took the next cut off the table within the hour the Hormuz headline crossed." },
        { code: "EA", name: "Euro area", regime: "Stagnation · energy-exposed", metrics: [["GDP", "+0.6%"], ["CPI", "2.5%"], ["Unemp.", "6.4%"]], note: "Most exposed to the Gulf shock through gas. The ECB was ahead of the Fed on cuts; an energy-led inflation bump complicates that path." },
        { code: "CN", name: "China", regime: "Stimulus-supported", metrics: [["GDP", "+4.8%"], ["CPI", "0.3%"], ["PMI", "50.8"]], note: "Disinflationary at home and a major crude importer — most exposed of the three to a sustained oil spike, and central to the semiconductor supply read." },
      ],
      indicators: [
        { label: "Headline inflation", sub: "US CPI, YoY — the energy-sensitive one", value: "3.1%", chg: +0.2, unit: "pp", neutral: true, series: series(33, 24, 0.4) },
        { label: "Core inflation", sub: "US core PCE, YoY — still easing", value: "2.6%", chg: -0.1, unit: "pp", neutral: true, series: series(31, 24, -0.2) },
        { label: "Policy rate", sub: "Fed funds, upper — on hold", value: "4.75%", chg: 0, unit: "bp", neutral: true, series: series(34, 24, 0.0) },
        { label: "Next-cut odds", sub: "September, futures-implied", value: "34%", chg: -44, unit: "pp", neutral: true, series: series(35, 24, -1.1) },
        { label: "Employment", sub: "US unemployment rate", value: "4.1%", chg: +0.1, unit: "pp", neutral: true, series: series(32, 24, 0.1) },
        { label: "US 2-year", sub: "Front end — repriced hawkish", value: "4.86%", chg: +9, unit: "bp", neutral: true, series: series(36, 24, 0.6) },
      ],
      read: "The whole macro story today is one transmission: a Gulf energy shock landing on a headline number that was almost home. Core is fine; the Fed reacts to headline. If Brent holds above $90 into the next CPI, the hawkish repricing sticks and the duration premium on your semis stays on. If the strait de-escalates, it unwinds as fast as it came — this single variable matters more for your book this week than any company-level news.",
    },

    // INDUSTRY TRENDS — the section read; the cards themselves come from the INDUSTRIES array so
    // each opens its deep research (supply chain, news, constituents).
    industries: {
      asOf: "rolled up from coverage",
      read: "Two stories at once. The structural one is intact and even improved — AI compute buildout, with TSMC's packaging step-up easing the binding constraint. The cyclical one is today's tape: a risk-off, higher-for-longer regime that sells long-duration tech and bids energy, defense and shipping. Your book sits on the structural side; the week belongs to the cyclical one.",
    },

    // GENERAL MARKET — how the shock shows up in prices. Indices + cross-asset, then your names as
    // movers (resolved from the watchlist). Reads & observations only.
    market: {
      asOf: "delayed 15m",
      intro: "How the shock is showing up in prices. Energy, gold and the dollar are bid; long-duration tech — your book — carries the duration premium. Open any name for its full record.",
      indices: [
        { label: "S&P 500", value: "5,431", chg: -1.1, unit: "%" },
        { label: "Nasdaq 100", value: "19,240", chg: -1.6, unit: "%" },
        { label: "Dow", value: "40,180", chg: -0.5, unit: "%" },
        { label: "Russell 2000", value: "2,012", chg: -1.4, unit: "%" },
        { label: "Brent crude", value: "$94.10", chg: +6.4, unit: "%" },
        { label: "Gold", value: "$2,418", chg: +1.5, unit: "%" },
        { label: "DXY", value: "105.40", chg: +0.6, unit: "%" },
        { label: "VIX", value: "19.2", chg: +21, unit: "%" },
      ],
      read: "Textbook risk-off, energy-led. The cross-asset move is internally consistent — crude, gold, dollar and vol up together, equities and the long end of tech down. Your watchlist is net lower not on any company news but on the macro premium above it. The agent flags no alert-level move in a single holding; the signal is the regime, not the name.",
    },
  };

  // INDUSTRIES — the deep research surface. For each industry the scraper continuously gathers
  // movement, supply-chain disruptions, and news; the agent then researches it in depth and writes
  // the qualitative understanding. Each carries: what the business/industry actually is (qualitative),
  // the numbers (quantitative), the supply chain in tiers, current news & events affecting it, and
  // the constituent names with sentiment + a few key fundamentals. Reads & observations only.
  const INDUSTRIES = [
    {
      id: "ind-ai-silicon", name: "AI accelerator silicon", sector: "Information Technology",
      bias: "tailwind", movePct: -1.8, asOf: "delayed 15m", researchedAt: "1h ago",
      telemetry: { tools: 21, sources: 14, inTok: "61.2k", outTok: "3.4k", elapsed: "1h 40m" },
      overview:
        "The chips that train and run large AI models — GPUs and custom accelerators. The business is selling scarce compute: design the silicon, secure advanced-node wafers and packaging, and ship systems faster than rivals. Margins are exceptional while demand outruns supply, so the whole industry is gated less by orders than by how many units the foundry-and-packaging chain can physically produce.",
      whatsHappening:
        "Caught between two forces. The structural story improved — a third source corroborated TSMC's 2026 CoWoS packaging step-up, easing the supply constraint on shippable volume. But the names sell off today: the Gulf energy shock and renewed Taiwan drills stack a duration-and-supply risk premium over the whole group.",
      metrics: [
        { label: "Group rev growth", value: "+58%", dir: "up", note: "YoY, ttm" },
        { label: "Median gross margin", value: "61%", dir: "up" },
        { label: "Fwd demand visibility", value: "High" },
        { label: "Binding constraint", value: "Packaging" },
      ],
      supplyChain: {
        upstream: ["ASML (EUV litho)", "Applied Materials / Lam (WFE)", "SK Hynix · Micron (HBM)"],
        core: ["TSMC (advanced node)", "ASE / Amkor (CoWoS packaging)"],
        downstream: ["Hyperscalers (Azure, AWS, GCP)", "Server OEMs (Dell, SMCI)", "Vertiv (power & thermal)"],
      },
      drivers: [
        { label: "CoWoS packaging capacity", dir: "tailwind", note: "the binding constraint — now stepping up for 2026" },
        { label: "HBM allocation", dir: "tailwind", note: "contract pricing firming; supply matched to accelerators" },
        { label: "Export controls", dir: "headwind", note: "China-mix downside for the most exposed names" },
      ],
      news: [
        { kind: "report", topic: "TSMC lifts advanced-packaging capacity guidance for 2026", source: "reuters.com", at: "1h ago", excerpt: "Third independent supplier note corroborates the CoWoS step-up — capacity, not demand, stays the throttle on shippable accelerator volume.", url: "https://www.reuters.com" },
        { kind: "article", topic: "Contract HBM pricing firms ahead of spot into Q3", source: "trendforce.com", at: "2h ago", excerpt: "Memory leads for a second week; matched HBM supply is the gating input for accelerator builds.", url: "https://www.trendforce.com" },
        { kind: "filing", topic: "Hyperscaler reiterates elevated capex into next FY", source: "sec.gov", at: "6h ago", excerpt: "Demand-side guidance unchanged — the order book stays well ahead of the supply chain's ability to deliver.", url: "https://www.sec.gov" },
      ],
      constituents: [
        { ticker: "NVDA", name: "NVIDIA", changePct: 2.41, sent: 0.42, metrics: [["Rev gr.", "+126%"], ["Gross m.", "75%"], ["FCF", "$56.5B"]], note: "Sets the cadence; most unit-constrained on packaging, so added capacity flows most directly to volume." },
        { ticker: "AVGO", name: "Broadcom", changePct: 1.12, sent: 0.27, metrics: [["Rev gr.", "+44%"], ["Gross m.", "63%"], ["FCF", "$19.4B"]], note: "Second-source custom silicon plus networking; benefits one step removed from the lead allocation." },
        { ticker: "AMD", name: "Advanced Micro Devices", changePct: 1.18, sent: 0.14, metrics: [["Rev gr.", "+9%"], ["Gross m.", "53%"], ["FCF", "$4.1B"]], note: "Credible #2 GPU; share gains hinge on software stack maturity and its own packaging allocation." },
      ],
      agentRead:
        "Qualitatively this is one coherent bet — AI compute buildout — with the supply chain as the only real variable. Quantitatively the businesses are exceptional (growth, margin, cash). The risk isn't the companies, it's upstream: packaging capacity and the export-control overhang. The week's news eases the first and leaves the second intact.",
    },
    {
      id: "ind-dc-power", name: "Data-center power & thermal", sector: "Industrials",
      bias: "tailwind", movePct: 0.4, asOf: "delayed 15m", researchedAt: "3h ago",
      telemetry: { tools: 14, sources: 9, inTok: "33.8k", outTok: "2.1k", elapsed: "52m" },
      overview:
        "The picks-and-shovels of the AI buildout: the power distribution and liquid-cooling gear that lets dense accelerator racks run without melting. As chips draw more watts per rack, thermal and power density become the binding constraint at the facility — so this industry sells into the same demand wave as silicon, one layer down, with longer-cycle, backlog-driven revenue.",
      whatsHappening:
        "Holding up better than the rest of tech. AI-buildout demand is real and order-backed — two more hyperscaler liquid-cooling retrofits confirmed — and as a shorter-duration industrial it carries less of the rate premium hitting the silicon names today.",
      metrics: [
        { label: "Group rev growth", value: "+17%", dir: "up", note: "YoY, ttm" },
        { label: "Median op. margin", value: "16%", dir: "up" },
        { label: "Backlog trend", value: "Rising", dir: "up" },
        { label: "Binding constraint", value: "Power density" },
      ],
      supplyChain: {
        upstream: ["Copper & busbar", "Power semis (SiC)", "Compressor / pump OEMs"],
        core: ["Vertiv · Eaton · nVent (power & thermal)"],
        downstream: ["Colocation operators", "Hyperscalers", "Enterprise AI clusters"],
      },
      drivers: [
        { label: "Rack power density", dir: "tailwind", note: "next-gen accelerators force liquid cooling retrofits" },
        { label: "Grid interconnect queues", dir: "headwind", note: "power availability gates new site timing" },
        { label: "Copper input cost", dir: "mixed", note: "firming demand tell, but a margin watch item" },
      ],
      news: [
        { kind: "article", topic: "Two hyperscalers confirm liquid-cooling retrofits", source: "datacenterdynamics.com", at: "5h ago", excerpt: "Cooling backlog corroborated across orders and two channel checks — demand one layer down from the silicon.", url: "https://www.datacenterdynamics.com" },
        { kind: "report", topic: "Copper extends higher on physical-demand bid", source: "bloomberg.com", at: "4h ago", excerpt: "Metal leading the dollar move reads as real buildout demand, not just a weak-dollar effect.", url: "https://www.bloomberg.com" },
      ],
      constituents: [
        { ticker: "VRT", name: "Vertiv", changePct: 3.05, sent: 0.51, metrics: [["Rev gr.", "+17%"], ["Op. m.", "17%"], ["Backlog", "Rising"]], note: "Most constructive read on the list — liquid-cooling backlog cited up sharply QoQ; small-cap source breadth is the caveat." },
        { ticker: "ETN", name: "Eaton", changePct: 0.74, sent: 0.22, metrics: [["Rev gr.", "+8%"], ["Op. m.", "23%"], ["FCF", "$3.5B"]], note: "Diversified electrical; data-center is the fastest-growing slice but not the whole story." },
        { ticker: "NVT", name: "nVent Electric", changePct: 1.30, sent: 0.19, metrics: [["Rev gr.", "+11%"], ["Op. m.", "19%"], ["FCF", "$0.6B"]], note: "Enclosures & liquid-cooling; higher-beta way to play rack thermal." },
      ],
      agentRead:
        "The cleanest second-derivative play on AI compute. The qualitative story — power and thermal as the new bottleneck — is corroborated quantitatively by rising backlogs and the copper bid. The watch item is grid interconnect timing, which can push revenue right even when demand is firm.",
    },
    {
      id: "ind-semi-equip", name: "Semiconductor equipment", sector: "Information Technology",
      bias: "headwind", movePct: -1.5, asOf: "delayed 15m", researchedAt: "2h ago",
      telemetry: { tools: 17, sources: 11, inTok: "47.0k", outTok: "2.8k", elapsed: "1h 05m" },
      overview:
        "The tool-makers that build the machines every chip fab needs — lithography, deposition, etch, inspection. It's a concentrated, high-margin oligopoly sitting upstream of the entire industry, with ASML the sole EUV supplier. Because the tools are dual-use and export-sensitive, this is the one corner of tech where geopolitics, not end demand, often sets the tape.",
      whatsHappening:
        "Weakest corner of tech. A tighter draft US export-license framework is circulating in Washington, widening the China-mix downside for litho and WFE — and today's risk-off tape compounds it. Policy, not fundamentals: order books are steady, but the overhang sets the price.",
      metrics: [
        { label: "Group rev growth", value: "+4%", dir: "up", note: "YoY, ttm" },
        { label: "Median gross margin", value: "51%" },
        { label: "China revenue mix", value: "~30%", dir: "down", note: "policy-sensitive" },
        { label: "Order book", value: "Stable" },
      ],
      supplyChain: {
        upstream: ["Zeiss (optics)", "Precision components", "Rare-gas & materials"],
        core: ["ASML (EUV/DUV litho)", "Applied Materials · Lam (deposition/etch)", "KLA (inspection)"],
        downstream: ["TSMC · Samsung · Intel (fabs)", "Memory makers"],
      },
      drivers: [
        { label: "Export-control policy", dir: "headwind", note: "circulating draft widens China-mix downside" },
        { label: "Leading-edge capex", dir: "tailwind", note: "advanced-node buildout sustains tool demand" },
        { label: "Memory capex recovery", dir: "mixed", note: "improving but disciplined" },
      ],
      news: [
        { kind: "filing", topic: "Draft export-license framework circulates in Washington", source: "reuters.com", at: "3h ago", excerpt: "Would tighten the China-mix case for litho equipment — policy-driven, capping cadence more than the annual total.", url: "https://www.reuters.com" },
        { kind: "report", topic: "Order book commentary unchanged at investor update", source: "asml.com", at: "2d ago", excerpt: "Fundamentals steady; the move in the group is being set by policy headlines, not the backlog.", url: "https://www.asml.com" },
      ],
      constituents: [
        { ticker: "ASML", name: "ASML", changePct: -0.40, sent: -0.14, metrics: [["Rev gr.", "+3%"], ["Gross m.", "52%"], ["China mix", "~30%"]], note: "Sole EUV supplier — the single chokepoint upstream of every advanced node; most exposed to the policy overhang." },
        { ticker: "AMAT", name: "Applied Materials", changePct: -0.18, sent: -0.06, metrics: [["Rev gr.", "+5%"], ["Gross m.", "47%"], ["FCF", "$7.4B"]], note: "Broadest WFE portfolio; diversified across deposition and etch dampens single-policy risk." },
        { ticker: "KLAC", name: "KLA Corp", changePct: 0.11, sent: 0.04, metrics: [["Rev gr.", "+6%"], ["Gross m.", "61%"], ["FCF", "$3.0B"]], note: "Inspection & metrology; levered to advanced-packaging volume, a relative bright spot in the group." },
      ],
      agentRead:
        "Fundamentally the group is fine — order books steady, leading-edge capex intact. The divergence is entirely policy. Treat the export-control draft as a cadence risk on the China mix, concentrated in ASML, rather than a demand problem. Watch the framework's final text for whether the lenient or strict case binds.",
    },
    {
      id: "ind-memory-hbm", name: "Memory & HBM", sector: "Information Technology",
      bias: "mixed", movePct: -0.7, asOf: "delayed 15m", researchedAt: "21m ago",
      telemetry: { tools: 9, sources: 6, inTok: "19.4k", outTok: "1.2k", elapsed: "34m" },
      overview:
        "The makers of the high-bandwidth memory stacked next to every AI accelerator. A classically cyclical, capital-intensive commodity business now reshaped by HBM: supply is tight, pricing is recovering, and the makers have been disciplined on capacity. Contract pricing — not volatile spot — is the durable signal for where margins are heading.",
      whatsHappening:
        "Contract DRAM/HBM pricing firmed ahead of spot for a second week — the durable signal into Q3, constructive for memory-maker margins. But the cyclical, capital-intensive makers trade with the risk-off tape today despite the firm pricing underneath.",
      metrics: [
        { label: "Contract pricing", value: "Firming", dir: "up", note: "2nd week" },
        { label: "Supply discipline", value: "High" },
        { label: "Cycle position", value: "Up-cycle" },
        { label: "HBM allocation", value: "Tight" },
      ],
      supplyChain: {
        upstream: ["WFE tools", "Silicon wafers", "Substrate makers"],
        core: ["SK Hynix · Samsung · Micron (DRAM/HBM)"],
        downstream: ["NVDA · AMD (accelerators)", "Smartphone / PC OEMs"],
      },
      drivers: [
        { label: "Contract HBM pricing", dir: "tailwind", note: "firming faster than spot — the durable read" },
        { label: "Supplier capacity discipline", dir: "tailwind", note: "makers signalling restraint" },
        { label: "Downstream BOM cost", dir: "headwind", note: "rising memory cost pressures device margins" },
      ],
      news: [
        { kind: "article", topic: "Contract DRAM pricing firms into Q3", source: "trendforce.com", at: "1h ago", excerpt: "Contract leads spot for a second week — the durable signal reading through to memory-maker margins.", url: "https://www.trendforce.com" },
        { kind: "report", topic: "Memory makers signal disciplined supply", source: "bloomberg.com", at: "5h ago", excerpt: "Capacity restraint cited across the majors — the supply side that underpins the pricing recovery.", url: "https://www.bloomberg.com" },
      ],
      constituents: [
        { ticker: "MU", name: "Micron", changePct: 1.40, sent: 0.30, metrics: [["Rev gr.", "+58%"], ["Gross m.", "35%"], ["Cycle", "Up"]], note: "Most-levered US name to contract HBM pricing — margin sensitivity is highest here." },
        { ticker: "SK Hynix", name: "SK Hynix", changePct: 0.90, sent: 0.34, metrics: [["HBM share", "Lead"], ["Mix", "HBM-heavy"], ["Cycle", "Up"]], note: "HBM share leader; the primary supplier matched to the lead accelerator programs." },
      ],
      agentRead:
        "A rare two-sided read inside the AI book: constructive for the memory makers, a mild cost headwind for the accelerator builders that consume HBM. The contract-vs-spot divergence is the thing to track — contract firming is what makes this an up-cycle rather than a head-fake.",
    },
  ];

  // Phrases the agent rotates through when a freshly-asked session opens.
  const ASK_PHRASES = [
    "Thinking…",
    "Reconstructing what I already know…",
    "Searching for primary sources…",
    "Reading and cross-checking…",
    "Scoring significance…",
    "Drafting an answer with citations…",
  ];

  window.DATA = { ACTIVE, SESSIONS, FOLLOWING, CANDIDATES, TODAY, NEWS, BUDGET, WORLD, INDUSTRIES, ASK_PHRASES };
})();
