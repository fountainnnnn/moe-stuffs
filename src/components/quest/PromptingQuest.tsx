"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { JudgeVerdict, Quest, Tier } from "@/lib/types";
import { TIER_LABEL } from "@/lib/types";
import AgentAvatar, { type AgentMood } from "@/components/AgentAvatar";
import AgentResponseBubble from "./AgentResponseBubble";
import TierReveal from "./TierReveal";
import FlaggedTakeover from "./FlaggedTakeover";
import { PLANTED_FAKE_REVEALS } from "@/lib/quests";

const THINK_LINES = [
  "reading the prompt…",
  "figuring out what you actually want…",
  "working with what you gave me…",
  "preparing the response…",
];

const SIMILAR_PROMPT_EXAMPLES: Record<string, string> = {
  p1: `Different task: persuade Sec 1 students to join a book club.\n\n“You are a student communications coach. Create a four-slide outline for Sec 1 students. Include when the club meets, two specific benefits, the honest time commitment, and a final sign-up action. Use a friendly, energetic tone and keep every bullet under 12 words.”`,
  p2: `Different task: organise class T-shirt orders.\n\n“Before planning the page, compare two beginner-friendly website tools, explain the tradeoffs in plain language, and wait for my choice. The page must remember each student’s name, shirt size, and quantity. Students can edit only their own order; class reps can close ordering and view everyone’s entries. Keep version one to an order form and class summary. Leave online payments out.”`,
  p3: `Different task: manage a class homework-reminder channel for five days.\n\n“Create a numbered five-day plan for an agent. Success means one accurate reminder is prepared each school day. It may read the class calendar and write drafts, but it cannot send anything until a class rep approves it. For every step, name the tool and expected result. Finish with a checklist, and stop plus alert the rep if the calendar cannot be verified after two tries.”`,
  p4: `Different task: research the history of recycling programmes in Singapore.\n\n“Build a short timeline using claims you can verify. Put a working NEA, MSE, or National Archives source beside every date. Mark any unsupported claim as unverified instead of guessing. Cover 1990 to today, separate policy from school programmes, and finish with a list of sources I should open myself.”`,
};

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
  examples: "Examples",
  clarifying: "Clarifying questions",
  criteria: "Success criteria",
  boundaries: "Boundaries",
  permissions: "Permissions",
  checkpoints: "Human checkpoints",
  recovery: "Failure recovery",
};

const label = (k: string) => RUBRIC_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1);

const HINT_QUESTIONS: Record<string, [string, string]> = {
  context: ["What background would help the agent understand the situation?", "Add who this is for, where it will be used, and any important limits."],
  role: ["What kind of expert should the agent act like?", "Choose a role with relevant experience, then say who they are helping."],
  action: ["What exactly should the agent do?", "Use a clear action verb and name the result you want it to produce."],
  format: ["How should the finished answer be organised?", "Name the output format, length, and sections you want to see."],
  tone: ["How should this sound to the audience?", "Describe the tone using two useful words, such as friendly and concise."],
  verification: ["Which claims should the agent check before using them?", "Ask it to flag uncertainty and verify important facts before presenting them."],
  sources: ["How will a reader know where the facts came from?", "Ask for traceable sources beside the claims they support."],
  stack: ["You do not need to know tool names yet. Would a simple form, a site builder, or a custom web app fit best?", "A tech stack is the set of tools and where the site runs. Choose a route, or ask for two beginner-friendly options with tradeoffs and a pause for your choice."],
  data: ["What should each sign-up remember, and what mistakes should the site prevent?", "Think in fields such as a person's details and contribution. Decide what must be unique instead of designing a database."],
  access: ["What should a student be able to do, and what extra control does a class rep need?", "Describe permissions by user type: who can view, add, edit, close, or remove information."],
  auth: ["How will the system know who each person is?", "Choose a simple sign-in or identification method that fits the scenario."],
  security: ["What could go wrong if the wrong person gets access?", "Add one rule that protects personal data or prevents misuse."],
  scope: ["What is the smallest version that would solve the class's problem?", "Name the must-have screens or actions, then identify one tempting extra to leave for later."],
  goal: ["What should be true when the task is finished?", "Write one clear outcome that another person could check."],
  steps: ["What order should the agent work in?", "Break the job into small steps with a clear sequence."],
  tools: ["Which tools can the agent use for each step?", "Match a tool to the work and say when it should be used."],
  done: ["How can the agent check that it is actually done?", "Add a short checklist of observable success conditions."],
  structure: ["What parts should the response contain?", "Name the sections in the order you want them."],
  decomposition: ["Which part of this job should happen first?", "Split the task into smaller jobs that can be checked one at a time."],
  examples: ["What example would make the pattern visible without doing the task for the agent?", "Give two short input-to-output examples, then name the pattern they demonstrate."],
  clarifying: ["Which missing answer would change the plan most?", "Ask a few high-value questions and tell the agent to wait before assuming."],
  criteria: ["How will you decide whether the result is good?", "Write checkable criteria for audience, evidence, structure and limits."],
  boundaries: ["What must the agent never assume or do?", "Name forbidden actions and the point where the agent must stop."],
  permissions: ["Does each tool have only the access this job needs?", "State read, write and send permissions separately, including what is forbidden."],
  checkpoints: ["Which action needs a person to review it first?", "Add approval before sending, publishing, spending or deleting."],
  recovery: ["What should happen when a check or tool fails?", "Set a retry limit, escalation path and stop condition."],
};

function coachingHint(key: string, level: number) {
  const pair = HINT_QUESTIONS[key] ?? [
    `What detail could make the ${label(key).toLowerCase()} clearer?`,
    `Add one checkable instruction about ${label(key).toLowerCase()}.`,
  ];
  return pair[Math.min(level, pair.length - 1)];
}

function checklistDetail(key: string) {
  const details: Record<string, string> = {
    stack: "How it is made and where it runs. Choose a route, or ask the agent to compare two beginner-friendly options.",
    data: "What each sign-up remembers, plus anything that must be unique or required.",
    access: "What students can do versus class reps, including viewing and editing.",
    scope: "The smallest useful version: must-haves now, extras left for later.",
  };
  return details[key] ?? HINT_QUESTIONS[key]?.[1]
    ?? `Add one specific, checkable instruction about ${label(key).toLowerCase()}.`;
}

function briefingParts(task: string) {
  const cleaned = task.replace(/^SCENARIO:\s*/i, "");
  const [scenario, instruction = ""] = cleaned.split(/\n\nYOUR TASK:\s*/i);
  return { scenario: scenario.trim(), instruction: instruction.trim() };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type RunResult = {
  verdict: JudgeVerdict;
  response: string;
  responseFallback: boolean;
  /** p4 only: the response just shown contains the planted fake facts. */
  trapSprung: boolean;
};

type Submitted = {
  verdict: JudgeVerdict;
  auraGained: number;
  newAura: number;
  firstTryBonus: boolean;
};

type Msg =
  | { id: string; role: "agent"; kind: "briefing"; text: string }
  | { id: string; role: "agent"; kind: "text"; text: string; tone?: "plain" | "hype" }
  | { id: string; role: "agent"; kind: "response"; text: string; offline?: boolean }
  | { id: string; role: "agent"; kind: "example"; text: string }
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
      text: "When you are ready, send a prompt. I’ll run it through the agent with this quest’s context, then show you exactly how it responds so you can revise safely.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const [thinkStep, setThinkStep] = useState(0);
  const [lastPrompt, setLastPrompt] = useState("");
  const [lastTier, setLastTier] = useState<Tier | null>(null);
  const [lastTrapSprung, setLastTrapSprung] = useState(false);
  const [runs, setRuns] = useState(0);
  const [failedRuns, setFailedRuns] = useState(0);
  const [exampleShown, setExampleShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<Submitted | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastVerdict, setLastVerdict] = useState<JudgeVerdict | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [coachOpen, setCoachOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const atBottomRef = useRef(true);

  const busy = thinking || submitting;

  const push = useCallback((m: Msg) => setMessages((prev) => [...prev, m]), []);

  // Staged activity labels keep the wait understandable without exposing hidden reasoning.
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
      // Never stall the demo — score locally and show a clear text-only fallback.
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
        response: "The live task agent could not respond just now. Your prompt was still scored, so use Pixel’s feedback below and test it again.",
        responseFallback: true,
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
    const { verdict: v, response, responseFallback, trapSprung } = await run(text);
    await sleep(Math.max(0, 1800 + Math.random() * 600 - (Date.now() - started)));
    setThinking(false);
    setRuns((r) => r + 1);
    const nextFailedRuns = v.tier === "farmer" ? 0 : failedRuns + 1;
    setFailedRuns(nextFailedRuns);
    setLastTier(v.tier);
    setLastVerdict(v);
    setHintLevel(0);
    setLastTrapSprung(trapSprung);
    push({
      id: nextId(),
      role: "agent",
      kind: "response",
      text: response,
      offline: responseFallback,
    });
    if (v.tier !== "farmer" && v.missing?.length) {
      push({
        id: nextId(),
        role: "agent",
        kind: "text",
        text: `Good test run. Look at ${label(v.missing[0])}: ${coachingHint(v.missing[0], 0)}`,
      });
    }
    if (nextFailedRuns >= 2 && !exampleShown) {
      const example = SIMILAR_PROMPT_EXAMPLES[quest.id];
      if (example) {
        setExampleShown(true);
        push({ id: nextId(), role: "agent", kind: "example", text: example });
      }
    }
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
      // The takeover must match the response they actually submitted, not a second opinion.
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
        text: `Result saved. You earned ${data.auraGained} aura. Review what you learned, then head back to the quest map.`,
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

  const brief = briefingParts(quest.task);
  const focusKey = lastVerdict?.missing?.[0]
    ?? quest.rubric?.[0]
    ?? "context";
  const stage = locked ? 3 : runs > 0 ? 2 : 1;

  function requestHint() {
    setCoachOpen(true);
    if (hintLevel === 0) {
      setHintLevel(1);
      return;
    }
    requestAnimationFrame(() => {
      promptRef.current?.focus();
      promptRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  return (
    <div className="pq-page mx-auto w-full max-w-[1600px] px-2 pb-4 pt-2 sm:px-4">
      <Link href="/quests" className="pq-back">← Back to quest map</Link>

      <section className="pq-shell" aria-label={`${quest.title} learning workspace`}>
        <header className="pq-header">
          <div className="min-w-0">
            <p className="pq-kicker">
              {quest.category === "agents" ? "Agent quest" : "Prompting quest"} {quest.id.slice(1)}
            </p>
            <h1>{quest.title}</h1>
          </div>
          <ol className="pq-progress" aria-label={`Step ${stage} of 3`}>
            {["Understand", "Test and improve", "Submit"].map((item, index) => (
              <li key={item} className={stage > index ? "is-current" : ""}>
                <span>{stage > index + 1 ? "✓" : index + 1}</span>
                <small>{item}</small>
              </li>
            ))}
          </ol>
          <div className="pq-run-count" aria-label={`${runs} test runs`}>
            <strong>{runs}</strong><span>test {runs === 1 ? "run" : "runs"}</span>
          </div>
        </header>

        <div className="pq-workspace">
          <aside className={`pq-coach ${coachOpen ? "is-open" : ""}`} aria-label="AI learning coach">
            <button
              type="button"
              className="pq-coach-toggle"
              onClick={() => setCoachOpen((open) => !open)}
              aria-expanded={coachOpen}
            >
              <AgentAvatar mood={mood} size="sm" />
              <span><strong>Meet Pixel</strong><small>Your learning coach</small></span>
              <b aria-hidden="true">{coachOpen ? "−" : "+"}</b>
            </button>
            {coachOpen && (
              <div className="pq-coach-body">
                <div className="pq-coach-speech" aria-live="polite">
                  <p className="pq-kicker">Your next move</p>
                  <p>
                    {thinking
                      ? "I’m testing your instructions now. Watch the activity so you know what is happening."
                      : locked
                        ? "You finished this quest. Nice work reflecting before submitting."
                        : runs === 0
                          ? `${hintLevel === 0 ? "Start with the situation. " : "Here is a clearer nudge: "}${coachingHint(focusKey, Math.min(hintLevel, 1))}`
                          : lastVerdict?.tier === "farmer"
                            ? "Your prompt is clear and checkable. Review the result once more before submitting."
                            : coachingHint(focusKey, Math.min(hintLevel, 1))}
                  </p>
                </div>

                {!locked && lastVerdict?.tier !== "farmer" && (
                  <button type="button" className="pq-hint-button" onClick={requestHint} disabled={busy || locked}>
                    <span aria-hidden="true">💡</span>
                    {hintLevel === 0 ? "Show me a clearer hint" : "Write with this hint"}
                  </button>
                )}
                <p className="pq-hint-note">Hints ask you what to consider. They never write the prompt for you.</p>

                {!!quest.rubric?.length && (
                  <div className="pq-checklist">
                    <p className="pq-kicker">Prompt checklist</p>
                    <ul>
                      {quest.rubric.map((item) => {
                        const missing = lastVerdict?.missing?.includes(item);
                        const covered = lastVerdict && !missing;
                        return (
                          <li key={item} className={covered ? "is-covered" : missing ? "is-missing" : ""}>
                            <span className="pq-check-mark" aria-hidden="true">{covered ? "✓" : missing ? "○" : "·"}</span>
                            <div className="pq-check-copy">
                              <div>
                                <strong>{label(item)}</strong>
                                <small>{covered ? "covered" : missing ? "add detail" : "not checked"}</small>
                              </div>
                              <p>{checklistDetail(item)}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {quest.rubric.includes("stack") && (
                      <p className="pq-guidance-note">
                        <strong>Not sure which tools to choose?</strong> A strong prompt can ask the agent to compare two suitable options, explain the tradeoffs in plain language, and wait for your choice.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>

          <div className="pq-conversation">
            <div ref={scrollRef} onScroll={onScroll} className="pq-transcript chat-scroll">
              {messages.map((m) =>
                m.role === "me" ? (
                  <div key={m.id} className="pq-message pq-message-me">
                    <p className="pq-name">You</p>
                    <div className="pq-user-bubble">{m.text}</div>
                  </div>
                ) : m.kind === "briefing" ? (
                  <article key={m.id} className="pq-briefing">
                    <div className="pq-brief-top">
                      <span aria-hidden="true">🎯</span>
                      <div><p className="pq-kicker">Your mission</p><h2>{quest.subject}</h2></div>
                    </div>
                    <p className="pq-scenario">{brief.scenario}</p>
                    {brief.instruction && (
                      <details>
                        <summary>What should my prompt include?</summary>
                        <p>{brief.instruction}</p>
                      </details>
                    )}
                    <p className="pq-learning-goal"><strong>Learning goal:</strong> {quest.tagline}</p>
                  </article>
                ) : (
                  <div key={m.id} className="pq-message pq-message-agent">
                    <AgentAvatar mood={m.kind === "coach" ? moodFor(m.verdict.tier) : "idle"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="pq-name">Pixel</p>
                      {m.kind === "text" && <div className="pq-agent-bubble">{m.text}</div>}
                      {m.kind === "response" && (
                        <div className="pq-response-wrap">
                          <div className="pq-output-label"><span>Agent response</span><small>Run with this quest’s context</small></div>
                          <AgentResponseBubble text={m.text} questId={quest.id} offline={m.offline} />
                        </div>
                      )}
                      {m.kind === "example" && (
                        <div className="pq-similar-example">
                          <div><span aria-hidden="true">🧩</span><strong>Similar example, different task</strong></div>
                          <p>{m.text}</p>
                          <small>Borrow the structure, then make your own decisions for this mission.</small>
                        </div>
                      )}
                      {m.kind === "coach" && (
                        <div className="pq-feedback">
                          <div><strong>{TIER_LABEL[m.verdict.tier]}</strong><span>{m.verdict.score}/100</span></div>
                          <p>{m.verdict.tier === "farmer" ? `Strong work. ${m.verdict.advice}` : m.verdict.advice}</p>
                          {!!m.verdict.missing?.length && <p className="pq-feedback-focus">Focus next: {label(m.verdict.missing[0])}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}

              {thinking && (
                <div className="pq-message pq-message-agent" role="status" aria-live="polite">
                  <AgentAvatar mood="thinking" size="sm" />
                  <div className="pq-thinking">
                    <p className="pq-name">Pixel is working</p>
                    {THINK_LINES.map((line, index) => (
                      <p key={line} className={index <= thinkStep ? "is-done" : ""}>
                        <span>{index < thinkStep ? "✓" : index === thinkStep ? "●" : "○"}</span>{line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pq-composer">
              {err && <p className="pq-error" role="alert">{err}</p>}
              <label htmlFor="student-prompt">
                {locked ? "Prompt submitted" : runs === 0 ? "Write your first prompt" : "Improve your prompt and test again"}
                <span>{draft.trim().split(/\s+/).filter(Boolean).length} words</span>
              </label>
              <textarea
                ref={promptRef}
                id="student-prompt"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={busy || locked}
                rows={4}
                placeholder={locked ? "This quest is complete." : "Tell the agent what you need. Include enough detail for it to make good decisions."}
              />
              <div className="pq-composer-actions">
                <p>{locked ? "Your result is saved." : "Enter to test. Shift + Enter starts a new line."}</p>
                <button type="button" className="pq-secondary" onClick={requestHint} disabled={busy || locked}>{hintLevel >= 1 ? "✎ Write with hint" : "💡 Hint"}</button>
                <button type="button" className="pq-send" onClick={onSend} disabled={!draft.trim() || busy || locked}>
                  {thinking ? "Testing…" : runs === 0 ? "Test my prompt" : "Test revision"}
                </button>
                <button type="button" className="pq-submit" onClick={onSubmit} disabled={runs === 0 || busy || locked}>
                  {locked ? "Submitted ✓" : submitting ? "Submitting…" : "Submit final"}
                </button>
              </div>
            </div>
          </div>
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
