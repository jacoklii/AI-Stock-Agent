// "Stale data looks stale" (ARCHITECTURE.md): anything older than the threshold renders amber.

export function hoursSince(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  return (now.getTime() - new Date(iso).getTime()) / 3_600_000;
}

export function isStale(
  iso: string | null | undefined,
  thresholdHours = 24,
  now: Date = new Date(),
): boolean {
  const h = hoursSince(iso, now);
  return h !== null && h > thresholdHours;
}

export function secondsSince(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  return (now.getTime() - new Date(iso).getTime()) / 1_000;
}

// A live session heartbeats every loop turn; if last_active_at has frozen past this window the
// run has almost certainly died. Short threshold (seconds, not hours) — distinct from data staleness.
export const STALLED_AFTER_SECONDS = 240;

export function isStalled(
  iso: string | null | undefined,
  thresholdSeconds = STALLED_AFTER_SECONDS,
  now: Date = new Date(),
): boolean {
  const s = secondsSince(iso, now);
  return s !== null && s > thresholdSeconds;
}
