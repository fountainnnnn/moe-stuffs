import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auraDelta, TIER_ORDER } from "@/lib/aura";
import { getDb, type AttemptRow, type UserRow } from "@/lib/db";
import { judgePrompt } from "@/lib/judge";
import { getQuest } from "@/lib/quests";
import type { Tier } from "@/lib/types";

export async function POST(req: Request) {
  let body: { questId?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const questId = (body.questId ?? "").trim();
  const prompt = (body.prompt ?? "").toString();
  const quest = getQuest(questId);
  if (!quest || quest.category !== "prompting") {
    return NextResponse.json({ error: "unknown prompting quest" }, { status: 400 });
  }
  if (!prompt.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const jar = await cookies();
  const userId = Number(jar.get("pai_user")?.value);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "not joined" }, { status: 401 });
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow | undefined;
  if (!user) return NextResponse.json({ error: "not joined" }, { status: 401 });

  const verdict = await judgePrompt(quest, prompt);

  const priorRows = db
    .prepare("SELECT * FROM attempts WHERE user_id = ? AND quest_id = ?")
    .all(userId, questId) as AttemptRow[];
  const firstTry = priorRows.length === 0;

  let bestTier: Tier | null = null;
  for (const row of priorRows) {
    if (row.submitted !== 1) continue;
    const t = row.tier as Tier;
    if (TIER_ORDER[t] === undefined) continue;
    if (bestTier === null || TIER_ORDER[t] > TIER_ORDER[bestTier]) bestTier = t;
  }

  const { auraGained, firstTryBonus } = auraDelta(verdict.tier, bestTier, firstTry);

  db.prepare(
    `INSERT INTO attempts (user_id, quest_id, prompt, score, tier, feedback, missing, submitted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
  ).run(userId, questId, prompt, verdict.score, verdict.tier, verdict.advice, JSON.stringify(verdict.missing));

  const newAura = user.aura + auraGained;
  if (auraGained !== 0) {
    db.prepare("UPDATE users SET aura = ? WHERE id = ?").run(newAura, userId);
  }

  return NextResponse.json({ verdict, auraGained, newAura, firstTryBonus });
}
