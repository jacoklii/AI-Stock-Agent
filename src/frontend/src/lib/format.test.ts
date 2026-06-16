import { describe, expect, it } from "vitest";

import { fmtPct, fmtTokens, timeAgo } from "./format";
import { isStale, isStalled } from "./freshness";

describe("fmtTokens", () => {
  it("abbreviates thousands and millions", () => {
    expect(fmtTokens(950)).toBe("950");
    expect(fmtTokens(25_000)).toBe("25.0k");
    expect(fmtTokens(1_200_000)).toBe("1.2M");
    expect(fmtTokens(null)).toBe("—");
  });
});

describe("fmtPct", () => {
  it("signs positive moves", () => {
    expect(fmtPct(1.234)).toBe("+1.23%");
    expect(fmtPct(-0.5)).toBe("-0.50%");
    expect(fmtPct(null)).toBe("—");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-06-11T12:00:00Z");
  it("buckets minutes, hours, days", () => {
    expect(timeAgo("2026-06-11T11:58:00Z", now)).toBe("2m ago");
    expect(timeAgo("2026-06-11T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-06-08T12:00:00Z", now)).toBe("3d ago");
  });
});

describe("isStale", () => {
  const now = new Date("2026-06-11T12:00:00Z");
  it("flags content older than the threshold", () => {
    expect(isStale("2026-06-11T06:00:00Z", 24, now)).toBe(false);
    expect(isStale("2026-06-09T06:00:00Z", 24, now)).toBe(true);
    expect(isStale(null, 24, now)).toBe(false);
  });
});

describe("isStalled", () => {
  const now = new Date("2026-06-11T12:00:00Z");
  it("flags a heartbeat frozen past the seconds threshold", () => {
    // 2 min ago — still alive.
    expect(isStalled("2026-06-11T11:58:00Z", 240, now)).toBe(false);
    // 5 min ago — heartbeat died.
    expect(isStalled("2026-06-11T11:55:00Z", 240, now)).toBe(true);
    expect(isStalled(null, 240, now)).toBe(false);
  });
});
