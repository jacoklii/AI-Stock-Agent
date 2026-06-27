import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** LLM prose (chat answers, findings, reads) rendered as markdown — the models speak it.
 * Raw HTML stays disabled (react-markdown default), so model output can't inject markup.
 * `serif` switches to the agent's reading voice (Spectral) for the world synthesis — the
 * "letter from your analyst" register PROJECT.md §8 calls for. */
export function Prose({
  children,
  invert = false,
  serif = false,
}: {
  children: string;
  invert?: boolean;
  serif?: boolean;
}) {
  return (
    <div
      className={`prose-md ${serif ? "prose-serif" : "text-sm leading-relaxed"} ${
        invert ? "prose-md-invert" : ""
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
