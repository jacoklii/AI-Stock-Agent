const STYLES: Record<string, string> = {
  running: "bg-blue-50 text-blue-700 ring-blue-200",
  open: "bg-blue-50 text-blue-700 ring-blue-200",
  succeeded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  pending: "bg-neutral-50 text-neutral-500 ring-neutral-200",
};

export function StatusPill({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-neutral-50 text-neutral-500 ring-neutral-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status === "running" && (
        <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
      )}
      {status}
    </span>
  );
}
