import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import TierChip from "@/components/shell/TierChip";
import UiIcon from "@/components/UiIcon";
import { TIER_ORDER, applyTitles } from "@/lib/aura";
import { getCertificateProgress } from "@/lib/certificate";
import { getDb, getSessionUser, type AttemptRow, type UserRow } from "@/lib/db";
import { QUESTS } from "@/lib/quests";
import type { Tier, User } from "@/lib/types";

export const metadata: Metadata = {
  title: "My profile · ProjectAI",
  description: "Your ProjectAI progress, aura, quest history and certificate.",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function isTier(value: string): value is Tier {
  return value === "npc" || value === "grinder" || value === "farmer";
}

function displayDate(value: string): string {
  return DATE_FORMAT.format(new Date(`${value.replace(" ", "T")}Z`));
}

export default async function ProfilePage() {
  const jar = await cookies();
  const db = getDb();
  const user = getSessionUser(db, jar.get("pai_user")?.value);
  if (!user) redirect("/");

  const progress = getCertificateProgress(db, user.id);
  const attempts = db
    .prepare(
      "SELECT * FROM attempts WHERE user_id = ? AND submitted = 1 ORDER BY created_at DESC, id DESC",
    )
    .all(user.id) as AttemptRow[];

  const bestByQuest = new Map<string, AttemptRow>();
  for (const attempt of attempts) {
    const current = bestByQuest.get(attempt.quest_id);
    const attemptTier = isTier(attempt.tier) ? attempt.tier : "npc";
    const currentTier = current && isTier(current.tier) ? current.tier : "npc";
    if (
      !current ||
      TIER_ORDER[attemptTier] > TIER_ORDER[currentTier] ||
      (TIER_ORDER[attemptTier] === TIER_ORDER[currentTier] && attempt.score > current.score)
    ) {
      bestByQuest.set(attempt.quest_id, attempt);
    }
  }

  const tierCounts: Record<Tier, number> = { npc: 0, grinder: 0, farmer: 0 };
  for (const attempt of bestByQuest.values()) {
    tierCounts[isTier(attempt.tier) ? attempt.tier : "npc"] += 1;
  }

  const nextQuest = QUESTS.find(
    (quest) => !quest.locked && !progress.completedQuestIds.includes(quest.id),
  );
  const classRows = db
    .prepare("SELECT * FROM users WHERE class_code = ? AND role = 'student'")
    .all(user.class_code) as UserRow[];
  const ranked = applyTitles(
    classRows.map(
      (row): User => ({
        id: row.id,
        name: row.name,
        classCode: row.class_code,
        role: row.role,
        aura: row.aura,
        title: row.title,
      }),
    ),
  );
  const rankIndex = ranked.findIndex((student) => student.id === user.id);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;
  const displayTitle = rankIndex >= 0 ? ranked[rankIndex].title : user.title;
  const completionPercent = Math.round(
    (progress.completedCount / progress.requiredCount) * 100,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b-[2.5px] border-ink pb-7">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-[var(--accent)] font-display text-3xl font-bold"
            style={{ boxShadow: "3px 3px 0 0 var(--ink)" }}
            aria-hidden
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] opacity-55">
              student profile
            </p>
            <h1 className="break-words font-display text-3xl font-bold leading-tight sm:text-4xl">
              {user.name}
            </h1>
            <p className="mt-1 text-sm font-semibold opacity-65">
              Class {user.class_code}
              {rank ? ` · #${rank} of ${ranked.length} on the aura board` : ""}
            </p>
          </div>
        </div>
        {displayTitle ? (
          <span className="stamp text-sm" style={{ background: "var(--accent)" }}>
            {displayTitle} <UiIcon name="crown" size={19} className="ml-1" />
          </span>
        ) : null}
      </div>

      <section className="grid gap-6 py-8 md:grid-cols-[1.35fr_0.65fr]" aria-labelledby="progress-heading">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] opacity-55">
            your progress
          </p>
          <h2 id="progress-heading" className="mt-1 font-display text-2xl font-bold">
            {progress.isEligible ? "Full map cleared." : `${progress.requiredCount - progress.completedCount} quests left.`}
          </h2>
          <div
            className="mt-4 h-5 overflow-hidden rounded-full border-[2.5px] border-ink bg-card"
            role="progressbar"
            aria-label="Quest completion"
            aria-valuemin={0}
            aria-valuemax={progress.requiredCount}
            aria-valuenow={progress.completedCount}
          >
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold">
            <span>{progress.completedCount} of {progress.requiredCount} complete</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {nextQuest ? (
              <Link href={`/quests/${nextQuest.id}`} className="btn-loud text-sm">
                Continue: {nextQuest.title} →
              </Link>
            ) : (
              <Link href="/quests" className="btn-quiet text-sm">
                Revisit quest map
              </Link>
            )}
            <Link href="/leaderboard" className="btn-quiet text-sm">
              View aura board
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-t-[2.5px] border-ink pt-5 md:border-l-[2.5px] md:border-t-0 md:pl-6 md:pt-0">
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wider opacity-55">Aura</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{user.aura}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wider opacity-55">Rank</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{rank ? `#${rank}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wider opacity-55">Top-tier clears</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{tierCounts.farmer}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wider opacity-55">Attempts</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{attempts.length}</dd>
          </div>
        </dl>
      </section>

      <section
        className="card-sticker overflow-hidden"
        aria-labelledby="certificate-profile-heading"
      >
        <div className="grid items-center gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
          <div>
            <span
              className="stamp text-xs uppercase tracking-[0.14em]"
              style={{ background: progress.isEligible ? "var(--mint)" : "var(--sky)" }}
            >
              {progress.isEligible ? "earned ✓" : "locked"}
            </span>
            <h2 id="certificate-profile-heading" className="mt-3 font-display text-2xl font-bold">
              Certificate of AI Literacy
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed opacity-70">
              {progress.isEligible
                ? `Awarded ${displayDate(progress.completedAt!)} after completing every available ProjectAI quest.`
                : `Complete ${progress.requiredCount - progress.completedCount} more quests to generate your named, printable certificate.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href="/cert/example" className="btn-quiet text-sm">
              See example
            </Link>
            {progress.isEligible ? (
              <>
                <a href={`/api/certificate/${user.id}`} download className="btn-loud text-sm">
                  Download PDF ↓
                </a>
                <Link href={`/cert/${user.id}`} className="btn-quiet text-sm">
                  Preview
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-9" aria-labelledby="recent-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] opacity-55">activity</p>
            <h2 id="recent-heading" className="mt-1 font-display text-2xl font-bold">Recent quest results</h2>
          </div>
          <p className="text-xs font-bold opacity-50">
            Best clears: {tierCounts.farmer} farmer · {tierCounts.grinder} grinder · {tierCounts.npc} NPC
          </p>
        </div>

        {attempts.length ? (
          <ol className="mt-4 divide-y-2 divide-[color-mix(in_srgb,var(--ink)_14%,transparent)] border-y-[2.5px] border-ink">
            {attempts.slice(0, 5).map((attempt) => {
              const quest = QUESTS.find((item) => item.id === attempt.quest_id);
              const tier = isTier(attempt.tier) ? attempt.tier : "npc";
              return (
                <li key={attempt.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-9 shrink-0 text-xs font-extrabold uppercase tracking-wider opacity-45">
                    {attempt.quest_id}
                  </span>
                  <Link href={`/quests/${attempt.quest_id}`} className="min-w-0 flex-1 font-bold underline decoration-2 decoration-transparent hover:decoration-[var(--accent-ink)]">
                    {quest?.title ?? "Quest"}
                  </Link>
                  <span className="text-xs font-semibold opacity-50">{displayDate(attempt.created_at)}</span>
                  <TierChip tier={tier} label={`${attempt.score}% · ${tier}`} compact />
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-4 border-y-[2.5px] border-ink py-6">
            <p className="font-bold">No quest results yet.</p>
            <p className="mt-1 text-sm font-semibold opacity-65">Your latest scores will show up here after your first completed quest.</p>
            <Link href="/quests" className="btn-loud mt-4 inline-block text-sm">Choose a quest →</Link>
          </div>
        )}
      </section>
    </main>
  );
}
