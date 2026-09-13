import type { WebsiteArtifact } from "@/lib/types";

export default function WebsiteFrame({ artifact }: { artifact: WebsiteArtifact }) {
  return (
    <div className="overflow-hidden">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b-2 border-[var(--ink)] bg-[var(--paper)] px-2.5 py-1.5">
        <span className="flex shrink-0 gap-1">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--ink)] bg-[var(--pop)]" />
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--ink)] bg-[#ffd60a]" />
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--ink)] bg-[var(--accent)]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full border-2 border-[var(--ink)] bg-[var(--card)] px-2 py-0.5 font-mono text-[10.5px] font-bold opacity-70">
          {artifact.url}
        </span>
      </div>

      {/* rendered mini page */}
      <div className="max-h-[46vh] overflow-y-auto bg-[var(--card)]">
        <div className="border-b-2 border-dashed border-[var(--ink)] px-3 py-2">
          <p className="text-[11px] font-black tracking-tight">{artifact.siteTitle}</p>
        </div>

        <div className="hatch border-b-2 border-[var(--ink)] px-3 py-4 text-center">
          <h4 className="text-[17px] font-black leading-tight sm:text-xl">{artifact.hero.headline}</h4>
          {artifact.hero.sub && (
            <p className="mx-auto mt-1.5 max-w-[42ch] text-[12.5px] font-semibold opacity-75">
              {artifact.hero.sub}
            </p>
          )}
          <span className="btn-loud mt-3 inline-block px-4 py-1.5 text-[12px]">
            {artifact.hero.cta}
          </span>
        </div>

        {artifact.sections.map((s, k) => (
          <div key={k} className="border-b-2 border-[var(--paper-line)] px-3 py-2.5 last:border-b-0">
            <p className="text-[12.5px] font-black leading-tight">{s.heading}</p>
            <p className="mt-1 text-[12px] font-semibold leading-relaxed opacity-75">{s.body}</p>
          </div>
        ))}

        {artifact.footer && (
          <p className="border-t-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[10.5px] font-bold opacity-60">
            {artifact.footer}
          </p>
        )}
      </div>
    </div>
  );
}
