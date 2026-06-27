/** Compact source links for an assistant answer — articles stay first-class. */
export function SourceChips({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {urls.map((url) => {
        let host = url;
        try {
          host = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          /* keep raw */
        }
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-2 py-0.5 text-xs hover:underline"
            style={{ background: "var(--surface-hover)", color: "var(--link)" }}
          >
            {host}
          </a>
        );
      })}
    </div>
  );
}
