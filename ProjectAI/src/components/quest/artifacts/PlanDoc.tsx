import type { PlanArtifact } from "@/lib/types";

export default function PlanDoc({ artifact }: { artifact: PlanArtifact }) {
  return (
    <div className="max-h-[46vh] overflow-y-auto p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-55">
        plan.md · {artifact.steps.length} steps
      </p>
      <h4 className="mt-0.5 text-[15px] font-black leading-tight">{artifact.title}</h4>

      {artifact.goal && (
        <div className="mt-2 rounded-[10px] border-2 border-[var(--ink)] bg-[var(--accent)] px-2.5 py-2">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] opacity-60">goal</p>
          <p className="mt-0.5 text-[12.5px] font-extrabold leading-snug">{artifact.goal}</p>
        </div>
      )}

      <ol className="mt-3 space-y-2">
        {artifact.steps.map((s, k) => (
          <li key={k} className="flex gap-2">
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--card)] font-mono text-[10px] font-black">
              {s.n}
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold leading-snug">{s.action}</p>
              {s.tool && (
                <span className="mt-1 inline-block rounded-full border-2 border-[var(--ink)] bg-[var(--sky)] px-2 py-px font-mono text-[10px] font-extrabold">
                  🔧 {s.tool}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {!!artifact.doneCriteria.length && (
        <div className="mt-3 rounded-[10px] border-2 border-dashed border-[var(--ink)] bg-[var(--paper)] px-2.5 py-2">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] opacity-55">
            done criteria
          </p>
          <ul className="mt-1 space-y-1">
            {artifact.doneCriteria.map((d, k) => (
              <li key={k} className="flex gap-1.5 text-[12px] font-semibold leading-snug">
                <span className="shrink-0">☑</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
