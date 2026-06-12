import { useEffect, useRef, useState } from "react";
import { useMutationState } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { CHAT_SEND_KEY, useChatMessages, useOpenResearch, useSendChat } from "../api/queries";
import { Prose } from "../components/Prose";
import { SourceChips } from "../components/SourceChips";
import { fmtDateTime } from "../lib/format";

/** The persistent direction surface: ask, get grounded answers, push into deep research. */
export function Chat() {
  const messages = useChatMessages();
  const send = useSendChat();
  const openResearch = useOpenResearch();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // All in-flight asks, whichever view fired them (here or a company page's "Ask").
  const pendingAsks = useMutationState({
    filters: { mutationKey: [CHAT_SEND_KEY], status: "pending" },
    select: (m) => (m.state.variables as { content: string }).content,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length, pendingAsks.length]);

  const submit = () => {
    const content = draft.trim();
    if (!content || send.isPending) return;
    setDraft("");
    send.mutate({ content });
  };

  const goDeeper = (topic: string) => {
    openResearch.mutate(
      { topic },
      { onSuccess: (res) => navigate(`/research/${res.state_id}`) },
    );
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-3xl flex-col md:h-[calc(100vh-3rem)]">
      <h1 className="mb-3 text-lg font-bold tracking-tight">Chat</h1>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4">
        {(messages.data ?? []).length === 0 && pendingAsks.length === 0 && (
          <p className="text-sm text-neutral-400">
            Ask anything the agent watches — companies, industries, macro. Answers cite their
            sources; "go deeper" opens a bounded research session.
          </p>
        )}
        {(messages.data ?? []).map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                m.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {m.role === "assistant" ? (
                <Prose>{m.content}</Prose>
              ) : (
                <p className="prose-snapshot text-sm leading-relaxed">{m.content}</p>
              )}
              {m.role === "assistant" && <SourceChips urls={m.source_urls ?? []} />}
              <div
                className={`mt-1 flex items-center gap-2 text-xs ${
                  m.role === "user" ? "text-neutral-400" : "text-neutral-400"
                }`}
              >
                <span>{fmtDateTime(m.created_at)}</span>
                {m.role === "user" && (
                  <button
                    type="button"
                    onClick={() => goDeeper(m.content)}
                    disabled={openResearch.isPending}
                    className="font-medium text-blue-300 hover:underline disabled:opacity-50"
                  >
                    go deeper →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {pendingAsks.map((content, i) => (
          <div key={`pending-${i}`} className="flex justify-end">
            <div className="max-w-[85%] rounded-lg bg-neutral-900 px-3 py-2 opacity-70">
              <p className="prose-snapshot text-sm leading-relaxed text-white">{content}</p>
              <span className="mt-1 block text-xs text-neutral-400">sending…</span>
            </div>
          </div>
        ))}
        {pendingAsks.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
              researching<span className="animate-pulse">…</span>
            </div>
          </div>
        )}
        {send.isError && (
          <p className="text-xs text-red-600">
            {send.error instanceof Error ? send.error.message : "send failed"}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the researcher… (answers may take up to a minute)"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={send.isPending || !draft.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
