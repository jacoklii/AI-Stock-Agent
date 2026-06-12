import { useInbox, useInboxAction } from "../api/queries";
import { EmptyState } from "../components/EmptyState";
import { FreshnessStamp } from "../components/FreshnessStamp";

const CHANNEL_LABEL: Record<string, string> = {
  in_app: "in-app",
  email: "email",
  imessage: "iMessage",
  whatsapp: "WhatsApp",
};

/** Chronological notification ledger — everything the agent sent, on any channel. */
export function Inbox() {
  const inbox = useInbox();
  const markRead = useInboxAction("read");
  const dismiss = useInboxAction("dismiss");

  const items = (inbox.data ?? []).filter((n) => !n.dismissed_at);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Inbox</h1>

      {items.length === 0 ? (
        <EmptyState
          message="Inbox is clear."
          hint="Digest, brief, and alert deliveries mirror here."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const unread = !n.read_at;
            return (
              <li
                key={n.id}
                className={`rounded-lg border p-3 ${
                  unread ? "border-blue-200 bg-blue-50/40" : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                      <span className="text-sm font-medium text-neutral-900">
                        {n.title ?? n.template ?? n.ref_type ?? "notification"}
                      </span>
                      <span className="rounded bg-neutral-100 px-1.5 text-xs text-neutral-500">
                        {CHANNEL_LABEL[n.channel] ?? n.channel}
                      </span>
                    </div>
                    {n.body && (
                      <p className="prose-snapshot mt-1 line-clamp-4 text-sm text-neutral-600">
                        {n.body}
                      </p>
                    )}
                    <div className="mt-1">
                      <FreshnessStamp iso={n.sent_at} label="sent" thresholdHours={48} />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {unread && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(n.id)}
                        className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                      >
                        read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismiss.mutate(n.id)}
                      className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                    >
                      dismiss
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
