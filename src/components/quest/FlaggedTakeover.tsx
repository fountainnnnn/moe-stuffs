"use client";

import AgentAvatar from "@/components/AgentAvatar";
import UiIcon from "@/components/UiIcon";
import { PLANTED_FAKE_REVEALS } from "@/lib/quests";

// Scripted reveal for p4 (The Hallucination Trap). The claims themselves live in
// lib/quests.ts — the executor plants exactly these, so there is one source of truth.
export const PLANTED_FAKES = PLANTED_FAKE_REVEALS;

export default function FlaggedTakeover({
  facts = PLANTED_FAKES,
  onContinue,
}: {
  facts?: string[];
  onContinue: () => void;
}) {
  return (
    <div className="fl-root">
      <style>{`
        .fl-root { position:fixed; inset:0; z-index:70; display:grid; place-items:center; padding:1.25rem;
          background: var(--pop); animation: fl-in 180ms steps(2) both; }
        @keyframes fl-in { from{opacity:0} to{opacity:1} }
        .fl-root::before { content:""; position:absolute; inset:0; pointer-events:none;
          background: repeating-linear-gradient(45deg, transparent 0 22px, rgba(27,26,23,.10) 22px 44px); }
        .fl-panel { position:relative; width:100%; max-width:640px; padding:1.5rem;
          animation: fl-shake 520ms cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes fl-shake {
          0%{transform:translate(0,-14px) scale(.94); opacity:0}
          30%{opacity:1}
          45%{transform:translate(-8px,0) rotate(-1deg)}
          60%{transform:translate(8px,0) rotate(1deg)}
          75%{transform:translate(-4px,0)}
          100%{transform:translate(0,0) rotate(0)}
        }
        .fl-siren { animation: fl-siren 700ms steps(2,end) infinite; }
        @keyframes fl-siren { 0%,100%{opacity:1} 50%{opacity:.25} }
      `}</style>
      <div className="fl-panel card-sticker">
        <p className="fl-siren text-xs font-extrabold uppercase tracking-[0.3em] text-[var(--pop)]">
          <UiIcon name="alert" size={20} className="mr-1.5" /> hallucination detected
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
          FLAGGED: you just shipped a hallucination.
        </h2>
        <p className="mt-2 text-sm font-semibold opacity-75">
          You submitted without ever telling the agent to verify or cite anything. So it made stuff
          up, said it confidently, and you passed it on. Here is what was never real:
        </p>
        <ul className="mt-4 space-y-3">
          {facts.map((f, i) => (
            <li
              key={i}
              className={`card-sticker ${i % 2 ? "tilt-r" : "tilt-l"} border-[var(--pop)] p-3`}
            >
              <span className="stamp mr-2 border-[var(--pop)] bg-[var(--pop)] text-xs text-white">
                CAP #{i + 1}
              </span>
              <span className="text-sm font-semibold">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-start gap-3 rounded-[var(--radius)] border-2 border-dashed border-[var(--ink)] p-3">
          <AgentAvatar mood="disappointed" size="sm" />
          <p className="text-sm font-bold">
            The lesson: a confident answer is not a checked answer. Make the agent name its sources,
            flag what it is unsure about, and say &ldquo;I don&rsquo;t know&rdquo; when it
            doesn&rsquo;t. That line in your prompt is the whole job.
          </p>
        </div>
        <button
          onClick={onContinue}
          className="btn-loud card-sticker-press mt-5 w-full"
          style={{ background: "var(--pop)", color: "#fff" }}
        >
          I&rsquo;ll never trust it blindly again →
        </button>
      </div>
    </div>
  );
}
