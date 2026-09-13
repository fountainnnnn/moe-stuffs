import { NextResponse } from "next/server";
import { applyTitles } from "@/lib/aura";
import { getDb, type UserRow } from "@/lib/db";
import type { User } from "@/lib/types";

export async function GET(req: Request) {
  const classCode = (new URL(req.url).searchParams.get("classCode") ?? "3E4").trim().toUpperCase();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM users WHERE class_code = ? AND role = 'student'")
    .all(classCode) as UserRow[];

  const users: User[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    classCode: r.class_code,
    role: r.role,
    aura: r.aura,
    title: r.title,
  }));

  return NextResponse.json({ users: applyTitles(users) });
}
