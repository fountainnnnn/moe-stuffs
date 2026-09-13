"use client";

import { useState } from "react";
import Link from "next/link";
import type { Quest } from "@/lib/types";
import AgentAvatar from "@/components/AgentAvatar";
import Confetti from "./Confetti";
import UiIcon from "@/components/UiIcon";

type AnswerResponse = {
  correct: number;
  total: number;
  auraGained: number;
  newAura: number;
  results: { correct: boolean; explanation: string }[];
};

export default function KnowledgeQuest({ quest }: { quest: Quest }) {
  const items = quest.items ?? [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [scored, setScored] = useState<AnswerResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const item = items[idx];
  const thinkingHint = item?.hint ?? "Name the strongest clue in each option. Eliminate choices that rely only on confidence or appearance.";

  async function finish(all: number[]) {
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: quest.id, answers: all }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setScored((await res.json()) as AnswerResponse);
    } catch {
      // local grading so the demo survives a dead server
      const results = items.map((it, i) => ({
        correct: all[i] === it.answerIndex,
        explanation: it.explanation,
      }));
      const correct = results.filter((r) => r.correct).length;
      setScored({ correct, total: items.length, auraGained: 0, newAura: 0, results });
      setErr("Server didn't answer — graded locally, aura not saved.");
    } finally {
      setSending(false);
    }
  }

  function next() {
    if (picked === null || !revealed) return;
    const all = [...answers, picked];
    setAnswers(all);
    setPicked(null);
    setRevealed(false);
    setHintOpen(false);
    if (all.length >= items.length) void finish(all);
    else setIdx((i) => i + 1);
  }

  function checkThinking() {
    if (picked === null) return;
    setRevealed(true);
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-black">This quest has no items yet. Check back after the patch.</p>
        <Link href="/quests" className="btn-loud card-sticker-press mt-4 inline-block">
          ← quest map
        </Link>
      </div>
    );
  }

  if (scored) {
    const pct = Math.round((scored.correct / scored.total) * 100);
    const hyped = pct >= 80;
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        {hyped && <Confetti />}
        <section className="card-sticker tilt-r p-5 text-center">
          <div className="flex justify-center">
            <AgentAvatar mood={hyped ? "hyped" : pct >= 50 ? "idle" : "disappointed"} size="lg" />
          </div>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.22em] opacity-55">
            results
          </p>
          <p className="text-4xl font-black">
            {scored.correct}/{scored.total}
          </p>
          <p className="mt-1 text-sm font-bold opacity-70">
            {hyped
              ? "Strong judgment. You can explain what evidence matters."
              : pct >= 50
                ? "Good start. Review the missed ideas, then try again."
                : "This is practice, not a verdict. Read the reasoning and take another run."}
          </p>
          {scored.auraGained > 0 && (
            <p className="mt-3 text-xl font-black text-[var(--accent-ink)]">
              +{scored.auraGained} AURA{" "}
              <span className="text-sm font-bold opacity-60">· total {scored.newAura}</span>
            </p>
          )}
          {err && <p className="mt-2 text-sm font-bold text-[var(--pop)]">{err}</p>}
        </section>

        <ul className="mt-5 space-y-3">
          {scored.results.map((r, i) => (
            <li key={i} className={`card-sticker ${i % 2 ? "tilt-l" : "tilt-r"} p-4`}>
              <div className="flex items-start gap-3">
                <span
                  className="stamp shrink-0 text-xs"
                  style={{
                    background: r.correct ? "var(--accent)" : "var(--pop)",
                    color: r.correct ? "var(--ink)" : "#fff",
                  }}
                >
                  {r.correct ? "GOT IT" : "MISSED"}
                </span>
                <div>
                  <p className="text-sm font-extrabold">{items[i]?.prompt}</p>
                  <p className="mt-1 text-sm font-semibold opacity-75">{r.explanation}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/leaderboard" className="btn-loud card-sticker-press inline-block">
            <UiIcon name="leaderboard" size={20} className="mr-1.5" /> Leaderboard
          </Link>
          <Link
            href="/quests"
            className="card-sticker card-sticker-press inline-block px-4 py-2 text-sm font-extrabold"
          >
            <UiIcon name="quest-map" size={20} className="mr-1.5" /> Quest map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Link href="/quests" className="text-sm font-extrabold underline decoration-2 underline-offset-4">
        ← quest map
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] opacity-55">
          {quest.title} · {idx + 1}/{items.length}
        </p>
        <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-[var(--ink)] bg-white">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${((idx + (revealed ? 1 : 0)) / items.length) * 100}%` }}
          />
        </div>
      </div>

      <aside className="mt-4 flex items-start gap-3 rounded-[var(--radius)] border-2 border-[var(--ink)] bg-[var(--card)] p-4 shadow-[3px_3px_0_var(--ink)]">
        <AgentAvatar mood={revealed ? (picked === item.answerIndex ? "hyped" : "idle") : "thinking"} size="sm" />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-55">Pixel&apos;s game plan</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">
            {idx === 0
              ? quest.task
              : revealed
                ? "Read why the choice works, then move on when the idea makes sense."
                : "Explain the clue to yourself before choosing. Use the nudge only if you are stuck."}
          </p>
        </div>
      </aside>

      <section key={item.id} className="card-sticker mt-4 p-5">
        {quest.id === "k1" && idx === 0 ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border-2 border-dashed border-[var(--ink)] bg-[var(--paper)] p-3 text-xs font-bold leading-snug">
            <UiIcon name="alert" size={24} />
            <p>
              Training simulation: every visual in this round is synthetic. Judge whether the
              image shows obvious AI clues—not whether we possess a camera original.
            </p>
          </div>
        ) : null}
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="mb-4 w-full rounded-[var(--radius)] border-2 border-[var(--ink)] object-cover"
          />
        )}
        <p className="text-lg font-extrabold leading-snug">{item.prompt}</p>
        {!revealed ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setHintOpen((open) => !open)}
              className="rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-sm font-extrabold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--sky)]"
              aria-expanded={hintOpen}
            >
              {hintOpen ? "Hide nudge" : "💡 Need a nudge?"}
            </button>
            {hintOpen ? (
              <p className="mt-2 max-w-[65ch] rounded-lg bg-[var(--paper)] p-3 text-sm font-semibold leading-relaxed">
                {thinkingHint}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {item.options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => setPicked(i)}
              disabled={revealed}
              aria-pressed={picked === i}
              className="card-sticker card-sticker-press px-4 py-4 text-left text-base font-extrabold"
              style={
                revealed && i === item.answerIndex
                  ? { background: "var(--accent)" }
                  : revealed && picked === i
                    ? { background: "var(--coral)" }
                    : picked === i
                      ? { background: "var(--gold)" }
                      : undefined
              }
            >
              <span className="mr-2 opacity-45">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        {revealed ? (
          <div
            className="mt-4 rounded-xl border-2 border-[var(--ink)] bg-[var(--paper)] p-4"
            role="status"
            aria-live="polite"
          >
            <p className="font-black">
              {picked === item.answerIndex ? "You found the key idea." : "Good attempt. Here is the missing clue."}
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed opacity-80">{item.explanation}</p>
          </div>
        ) : null}
      </section>

      <button
        onClick={revealed ? next : checkThinking}
        disabled={picked === null || sending}
        className="btn-loud card-sticker-press mt-5 w-full disabled:opacity-40"
      >
        {sending
          ? "grading…"
          : !revealed
            ? "Check my thinking"
            : answers.length + 1 >= items.length
              ? "Finish and see my results"
              : "Next idea →"}
      </button>
    </div>
  );
}
