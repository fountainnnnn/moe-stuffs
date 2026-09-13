"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { readUserCookieClient } from "@/components/shell/user-cookie";
import AuraBadge from "@/components/shell/AuraBadge";

const PODIUM = [
  { rotate: "-2deg", pull: "sm:-mt-6", ribbon: "var(--accent)", place: "1st" },
  { rotate: "1.5deg", pull: "sm:mt-2", ribbon: "var(--sky)", place: "2nd" },
  { rotate: "-1deg", pull: "sm:mt-5", ribbon: "var(--pop)", place: "3rd" },
];

export default function LeaderboardPage() {
  const [classCode, setClassCode] = useState("3E4");
  const [users, setUsers] = useState<User[] | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search).get("classCode");
    const cookie = readUserCookieClient();
    setClassCode((qs || cookie?.classCode || "3E4").toUpperCase());
    setMe(cookie?.name ?? null);
  }, []);

  const load = useCallback(async (code: string) => {
    try {
      const res = await fetch(
        `/api/leaderboard?classCode=${encodeURIComponent(code)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { users: User[] };
      setUsers(data.users ?? []);
      setStale(false);
    } catch {
      setStale(true);
      setUsers((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load(classCode);
    const t = setInterval(() => load(classCode), 10_000);
    return () => clearInterval(t);
  }, [classCode, load]);

  const students = (users ?? []).filter((u) => u.role !== "teacher");
  const top3 = students.slice(0, 3);
  const rest = students.slice(3);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="stamp text-xs uppercase tracking-[0.18em]">
            classroom wall
          </span>
          <h1 className="font-display mt-3 text-[clamp(2.2rem,6vw,3.6rem)] font-bold leading-none">
            Aura board · {classCode}
          </h1>
          <p className="mt-2 text-sm font-semibold opacity-65">
            Refreshes itself every 10 seconds. Top 3 hold the title.
            {stale ? " (board offline — showing last known)" : ""}
          </p>
        </div>
        <Link href="/quests" className="btn-quiet text-sm">
          Farm more aura →
        </Link>
      </div>

      {/* podium */}
      {users === null ? (
        <p className="mt-10 font-display text-xl opacity-50">loading the wall…</p>
      ) : students.length === 0 ? (
        <div className="card-sticker mt-10 p-6">
          <p className="font-display text-xl">Nobody in {classCode} yet.</p>
          <p className="mt-1 text-sm font-medium opacity-70">
            Be the first name on this wall.
          </p>
        </div>
      ) : (
        <>
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {top3.map((u, i) => {
              const style = PODIUM[i];
              return (
                <li
                  key={u.id}
                  className="card-sticker card-sticker-press relative p-4 pt-7"
                  style={{ rotate: style.rotate }}
                >
                  <div className={style.pull}>
                    <span
                      className="absolute -top-3.5 left-4 rounded-md border-[2.5px] border-ink px-2 py-[1px] text-xs font-extrabold"
                      style={{ background: style.ribbon, color: i === 2 ? "#fff" : "var(--ink)" }}
                    >
                      {style.place}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold opacity-20 tabular-nums">
                        {i + 1}
                      </span>
                      <span
                        className={`font-display text-xl font-bold break-words ${
                          u.name === me ? "underline decoration-4" : ""
                        }`}
                        style={
                          u.name === me
                            ? { textDecorationColor: "var(--accent)" }
                            : undefined
                        }
                      >
                        {u.name}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <AuraBadge aura={u.aura} />
                      <span className="stamp text-[11px]">
                        {u.title ?? "Aura Farmer 👑"}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* taped list rows */}
          {rest.length > 0 ? (
            <ol className="mt-12 space-y-4" start={4}>
              {rest.map((u, i) => (
                <li
                  key={u.id}
                  className="card-sticker relative flex items-center gap-3 px-4 py-3"
                  style={{ rotate: i % 2 ? "0.5deg" : "-0.5deg" }}
                >
                  <span className="tape absolute inset-0 rounded-[var(--radius)]" aria-hidden />
                  <span className="font-display w-8 shrink-0 text-lg font-bold opacity-40 tabular-nums">
                    {i + 4}
                  </span>
                  <span
                    className={`flex-1 font-bold break-words ${
                      u.name === me ? "underline decoration-4" : ""
                    }`}
                    style={
                      u.name === me
                        ? { textDecorationColor: "var(--accent)" }
                        : undefined
                    }
                  >
                    {u.name}
                    {u.name === me ? (
                      <span className="ml-2 text-[11px] font-extrabold uppercase tracking-widest opacity-55">
                        you
                      </span>
                    ) : null}
                  </span>
                  <AuraBadge aura={u.aura} size="sm" />
                </li>
              ))}
            </ol>
          ) : null}
        </>
      )}
    </main>
  );
}
