import Link from "next/link";
import { getDb, type AttemptRow, type UserRow } from "@/lib/db";
import { TIER_LABEL, type Tier } from "@/lib/types";
import { CERTIFICATE_QUEST_IDS, getCertificateProgress } from "@/lib/certificate";

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
  const isExample = userId === "example";
  const id = Number(userId);
  const db = getDb();
  const storedUser = Number.isFinite(id)
    ? (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined)
    : undefined;
  const user: UserRow | undefined = isExample
    ? {
        id: 0,
        name: "Aisha Rahman",
        class_code: "3E4",
        role: "student",
        aura: 940,
        title: "AI Literacy Champion",
        created_at: "2026-09-13 00:00:00",
      }
    : storedUser;

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

  const progress = isExample
    ? {
        completedCount: CERTIFICATE_QUEST_IDS.length,
        requiredCount: CERTIFICATE_QUEST_IDS.length,
        isEligible: true,
        completedAt: "2026-09-13 00:00:00",
      }
    : getCertificateProgress(db, user.id);

  if (!progress.isEligible) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="card-sticker p-6">
          <span className="stamp text-xs uppercase tracking-[0.14em]" style={{ background: "var(--sky)" }}>
            locked
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">Certificate not earned yet</h1>
          <p className="mt-2 text-sm font-semibold opacity-70">
            {user.name} has cleared {progress.completedCount} of {progress.requiredCount} available quests.
            The certificate is generated after all {progress.requiredCount} are complete.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/quests" className="btn-loud text-sm">Keep learning →</Link>
            <Link href="/cert/example" className="btn-quiet text-sm">See an example</Link>
          </div>
        </div>
      </main>
    );
  }

  const questsDone = progress.completedCount;
  const best = attempts.reduce<Tier>((acc, a) => {
    const t = isTier(a.tier) ? a.tier : "npc";
    return TIER_RANK[t] > TIER_RANK[acc] ? t : acc;
  }, isExample ? "farmer" : "npc");
  const title =
    user.title ??
    (best === "farmer"
      ? "Aura Farmer"
      : best === "grinder"
        ? "Prompt Grinder"
        : "Certified NPC");
  const date = new Date(`${progress.completedAt?.replace(" ", "T")}Z`).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16">
      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        <Link href={isExample ? "/quests" : "/leaderboard"} className="btn-quiet text-sm">
          ← {isExample ? "Quest map" : "Aura board"}
        </Link>
        <a
          href={`/api/certificate/${userId}`}
          download
          className="btn-loud text-sm"
        >
          Download PDF ↓
        </a>
        <p className="text-sm font-semibold opacity-60">
          16:9 landscape · ready to present or print
        </p>
      </div>

      <article className="cert card-sticker relative flex aspect-video overflow-hidden px-5 py-5 sm:px-12 sm:py-9">
        <div
          className="pointer-events-none absolute inset-3 rounded-lg border-2 border-ink opacity-35"
          aria-hidden
        />
        <div className="relative flex min-h-0 w-full flex-col justify-between">
          {isExample ? (
            <span className="absolute -right-7 -top-5 rotate-[5deg] border-2 border-ink bg-[var(--sky)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider sm:-right-9">
              example
            </span>
          ) : null}
          <div>
            <p className="text-center text-[clamp(0.45rem,1.2vw,0.75rem)] font-extrabold uppercase tracking-[0.32em] opacity-70">
              Certificate of AI Literacy
            </p>
            <h1 className="font-display mt-1 text-center text-[clamp(1rem,3.2vw,2rem)] font-bold leading-tight">
              ProjectAI ⚡
            </h1>
          </div>

          <div>
            <p className="text-center text-[clamp(0.45rem,1.2vw,0.75rem)] font-semibold uppercase tracking-[0.2em] opacity-60">
              awarded to
            </p>
            <p className="font-display mt-1 text-center text-[clamp(1.15rem,5vw,3rem)] font-bold leading-none break-words">
              {user.name}
            </p>
            <p className="mt-1 text-center text-[clamp(0.55rem,1.4vw,0.875rem)] font-bold opacity-70">
              Class {user.class_code}
            </p>
          </div>

          <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2">
            <span className="stamp text-[clamp(0.5rem,1.3vw,0.875rem)]" style={{ background: "var(--accent)" }}>
              {title} {best === "farmer" ? "👑" : ""}
            </span>
            <span className="stamp text-[clamp(0.5rem,1.3vw,0.875rem)]" style={{ rotate: "2.5deg" }}>
              tier earned · {TIER_LABEL[best]}
            </span>
          </div>

          <dl className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border-2 border-ink px-2 py-1 sm:py-2">
              <dt className="text-[clamp(0.4rem,1vw,0.65rem)] font-extrabold uppercase tracking-[0.16em] opacity-60">
                Total aura
              </dt>
              <dd className="font-display text-[clamp(1rem,3vw,1.875rem)] font-bold leading-none tabular-nums">
                {user.aura}
              </dd>
            </div>
            <div className="rounded-lg border-2 border-ink px-2 py-1 sm:py-2">
              <dt className="text-[clamp(0.4rem,1vw,0.65rem)] font-extrabold uppercase tracking-[0.16em] opacity-60">
                Quests cleared
              </dt>
              <dd className="font-display text-[clamp(1rem,3vw,1.875rem)] font-bold leading-none tabular-nums">
                {questsDone}
              </dd>
            </div>
          </dl>

          <p className="mx-auto hidden max-w-lg text-center text-[clamp(0.5rem,1.15vw,0.75rem)] font-medium leading-snug opacity-75 sm:block">
            For writing prompts with real context, a role, a clear action, a
            format and a tone — and for checking what the AI claims before
            believing it.
          </p>

          <div className="flex items-end justify-between gap-4 border-t-2 border-ink pt-2">
            <div>
              <p className="font-display text-[clamp(0.55rem,1.5vw,0.875rem)] font-bold">{date}</p>
              <p className="text-[clamp(0.38rem,0.9vw,0.625rem)] font-semibold uppercase tracking-[0.14em] opacity-55">
                date awarded
              </p>
            </div>
            <p className="text-right text-[clamp(0.38rem,0.9vw,0.625rem)] font-bold uppercase tracking-[0.14em] opacity-60">
              ProjectAI · verified {questsDone}/{progress.requiredCount}
              <br />ID PAI-{isExample ? "EXAMPLE" : String(user.id).padStart(5, "0")}
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
