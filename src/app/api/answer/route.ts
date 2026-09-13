import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb, getSessionUser, type AttemptRow } from "@/lib/db";
import { getQuest } from "@/lib/quests";
import type { Tier } from "@/lib/types";

const AURA_PER_CORRECT = 10;

function tierForRatio(correct: number, total: number): Tier {
  const pct = total ? (correct / total) * 100 : 0;
  if (pct >= 80) return "farmer";
  if (pct >= 50) return "grinder";
  return "npc";
}

export async function POST(req: Request) {
  let body: { questId?: string; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const questId = (body.questId ?? "").trim();
  const quest = getQuest(questId);
  if (!quest?.items?.length) {
    return NextResponse.json({ error: "unknown knowledge quest" }, { status: 400 });
  }
  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }
  const answers = body.answers.map((a) => Number(a));

  const items = quest.items;
  const results = items.map((item, i) => ({
    correct: answers[i] === item.answerIndex,
    explanation: item.explanation,
  }));
  const correct = results.filter((r) => r.correct).length;
  const total = items.length;

  const jar = await cookies();
  const db = getDb();
  const user = getSessionUser(db, jar.get("pai_user")?.value);
  if (!user) return NextResponse.json({ error: "not joined" }, { status: 401 });
  const userId = user.id;

  // Only pay out the improvement over their previous best run of this quest.
  const prior = db
    .prepare("SELECT * FROM attempts WHERE user_id = ? AND quest_id = ? AND submitted = 1")
    .all(userId, questId) as AttemptRow[];
  let prevBestCorrect = 0;
  for (const row of prior) {
    const c = Math.round((row.score / 100) * total);
    if (c > prevBestCorrect) prevBestCorrect = c;
  }

  const auraGained = Math.max(0, correct - prevBestCorrect) * AURA_PER_CORRECT;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const missing = items
    .filter((_, i) => !results[i].correct)
    .map((item) => item.id);

  db.prepare(
    `INSERT INTO attempts (user_id, quest_id, prompt, score, tier, feedback, missing, submitted)
     VALUES (?, ?, '', ?, ?, ?, ?, 1)`,
  ).run(userId, questId, score, tierForRatio(correct, total), `${correct}/${total} correct`, JSON.stringify(missing));

  const newAura = user.aura + auraGained;
  if (auraGained !== 0) {
    db.prepare("UPDATE users SET aura = ? WHERE id = ?").run(newAura, userId);
  }

  return NextResponse.json({ correct, total, auraGained, newAura, results });
}
