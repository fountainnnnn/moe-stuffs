import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  text: string;
  questId: string;
  offline?: boolean;
};

export default function AgentResponseBubble({ text, questId, offline = false }: Props) {
  return (
    <section className="pq-response-card" aria-label="Task agent response">
      <div className="pq-response-header">
        <code>agent.run({questId}) → response</code>
        {offline && <span>offline fallback</span>}
      </div>
      <div className="pq-agent-response">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </section>
  );
}
