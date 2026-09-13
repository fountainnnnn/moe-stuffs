import type { ResearchArtifact } from "@/lib/types";

export default function ResearchCard({ artifact }: { artifact: ResearchArtifact }) {
  return (
    <div className="max-h-[46vh] overflow-y-auto p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-55">
        research brief
      </p>
      <h4 className="mt-0.5 text-[15px] font-black leading-tight">{artifact.topic}</h4>

      {artifact.summary && (
        <p className="mt-2 border-l-[3px] border-[var(--ink)] pl-2.5 text-[12.5px] font-semibold leading-relaxed opacity-80">
          {artifact.summary}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {artifact.facts.map((f, k) => (
          <li
            key={k}
            className="rounded-[10px] border-2 border-[var(--paper-line)] bg-[var(--paper)] px-2.5 py-2"
          >
            <p className="text-[12.5px] font-semibold leading-snug">{f.text}</p>
            {f.source ? (
              <p className="mt-1 font-mono text-[10.5px] font-bold opacity-60">source: {f.source}</p>
            ) : (
              <p className="mt-1 font-mono text-[10.5px] font-bold opacity-40">no source given</p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t-2 border-dashed border-[var(--ink)] pt-2">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] opacity-55">
          citations
        </p>
        {artifact.citations.length ? (
          <ol className="mt-1 space-y-1">
            {artifact.citations.map((c, k) => (
              <li key={k} className="text-[11px] font-medium leading-snug opacity-75">
                [{k + 1}] {c}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-[11px] font-semibold italic opacity-50">
            none supplied.
          </p>
        )}
      </div>
    </div>
  );
}
