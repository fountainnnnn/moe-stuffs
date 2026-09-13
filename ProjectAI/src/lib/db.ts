import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

let instance: Database.Database | null = null;

function init(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class_code TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      aura INTEGER NOT NULL DEFAULT 0,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id TEXT NOT NULL,
      prompt TEXT NOT NULL DEFAULT '',
      score INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL DEFAULT 'npc',
      feedback TEXT NOT NULL DEFAULT '',
      missing TEXT NOT NULL DEFAULT '[]',
      submitted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_quest ON attempts(quest_id);
    CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_code);
  `);
}

// Fake classmates so the leaderboard looks alive on stage.
const SEED_STUDENTS: [string, number][] = [
  ["xX_kaya_toast_Xx", 185],
  ["skibidi_scholar", 160],
  ["chope_the_seat", 135],
  ["mrbeanbun", 120],
  ["ah_ma_wifi", 95],
  ["prata_flipper99", 70],
  ["lagging_larry", 45],
  ["sleepy_shiba", 20],
];

function seed(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (count.n > 0) return;

  const insert = db.prepare(
    "INSERT INTO users (name, class_code, role, aura, title) VALUES (?, ?, ?, ?, ?)",
  );
  const run = db.transaction(() => {
    insert.run("Ms Tan", "3E4", "teacher", 0, null);
    for (const [name, aura] of SEED_STUDENTS) {
      insert.run(name, "3E4", "student", aura, null);
    }
    // A few seeded attempts so the teacher dashboard's "common gaps" panel has real data.
    const attempt = db.prepare(
      `INSERT INTO attempts (user_id, quest_id, prompt, score, tier, feedback, missing, submitted)
       VALUES ((SELECT id FROM users WHERE name = ?), ?, ?, ?, ?, ?, ?, 1)`,
    );
    attempt.run(
      "xX_kaya_toast_Xx",
      "p1",
      "You are our school's event planner. Plan an AI club open house for 120 Sec 3 students in the hall, 2 hours, budget $200. Give me a table: time, activity, who runs it. Keep the tone hype but school-appropriate.",
      88,
      "farmer",
      "W prompt, no notes.",
      "[]",
    );
    attempt.run("skibidi_scholar", "p1", "plan my ai club open house please", 40, "npc", "Bro gave the agent zero context.", '["context","role","format","tone"]');
    attempt.run("chope_the_seat", "p1", "Plan a 2 hour AI club open house for Sec 3s. List the activities.", 64, "grinder", "Give it a role and a tone, then it's a W.", '["role","tone"]');
    attempt.run("mrbeanbun", "p4", "Research AI in Singapore schools and summarise it for me", 35, "npc", "You never asked it to cite anything — cap detected.", '["verification","sources"]');
    attempt.run("ah_ma_wifi", "p4", "Summarise AI use in SG schools, and tell me which claims you are unsure about.", 62, "grinder", "Almost — demand real sources, not vibes.", '["sources"]');
    attempt.run("prata_flipper99", "p2", "Build a class poll app", 30, "npc", "No stack, no data, no access rules. Spec it.", '["stack","data","access"]');
    attempt.run("lagging_larry", "p1", "make open house plan", 25, "npc", "Three words is not a prompt.", '["context","role","action","format","tone"]');
  });
  run();
}

export function getDb(): Database.Database {
  if (instance) return instance;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  init(db);
  seed(db);
  instance = db;
  return db;
}

export interface UserRow {
  id: number;
  name: string;
  class_code: string;
  role: "student" | "teacher";
  aura: number;
  title: string | null;
  created_at: string;
}

export interface AttemptRow {
  id: number;
  user_id: number;
  quest_id: string;
  prompt: string;
  score: number;
  tier: string;
  feedback: string;
  missing: string;
  submitted: 0 | 1;
  created_at: string;
}
