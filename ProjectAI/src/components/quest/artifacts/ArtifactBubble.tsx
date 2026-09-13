"use client";

import type { Artifact } from "@/lib/types";
import PlanDoc from "./PlanDoc";
import ResearchCard from "./ResearchCard";
import SlidesDeck from "./SlidesDeck";
import WebsiteFrame from "./WebsiteFrame";

const KIND_LABEL: Record<Artifact["kind"], string> = {
  slides: "slide deck",
  website: "website",
  plan: "plan doc",
  research: "research brief",
};

export default function ArtifactBubble({
  artifact,
  questId,
  offline,
}: {
  artifact: Artifact;
  questId: string;
  offline?: boolean;
}) {
  return (
    <div className="artifact-bubble bubble overflow-hidden">
      {/* run strip — the agent reporting what it just made */}
      <div
        className="flex items-center gap-2 border-b-[2.5px] border-[var(--ink)] px-3 py-1.5"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        <span className="font-mono text-[11px] font-bold tracking-wide opacity-80">
          agent.run({questId}) → {KIND_LABEL[artifact.kind]}
        </span>
        {offline && (
          <span
            className="ml-auto shrink-0 rounded-full border-2 border-[var(--paper)]/70 px-1.5 py-px font-mono text-[9.5px] font-extrabold uppercase tracking-wider"
            title="the live agent didn't answer — this is the offline sample output"
          >
            offline mode
          </span>
        )}
      </div>

      <div className="bg-[var(--card)]">
        {artifact.kind === "slides" && <SlidesDeck artifact={artifact} />}
        {artifact.kind === "website" && <WebsiteFrame artifact={artifact} />}
        {artifact.kind === "plan" && <PlanDoc artifact={artifact} />}
        {artifact.kind === "research" && <ResearchCard artifact={artifact} />}
      </div>
    </div>
  );
}
