/** 0–1 significance as a compact colored badge: the signal-vs-noise marker. */
export function SignificanceBadge({ value }: { value: number }) {
  const tone =
    value >= 0.7
      ? "bg-red-50 text-red-700 ring-red-200"
      : value >= 0.4
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-neutral-50 text-neutral-500 ring-neutral-200";
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone}`}
      title={`significance ${value.toFixed(2)}`}
    >
      {value.toFixed(2)}
    </span>
  );
}
