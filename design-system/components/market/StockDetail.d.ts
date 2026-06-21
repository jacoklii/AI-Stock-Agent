import * as React from "react";

/** One recent material finding about the name — an article the agent read while researching it. */
export interface StockFinding {
  title: string;
  /** Source domain, rendered as a link. Article URLs are the primary content. */
  domain: string;
  /** Relative timestamp, e.g. "2h ago". */
  at: string;
  url?: string;
}

/** A peer in the same sub-industry — symbol, name, and the day's signed change. */
export interface StockPeer {
  ticker: string;
  name: string;
  changePct: number;
}

export interface StockIndustry {
  sector?: string;
  subIndustry?: string;
  /** A one-line read of where the name sits — descriptive, never a call. */
  position?: string;
  peers?: StockPeer[];
  /** Supply-chain neighbors as mono chips (suppliers, customers, substitutes). */
  supplyChain?: string[];
  /** Freshness stamp for this section. */
  asOf?: string;
}

/** One financials/ratio row. `value` is preformatted (mono, tabular). `dir` only tints the value. */
export interface StockFinancialRow {
  label: string;
  value: string;
  /** Tints the value green/terracotta. Use sparingly — for growth/margins, never a verdict. */
  dir?: "up" | "down";
  /** Small trailing qualifier, e.g. "ttm", "YoY". */
  note?: string;
}

export interface StockSentiment {
  /** −1 … +1. Drives the worded read and the trend tint; the raw number is not shown. */
  value: number;
  /** One-line plain-language read (serif voice). */
  read?: string;
  /** Sentiment series over time for the small trend trace. */
  trend?: number[];
  /** How many sources the read draws on. */
  sources?: number;
  asOf?: string;
}

/** The full per-name record, as pulled from the store. */
export interface StockRecord {
  ticker: string;
  name?: string;
  exchange?: string;
  price?: number;
  changePct?: number;
  series?: number[];
  /** Coverage tier — drives the header badge. */
  tier?: "watchlist" | "industry_critical" | "discovered" | "archived";
  /** Current alert threshold label, if set. */
  alert?: string;
  /** Relative freshness of the quote. */
  quoteAt?: string;

  /* ---- Agent summary (baked in, leads the panel) ---- */
  /** The agent's synthesis of the name — reads & observations only, never a call. */
  summary?: string;
  summaryAsOf?: string;
  /** Recent material findings — the reports behind the summary. */
  findings?: StockFinding[];
  /** What the agent remembers about this name (memory of you). */
  memory?: string;

  /* ---- Qualitative: the business, its industry, the sentiment ---- */
  /** What the business actually is/does — plain-language description. */
  business?: string;
  businessAsOf?: string;
  industry?: StockIndustry;
  sentiment?: StockSentiment;

  /* ---- Quantitative: financials, metrics, ratios ---- */
  financials?: StockFinancialRow[];
  financialsAsOf?: string;
  /** Valuation & ratio rows (P/E, EV/EBITDA, ROIC, etc.). */
  ratios?: StockFinancialRow[];
  ratiosAsOf?: string;
}

/**
 * StockDetail — the watchlist drill-down panel. The agent's summary leads (synthesis, the reports
 * behind it, and what it remembers), then the record splits into two clear halves: QUALITATIVE
 * (what the business is, its industry & position, the sentiment read) and QUANTITATIVE (financials,
 * metrics, ratios). Sections carry "as of …" freshness stamps because the record is pulled from the
 * store, and render a calm skeleton while `loading`. It never recommends buy/sell/hold and makes no
 * valuation calls — every section is a read, not a verdict.
 */
export interface StockDetailProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The name's record. */
  stock: StockRecord;
  /** Show skeletons instead of content (record still fetching from the store). */
  loading?: boolean;
  /** Vertical density of the section stack. */
  density?: "comfortable" | "compact";
  /** Show the per-section "as of …" freshness stamps. */
  showProvenance?: boolean;
  onClose?: () => void;
  /** Spawn a research session on this name. */
  onResearch?: (stock: StockRecord) => void;
  onSetAlert?: (stock: StockRecord) => void;
  onRemove?: (stock: StockRecord) => void;
  /** Open a finding's source article. */
  onOpenSource?: (finding: StockFinding) => void;
}

export function StockDetail(props: StockDetailProps): React.JSX.Element;
