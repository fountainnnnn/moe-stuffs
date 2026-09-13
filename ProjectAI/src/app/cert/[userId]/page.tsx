import Link from "next/link";
import { getDb, type AttemptRow, type UserRow } from "@/lib/db";
import { TIER_LABEL, type Tier } from "@/lib/types";

const TIER_RANK: Record<Tier, number> = { npc: 0, grinder: 1, farmer: 2 };

function isTier(v: string): v is Tier {
  return v === "npc" || v === "grinder" || v === "farmer";
}

export default async function CertPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const id = Number(userId);
  const db = getDb();
  const user = Number.isFinite(id)
    ? (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined)
    : undefined;

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20">
        <div className="card-sticker p-6">
          <h1 className="font-display text-2xl font-bold">No such student 🤨</h1>
          <p className="mt-2 text-sm font-semibold opacity-70">
            That certificate doesn&apos;t belong to anyone in this build.
          </p>
          <Link href="/leaderboard" className="btn-quiet mt-5 inline-block text-sm">
            Back to the aura board
          </Link>
        </div>
      </main>
    );
  }

  const attempts = db
    .prepare("SELECT * FROM attempts WHERE user_id = ? AND submitted = 1")
    .all(user.id) as AttemptRow[];

  const questsDone = new Set(attempts.map((a) => a.quest_id)).size;
  const best = attempts.reduce<Tier>((acc, a) => {
    const t = isTier(a.tier) ? a.tier : "npc";
    return TIER_RANK[t] > TIER_RANK[acc] ? t : acc;
  }, "npc");
  const title =
    user.title ?? (best === "farmer" ? "Aura Farmer" : best === "grinder" ? "Prompt Grinder" : "Certified NPC");
  const date = new Date().toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 pt-8 pb-16">
      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        <Link href="/leaderboard" className="btn-quiet text-sm">
          ← Aura board
        </Link>
        <p className="text-sm font-semibold opacity-60">
          Ctrl/Cmd + P to print or save as PDF.
        </p>
      </div>

      <article className="cert card-sticker relative overflow-hidden px-7 py-9 sm:px-12 sm:py-12">
        <div
          className="pointer-events-none absolute inset-3 rounded-lg border-2 border-ink opacity-35"
          aria-hidden
        />
        <div className="relative">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.32em] opacity-70">
            Certificate of AI Literacy
          </p>
          <h1 className="font-display mt-2 text-center text-[clamp(1.6rem,5vw,2.4rem)] font-bold leading-tight">
            ProjectAI ⚡
          </h1>

          <p className="mt-9 text-center text-sm font-semibold uppercase tracking-[0.2em] opacity-60">
            awarded to
          </p>
          <p className="font-display mt-2 text-center text-[clamp(2rem,7vw,3.4rem)] font-bold leading-none break-words">
            {user.name}
          </p>
          <p className="mt-3 text-center text-sm font-bold opacity-70">
            Class {user.class_code}
          </p>

          <div className="mx-auto mt-9 flex max-w-lg flex-wrap items-center justify-center gap-3">
            <span className="stamp text-sm" style={{ background: "var(--accent)" }}>
              {title} {best === "farmer" ? "👑" : ""}
            </span>
            <span className="stamp text-sm" style={{ rotate: "2.5deg" }}>
              tier earned · {TIER_LABEL[best]}
            </span>
          </div>

          <dl className="mx-auto mt-9 grid max-w-md grid-cols-2 gap-4 text-center">
            <div className="rounded-lg border-2 border-ink px-3 py-3">
              <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] opacity-60">
                Total aura
              </dt>
              <dd className="font-display text-3xl font-bold tabular-nums">
                {user.aura}
              </dd>
            </div>
            <div className="rounded-lg border-2 border-ink px-3 py-3">
              <dt className="text-[11px] font-extrabold uppercase tracking-[0.16em] opacity-60">
                Quests cleared
              </dt>
              <dd className="font-display text-3xl font-bold tabular-nums">
                {questsDone}
              </dd>
            </div>
          </dl>

          <p className="mx-auto mt-9 max-w-md text-center text-sm font-medium leading-snug opacity-75">
            For writing prompts with real context, a role, a clear action, a
            format and a tone — and for checking what the AI claims before
            believing it.
          </p>

          <div className="mt-10 flex items-end justify-between gap-4 border-t-2 border-ink pt-4">
            <div>
              <p className="font-display text-base font-bold">{date}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">
                date awarded
              </p>
            </div>
            <p className="text-right text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">
              Edu2030 Vibe Hackathon · ProjectAI
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
