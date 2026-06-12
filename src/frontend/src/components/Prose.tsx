import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** LLM prose (chat answers, findings, reads) rendered as markdown — the models speak it.
 * Raw HTML stays disabled (react-markdown default), so model output can't inject markup. */
export function Prose({ children, invert = false }: { children: string; invert?: boolean }) {
  return (
    <div className={`prose-md text-sm leading-relaxed ${invert ? "prose-md-invert" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
