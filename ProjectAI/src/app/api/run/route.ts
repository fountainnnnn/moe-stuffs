import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb, getSessionUser } from "@/lib/db";
import { executeArtifact, fallbackArtifact } from "@/lib/execute";
import { demandsVerification, judgePrompt } from "@/lib/judge";
import { getQuest } from "@/lib/quests";

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
  if (!quest?.rubric?.length || !quest.artifact) {
    return NextResponse.json({ error: "unknown prompting quest" }, { status: 400 });
  }
  if (!prompt.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  // Judge the prompt and run it, concurrently — the artifact is what the student sees,
  // the verdict is what coaches them (and picks the offline fallback artifact).
  const [verdict, executed] = await Promise.all([
    judgePrompt(quest, prompt),
    executeArtifact(quest, prompt),
  ]);

  const artifact = executed ?? fallbackArtifact(quest, verdict.tier);
  const artifactFallback = executed === null;

  // p4 only: the same deterministic check the executor used to decide whether to plant
  // the fake facts, so the FLAGGED takeover can never disagree with the artifact shown.
  const trapSprung = quest.id === "p4" && !demandsVerification(prompt);

  const jar = await cookies();
  const db = getDb();
  const user = getSessionUser(db, jar.get("pai_user")?.value);
  if (user) {
      db.prepare(
        `INSERT INTO attempts (user_id, quest_id, prompt, score, tier, feedback, missing, submitted)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      ).run(user.id, questId, prompt, verdict.score, verdict.tier, verdict.advice, JSON.stringify(verdict.missing));
  }

  return NextResponse.json({ verdict, artifact, artifactFallback, trapSprung });
}
