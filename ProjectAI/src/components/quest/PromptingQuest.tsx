"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Artifact, JudgeVerdict, Quest, Tier } from "@/lib/types";
import { TIER_LABEL } from "@/lib/types";
import AgentAvatar, { type AgentMood } from "@/components/AgentAvatar";
import ArtifactBubble from "./artifacts/ArtifactBubble";
import TierReveal from "./TierReveal";
import FlaggedTakeover from "./FlaggedTakeover";
import { PLANTED_FAKE_REVEALS } from "@/lib/quests";

const ARTIFACT_NOUN: Record<string, string> = {
  slides: "the slides",
  website: "the site",
  plan: "the plan",
  research: "the brief",
};

const THINK_LINES = [
  "reading the prompt…",
  "figuring out what you actually want…",
  "working with what you gave me…",
  "building it…",
];

const RUBRIC_LABEL: Record<string, string> = {
  context: "Context",
  role: "Role",
  action: "Action",
  format: "Format",
  tone: "Tone",
  verification: "Verification",
  sources: "Sources",
  stack: "Tech stack",
  data: "Data stored",
  access: "Who can access",
  auth: "Auth",
  security: "Security",
  goal: "Goal",
  steps: "Steps",
  tools: "Tools",
  done: "Done-criteria",
  structure: "Structure",
  decomposition: "Decomposition",
};

const label = (k: string) => RUBRIC_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TIER_BADGE: Record<Tier, string> = {
  npc: "var(--pop)",
  grinder: "var(--sky)",
  farmer: "var(--accent)",
};

type RunResult = {
  verdict: JudgeVerdict;
  artifact: Artifact;
  artifactFallback: boolean;
  /** p4 only: the artifact just shown contains the planted fake facts. */
  trapSprung: boolean;
};

/** Last-resort client-side fallback: the quest's pre-written artifact for this tier. */
function offlineArtifact(quest: Quest, tier: Tier): Artifact {
  try {
    return JSON.parse(quest.mockOutputs?.[tier] ?? "") as Artifact;
  } catch {
    return {
      kind: "plan",
      title: "Agent offline",
      goal: "Nothing ran — the server didn't answer.",
      steps: [{ n: 1, action: "Send your prompt again." }],
      doneCriteria: [],
    };
  }
}

type Submitted = {
  verdict: JudgeVerdict;
  auraGained: number;
  newAura: number;
  firstTryBonus: boolean;
};

type Msg =
  | { id: string; role: "agent"; kind: "briefing"; text: string }
  | { id: string; role: "agent"; kind: "text"; text: string; tone?: "plain" | "hype" }
  | { id: string; role: "agent"; kind: "artifact"; artifact: Artifact; offline?: boolean }
  | { id: string; role: "agent"; kind: "coach"; verdict: JudgeVerdict }
  | { id: string; role: "me"; kind: "text"; text: string };

let seq = 0;
const nextId = () => `m${++seq}`;

export default function PromptingQuest({ quest }: { quest: Quest }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [
    { id: nextId(), role: "agent", kind: "briefing", text: quest.task },
    {
      id: nextId(),
      role: "agent",
      kind: "text",
      text: `drop your prompt whenever — i'll actually build ${ARTIFACT_NOUN[quest.artifact ?? ""] ?? "it"} and show you. unlimited tries 🤙`,
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const [thinkStep, setThinkStep] = useState(0);
  const [lastPrompt, setLastPrompt] = useState("");
  const [lastTier, setLastTier] = useState<Tier | null>(null);
  const [lastTrapSprung, setLastTrapSprung] = useState(false);
  const [runs, setRuns] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<Submitted | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);

  const busy = thinking || submitting;

  const push = useCallback((m: Msg) => setMessages((prev) => [...prev, m]), []);

  // staged fake reasoning
  useEffect(() => {
    if (!thinking) return;
    setThinkStep(0);
    const t = setInterval(
      () => setThinkStep((s) => Math.min(s + 1, THINK_LINES.length - 1)),
      520,
    );
    return () => clearInterval(t);
  }, [thinking]);

  // auto-scroll, but never yank the view if the student scrolled up to re-read
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !atBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, thinkStep]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function run(text: string): Promise<RunResult> {
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: quest.id, prompt: text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as RunResult;
    } catch {
      // never stall the demo — score locally and show the pre-written sample artifact
      const words = text.trim().split(/\s+/).length;
      const tier: Tier = words > 60 ? "grinder" : "npc";
      const verdict: JudgeVerdict = {
        score: words > 60 ? 62 : 34,
        tier,
        missing: (quest.rubric ?? []).slice(words > 60 ? 3 : 1),
        advice: "Agent is offline rn, but that prompt still needs more detail. Be specific.",
        fallback: true,
      };
      return {
        verdict,
        artifact: offlineArtifact(quest, tier),
        artifactFallback: true,
        trapSprung: quest.id === "p4" && tier === "npc",
      };
    }
  }

  async function onSend() {
    const text = draft.trim();
    if (!text || busy || locked) return;
    setErr(null);
    setDraft("");
    atBottomRef.current = true;
    push({ id: nextId(), role: "me", kind: "text", text });
    setLastPrompt(text);
    setThinking(true);

    const started = Date.now();
    const { verdict: v, artifact, artifactFallback, trapSprung } = await run(text);
    await sleep(Math.max(0, 1800 + Math.random() * 600 - (Date.now() - started)));
    setThinking(false);
    setRuns((r) => r + 1);
    setLastTier(v.tier);
    setLastTrapSprung(trapSprung);
    push({
      id: nextId(),
      role: "agent",
      kind: "artifact",
      artifact,
      offline: artifactFallback,
    });
    // No coaching on a run — the weak artifact is the feedback. The agent only
    // spells out what's missing when they try to submit it.
  }

  async function onSubmit() {
    if (!lastPrompt.trim() || busy || locked) return;
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: quest.id, prompt: lastPrompt }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Submitted;
      // The takeover must match the artifact they actually submitted, not a second opinion.
      setResult(data);
      setFlagged(quest.id === "p4" && lastTrapSprung);
      setLocked(true);
      setLastTier(data.verdict.tier);
      atBottomRef.current = true;
      // Only now does the agent spell out what the prompt was missing.
      if (data.verdict.tier !== "farmer") {
        push({ id: nextId(), role: "agent", kind: "coach", verdict: data.verdict });
      }
      push({
        id: nextId(),
        role: "agent",
        kind: "text",
        tone: data.verdict.tier === "farmer" ? "hype" : "plain",
        text: `aura locked in (+${data.auraGained}) — back to quest map whenever 🫡`,
      });
    } catch {
      setErr("Couldn't lock that in — check the server and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  const mood: AgentMood = thinking
    ? "thinking"
    : lastTier === "farmer"
      ? "hyped"
      : lastTier === "npc"
        ? "disappointed"
        : "idle";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-3 pb-4 pt-3 sm:px-4">
      <style>{`
        @keyframes pq-dots { 0%{opacity:.2} 50%{opacity:1} 100%{opacity:.2} }
        .pq-dot { animation: pq-dots 1s infinite; }
        .pq-dot:nth-child(2){ animation-delay:.15s } .pq-dot:nth-child(3){ animation-delay:.3s }
        @keyframes pq-slidein { from{transform:translateY(14px) rotate(-2deg); opacity:0} to{transform:translateY(0) rotate(0); opacity:1} }
        .pq-pop { animation: pq-slidein 320ms cubic-bezier(.2,1.5,.4,1) both; }
        @keyframes pq-typeline { from{opacity:0; transform:translateX(-6px)} to{opacity:1; transform:none} }
        .pq-line { animation: pq-typeline 220ms ease-out both; }
      `}</style>

      <Link
        href="/quests"
        className="w-fit text-sm font-extrabold underline decoration-2 underline-offset-4"
      >
        ← quest map
      </Link>

      <section className="card-sticker chat-shell flex flex-col overflow-hidden">
        {/* slim header */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b-[2.5px] border-[var(--ink)] px-3 py-2 sm:px-4">
          <AgentAvatar mood={mood} size="sm" className="shrink-0 !w-9 !h-9" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-black leading-tight sm:text-lg">
              <span className="opacity-50">{quest.subject ?? quest.id.toUpperCase()} ·</span> {quest.title}
            </h1>
            {!!quest.rubric?.length && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {quest.rubric.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border-2 border-[var(--ink)] bg-[var(--sky)] px-1.5 py-px text-[10px] font-extrabold leading-tight"
                  >
                    {label(r)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs font-bold opacity-55 sm:inline">
              runs: {runs}
            </span>
            <button
              onClick={onSubmit}
              disabled={runs === 0 || busy || locked}
              className="card-sticker card-sticker-press px-3 py-1.5 text-xs font-extrabold disabled:opacity-40 sm:text-sm"
              style={{ boxShadow: "2px 2px 0 0 var(--ink)" }}
            >
              {locked ? "✅ locked in" : submitting ? "locking in…" : "✅ SUBMIT FINAL"}
            </button>
          </div>
        </header>

        {/* transcript */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="chat-scroll flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
        >
          {messages.map((m) =>
            m.role === "me" ? (
              <div key={m.id} className="pq-pop flex justify-end">
                <p
                  className="bubble max-w-[75%] whitespace-pre-wrap px-3 py-2 text-sm font-semibold"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="pq-pop flex items-start gap-2">
                <AgentAvatar
                  mood={m.kind === "coach" ? moodFor(m.verdict.tier) : "idle"}
                  size="sm"
                  className="mt-0.5 shrink-0 !h-8 !w-8"
                />
                <div
                  className={
                    m.kind === "artifact" || m.kind === "briefing"
                      ? "min-w-0 max-w-[94%] flex-1"
                      : "min-w-0 max-w-[75%]"
                  }
                >
                  {m.kind === "briefing" && (
                    <div className="bubble bg-[var(--card)] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-55">
                        mission briefing · {quest.subject ?? quest.id.toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm font-semibold opacity-70">{quest.tagline}</p>
                      <p className="mt-2 whitespace-pre-line rounded-[10px] border-2 border-dashed border-[var(--ink)] bg-[var(--paper)] p-2.5 text-[15px] font-semibold">
                        🎯 {m.text}
                      </p>
                    </div>
                  )}

                  {m.kind === "text" && (
                    <p
                      className="bubble px-3 py-2 text-sm font-extrabold"
                      style={{
                        background:
                          m.tone === "hype" ? "var(--accent)" : "var(--card)",
                      }}
                    >
                      {m.text}
                    </p>
                  )}

                  {m.kind === "artifact" && (
                    <ArtifactBubble
                      artifact={m.artifact}
                      questId={quest.id}
                      offline={m.offline}
                    />
                  )}

                  {m.kind === "coach" && (
                    <div
                      className="bubble p-3"
                      style={
                        m.verdict.tier === "farmer"
                          ? { background: "var(--accent)" }
                          : {
                              background:
                                "color-mix(in srgb, var(--pop) 16%, var(--card))",
                              borderColor: "var(--pop)",
                            }
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="stamp text-xs"
                          style={{ background: TIER_BADGE[m.verdict.tier] }}
                        >
                          {TIER_LABEL[m.verdict.tier]} · {m.verdict.score}
                        </span>
                        {m.verdict.fallback && (
                          <span className="text-[11px] font-bold opacity-50">
                            (offline scorer)
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[15px] font-extrabold leading-snug">
                        {m.verdict.tier === "farmer"
                          ? `W prompt. ${m.verdict.advice}`
                          : m.verdict.advice}
                      </p>
                      {m.verdict.tier !== "farmer" && !!m.verdict.missing?.length && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-55">
                            missing
                          </span>
                          {m.verdict.missing.map((mm) => (
                            <span
                              key={mm}
                              className="rounded-full border-2 border-[var(--ink)] bg-[var(--pop)] px-2 py-px text-[11px] font-extrabold text-white"
                            >
                              {label(mm)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}

          {thinking && (
            <div className="pq-pop flex items-start gap-2">
              <AgentAvatar mood="thinking" size="sm" className="mt-0.5 shrink-0 !h-8 !w-8" />
              <div
                className="bubble max-w-[75%] px-3 py-2 font-mono text-[12.5px] leading-relaxed"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                {THINK_LINES.slice(0, thinkStep + 1).map((l, i) => (
                  <p key={l} className="pq-line">
                    <span style={{ color: "var(--accent)" }}>›</span> {l}
                    {i === thinkStep && (
                      <span className="ml-1">
                        <span className="pq-dot">.</span>
                        <span className="pq-dot">.</span>
                        <span className="pq-dot">.</span>
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* composer */}
        <div className="border-t-[2.5px] border-[var(--ink)] bg-[var(--card)] px-3 py-2.5 sm:px-4">
          {err && <p className="mb-1.5 text-sm font-bold text-[var(--pop)]">{err}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy || locked}
              rows={2}
              placeholder={
                locked
                  ? "aura locked in — this quest is done"
                  : "Tell the agent who it is, what you need, and how the answer should look. Enter to send, Shift+Enter for a new line."
              }
              className="max-h-40 min-h-[46px] flex-1 resize-none rounded-[12px] border-2 border-[var(--ink)] bg-[var(--paper)] p-2.5 font-mono text-sm leading-relaxed outline-none focus:bg-white disabled:opacity-50"
            />
            <button
              onClick={onSend}
              disabled={!draft.trim() || busy || locked}
              aria-label="send prompt"
              className="btn-loud card-sticker-press shrink-0 px-4 py-2.5 text-sm"
            >
              {thinking ? "…" : "▶"}
            </button>
          </div>
          <p className="mt-1 text-[11px] font-semibold opacity-50">
            {locked
              ? "aura locked in — head back to the quest map"
              : runs === 0
                ? "send a prompt first, then SUBMIT FINAL unlocks"
                : "unlimited re-sends · SUBMIT FINAL locks in your latest prompt"}
          </p>
        </div>
      </section>

      {/* endgame */}
      {result && flagged && (
        <FlaggedTakeover facts={PLANTED_FAKE_REVEALS} onContinue={() => setFlagged(false)} />
      )}
      {result && !flagged && (
        <TierReveal
          tier={result.verdict.tier}
          auraGained={result.auraGained}
          newAura={result.newAura}
          firstTryBonus={result.firstTryBonus}
          advice={result.verdict.advice}
          retryLabel="↺ back to the chat"
          onRetry={() => setResult(null)}
        />
      )}
    </div>
  );
}

function moodFor(tier: Tier): AgentMood {
  return tier === "farmer" ? "hyped" : tier === "npc" ? "disappointed" : "idle";
}
