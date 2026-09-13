import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encodeSession, getDb, type UserRow } from "@/lib/db";
import type { User } from "@/lib/types";

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    classCode: row.class_code,
    role: row.role,
    aura: row.aura,
    title: row.title,
  };
}

export async function POST(req: Request) {
  let body: { name?: string; classCode?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 40);
  const classCode = (body.classCode ?? "").trim().toUpperCase().slice(0, 12);
  const role = body.role === "teacher" ? "teacher" : "student";

  if (!name || !classCode) {
    return NextResponse.json({ error: "name and classCode required" }, { status: 400 });
  }

  const db = getDb();
  let row = db
    .prepare("SELECT * FROM users WHERE name = ? AND class_code = ?")
    .get(name, classCode) as UserRow | undefined;

  if (!row) {
    const info = db
      .prepare("INSERT INTO users (name, class_code, role, aura, title) VALUES (?, ?, ?, 0, NULL)")
      .run(name, classCode, role);
    row = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as UserRow;
  }

  const jar = await cookies();
  jar.set("pai_user", encodeSession(row), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ user: toUser(row) });
}
