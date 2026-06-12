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
