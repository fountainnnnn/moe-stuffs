import { NextResponse } from "next/server";
import { applyTitles, TIER_ORDER } from "@/lib/aura";
import { getDb, type AttemptRow, type UserRow } from "@/lib/db";
import type { Tier, User } from "@/lib/types";

export async function GET(req: Request) {
  const classCode = (new URL(req.url).searchParams.get("classCode") ?? "3E4").trim().toUpperCase();
  const db = getDb();

  const rows = db
    .prepare("SELECT * FROM users WHERE class_code = ? AND role = 'student'")
    .all(classCode) as UserRow[];

  const base: User[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    classCode: r.class_code,
    role: r.role,
    aura: r.aura,
    title: r.title,
  }));
  const ranked = applyTitles(base);

  const attempts = rows.length
    ? (db
        .prepare(
          `SELECT * FROM attempts WHERE submitted = 1 AND user_id IN (${rows.map(() => "?").join(",")})`,
        )
        .all(...rows.map((r) => r.id)) as AttemptRow[])
    : [];

  // best tier per user per quest
  const byUser = new Map<number, Record<string, Tier>>();
  const gaps = new Map<string, number>();

  for (const a of attempts) {
    const tier = a.tier as Tier;
    if (TIER_ORDER[tier] !== undefined) {
      const tiers = byUser.get(a.user_id) ?? {};
      const prev = tiers[a.quest_id];
      if (!prev || TIER_ORDER[tier] > TIER_ORDER[prev]) tiers[a.quest_id] = tier;
      byUser.set(a.user_id, tiers);
    }
    if (a.quest_id.startsWith("p")) {
      let missing: unknown;
      try {
        missing = JSON.parse(a.missing || "[]");
      } catch {
        missing = [];
      }
      if (Array.isArray(missing)) {
        for (const m of missing) {
          if (typeof m !== "string") continue;
          gaps.set(m, (gaps.get(m) ?? 0) + 1);
        }
      }
    }
  }

  const students = ranked.map((u) => {
    const tiers = byUser.get(u.id) ?? {};
    return { ...u, questsDone: Object.keys(tiers).length, tiers };
  });

  const commonGaps = [...gaps.entries()]
    .map(([element, count]) => ({ element, count }))
    .sort((a, b) => b.count - a.count || a.element.localeCompare(b.element));

  return NextResponse.json({ students, commonGaps });
}
