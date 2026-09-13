"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Tier, User } from "@/lib/types";
import { readUserCookieClient } from "@/components/shell/user-cookie";
import TierChip from "@/components/shell/TierChip";

type Row = User & { questsDone: number; tiers: Record<string, Tier> };
type Gap = { element: string; count: number };

const QUEST_ORDER = ["p1", "p2", "p3", "p4", "k1", "k2", "k3"];

const GAP_ROAST: Record<string, string> = {
  context: "they tell the AI nothing about the situation",
  role: "nobody gives the AI a job title",
  action: "the ask itself is vague",
  format: "they never say what the output should look like",
  tone: "tone is left to vibes",
  sources: "they trust the AI without asking for sources",
  verification: "nobody asks the AI to check itself",
  stack: "no tech stack in the spec",
  data: "they skip what data is stored",
  access: "no thought about who can see what",
};

export default function TeacherPage() {
  const [classCode, setClassCode] = useState("3E4");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search).get("classCode");
    const cookie = readUserCookieClient();
    setClassCode((qs || cookie?.classCode || "3E4").toUpperCase());
  }, []);

  const load = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/teacher?classCode=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { students: Row[]; commonGaps: Gap[] };
      setRows(data.students ?? []);
      setGaps(data.commonGaps ?? []);
      setError(false);
    } catch {
      setError(true);
      setRows((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load(classCode);
    const t = setInterval(() => load(classCode), 15_000);
    return () => clearInterval(t);
  }, [classCode, load]);

  const maxGap = Math.max(1, ...gaps.map((g) => g.count));
  const topGap = gaps[0];
  const questIds = Array.from(
    new Set(
      (rows ?? []).flatMap((r) => Object.keys(r.tiers ?? {})),
    ),
  ).sort((a, b) => QUEST_ORDER.indexOf(a) - QUEST_ORDER.indexOf(b));

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="stamp text-xs uppercase tracking-[0.18em]">
            teacher view
          </span>
          <h1 className="font-display mt-3 text-[clamp(2.2rem,6vw,3.6rem)] font-bold leading-none">
            Class {classCode}
          </h1>
          <p className="mt-2 text-sm font-semibold opacity-65">
            Live off real attempts. Refreshes every 15s.
            {error ? " · couldn't reach the class data" : ""}
          </p>
        </div>
        <Link href="/leaderboard" className="btn-quiet text-sm">
          Show the aura board →
        </Link>
      </div>

      {/* the headline gap — the bit that lands on a projector */}
      {topGap ? (
        <div
          className="card-sticker tilt-l mt-8 px-5 py-4"
          style={{ background: "var(--accent)" }}
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] opacity-70">
            biggest gap right now
          </p>
          <p className="font-display mt-1 text-[clamp(1.5rem,4.5vw,2.6rem)] font-bold leading-tight">
            Your class keeps forgetting {topGap.element.toUpperCase()} 💀
          </p>
          <p className="mt-1 text-sm font-semibold">
            {topGap.count} attempt{topGap.count === 1 ? "" : "s"} missed it —{" "}
            {GAP_ROAST[topGap.element] ?? "it keeps slipping"}.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* students table */}
        <section>
          <h2 className="font-display text-xl font-bold">Students</h2>
          <div className="card-sticker mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b-[2.5px] border-ink text-xs font-extrabold uppercase tracking-[0.12em]">
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Done</th>
                  <th className="px-3 py-2.5">Aura</th>
                  <th className="px-4 py-2.5">Tier per quest</th>
                </tr>
              </thead>
              <tbody>
                {rows === null ? (
                  <tr>
                    <td className="px-4 py-6 font-display opacity-50" colSpan={4}>
                      loading class…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 font-semibold opacity-60" colSpan={4}>
                      No students in {classCode} yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b-2 border-[color-mix(in_srgb,var(--ink)_12%,transparent)] last:border-0"
                    >
                      <td className="px-4 py-2.5 font-bold">
                        <Link
                          href={`/cert/${r.id}`}
                          className="underline decoration-2 decoration-[color-mix(in_srgb,var(--ink)_25%,transparent)] hover:decoration-[var(--accent-ink)]"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-display text-lg font-bold tabular-nums">
                        {r.questsDone}
                      </td>
                      <td className="px-3 py-2.5 font-display text-lg font-bold tabular-nums">
                        {r.aura}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {questIds.length === 0 ? null : questIds.map((q) => {
                            const tier = r.tiers?.[q];
                            if (!tier) {
                              return (
                                <span
                                  key={q}
                                  className="hatch rounded-full border-2 border-[color-mix(in_srgb,var(--ink)_25%,transparent)] px-2 py-[1px] text-[11px] font-bold opacity-45"
                                  title="not attempted"
                                >
                                  {q.toUpperCase()}
                                </span>
                              );
                            }
                            return (
                              <TierChip
                                key={q}
                                tier={tier}
                                compact
                                label={`${q.toUpperCase()} · ${
                                  tier === "farmer" ? "👑" : tier === "grinder" ? "😤" : "💀"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* class gaps bars */}
        <section>
          <h2 className="font-display text-xl font-bold">Class gaps</h2>
          <p className="text-sm font-semibold opacity-65">
            Rubric elements the class keeps missing, counted across submitted
            attempts.
          </p>
          <div className="card-sticker tilt-r mt-3 p-4">
            {gaps.length === 0 ? (
              <p className="py-4 text-sm font-semibold opacity-60">
                No submitted attempts yet — nothing to diagnose.
              </p>
            ) : (
              <ul className="space-y-3.5">
                {gaps.map((g, i) => (
                  <li key={g.element}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-sm font-bold uppercase tracking-[0.1em]">
                        {g.element}
                      </span>
                      <span className="text-xs font-extrabold tabular-nums opacity-60">
                        {g.count} miss{g.count === 1 ? "" : "es"}
                      </span>
                    </div>
                    <div className="mt-1 h-5 w-full rounded-md border-2 border-ink bg-[var(--paper)]">
                      <div
                        className="h-full rounded-[3px]"
                        style={{
                          width: `${Math.round((g.count / maxGap) * 100)}%`,
                          background: i === 0 ? "var(--pop)" : "var(--accent)",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-medium opacity-60">
                      {GAP_ROAST[g.element] ?? "keeps getting skipped"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-4 text-xs font-medium opacity-55">
            Teach to the tallest bar tomorrow morning.
          </p>
        </section>
      </div>
    </main>
  );
}
