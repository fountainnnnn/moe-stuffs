import Link from "next/link";
import { cookies } from "next/headers";
import { QUESTS } from "@/lib/quests";
import type { Quest, QuestCategory } from "@/lib/types";
import UiIcon from "@/components/UiIcon";
import { CERTIFICATE_QUEST_IDS, getCertificateProgress } from "@/lib/certificate";
import { getDb, getSessionUser } from "@/lib/db";

const TRACKS: {
  category: QuestCategory;
  name: string;
  shortName: string;
  blurb: string;
  color: string;
  icon: "prompting" | "knowledge";
}[] = [
  {
    category: "foundations",
    name: "AI Foundations",
    shortName: "Foundations",
    blurb: "Know what AI, machine learning, generative AI and agents actually do.",
    color: "var(--gold)",
    icon: "knowledge",
  },
  {
    category: "prompting",
    name: "Prompting Arena",
    shortName: "Prompting",
    blurb: "Give useful instructions, test the result and improve one decision at a time.",
    color: "var(--accent)",
    icon: "prompting",
  },
  {
    category: "agents",
    name: "Agent Academy",
    shortName: "Agents",
    blurb: "Plan tools, permissions, checkpoints, memory and safe recovery.",
    color: "var(--mint)",
    icon: "prompting",
  },
  {
    category: "truth",
    name: "Truth Lab",
    shortName: "Truth",
    blurb: "Check sources, data and synthetic media without trusting surface confidence.",
    color: "var(--sky)",
    icon: "knowledge",
  },
  {
    category: "responsibility",
    name: "Responsible AI",
    shortName: "Responsibility",
    blurb: "Protect privacy, fairness, ownership, human judgment and your own voice.",
    color: "var(--coral)",
    icon: "knowledge",
  },
];

export default async function QuestMapPage() {
  const jar = await cookies();
  const db = getDb();
  const user = getSessionUser(db, jar.get("pai_user")?.value);
  const certificate = user ? getCertificateProgress(db, user.id) : null;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] opacity-55">
            quest map
          </p>
          <h1 className="text-4xl font-black leading-none sm:text-5xl">
            Pick your grind.
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold opacity-70">
            Five tracks, 28 quests. Learn the idea, try it yourself, then use a hint only when you need one.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="card-sticker card-sticker-press px-4 py-2 text-sm font-extrabold"
        >
          <UiIcon name="leaderboard" size={20} className="mr-1.5" /> leaderboard
        </Link>
      </header>

      <section className="card-sticker mt-7 overflow-hidden" aria-labelledby="certificate-heading">
        <div className="grid items-center gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="stamp text-xs uppercase tracking-[0.14em]"
                style={{ background: certificate?.isEligible ? "var(--mint)" : "var(--sky)" }}
              >
                {certificate?.isEligible ? "earned ✓" : "final reward"}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider opacity-50">
                {certificate
                  ? `${certificate.completedCount} / ${certificate.requiredCount} quests cleared`
                  : "Complete every available quest"}
              </span>
            </div>
            <h2 id="certificate-heading" className="mt-2 text-xl font-black">
              Certificate of AI Literacy
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold opacity-70">
              {certificate?.isEligible
                ? "You cleared the full learning map. Your named certificate is ready to print or save as a PDF."
                : `Clear all ${CERTIFICATE_QUEST_IDS.length} available quests to unlock your named, printable certificate.`}
            </p>
            {certificate ? (
              <div
                className="mt-3 h-2.5 max-w-xl overflow-hidden rounded-full border-2 border-ink bg-card"
                role="progressbar"
                aria-label="Certificate progress"
                aria-valuemin={0}
                aria-valuemax={certificate.requiredCount}
                aria-valuenow={certificate.completedCount}
              >
                <div
                  className="h-full bg-[var(--accent)]"
                  style={{ width: `${(certificate.completedCount / certificate.requiredCount) * 100}%` }}
                />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href="/cert/example" className="btn-quiet text-sm">
              See example
            </Link>
            {certificate?.isEligible && user ? (
              <Link href={`/cert/${user.id}`} className="btn-loud text-sm">
                Open mine →
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <nav className="quest-track-nav mt-6" aria-label="Jump to a learning track">
        {TRACKS.map((track, index) => (
          <a key={track.category} href={`#${track.category}`}>
            <span style={{ background: track.color }}>{index + 1}</span>
            {track.shortName}
          </a>
        ))}
      </nav>

      {TRACKS.map((track, trackIndex) => {
        const quests = QUESTS.filter((q) => q.category === track.category);
        if (!quests.length) return null;
        return (
          <section key={track.category} id={track.category} className="quest-track mt-12 scroll-mt-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="stamp text-lg"
                style={{ background: track.color }}
              >
                <UiIcon name={track.icon} size={28} className="mr-1.5" /> {track.name}
              </span>
              <p className="text-sm font-semibold opacity-65">{track.blurb}</p>
              <span className="ml-auto text-xs font-extrabold uppercase tracking-wider opacity-45">
                Track {trackIndex + 1} · {quests.length} quests
              </span>
            </div>
            <ul className="-mx-3 -my-3 mt-2 grid gap-7 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
              {quests.map((q, i) => (
                <li key={q.id}>
                  <QuestCard quest={q} tilt={i % 2 === 0 ? "tilt-l" : "tilt-r"} accent={track.color} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}

function QuestCard({
  quest,
  tilt,
  accent,
}: {
  quest: Quest;
  tilt: string;
  accent: string;
}) {
  const meta =
    quest.rubric?.length
      ? `${quest.rubric?.length ?? 0} coaching checks`
      : `${quest.items?.length ?? 0} items`;

  if (quest.locked) {
    return (
      <div
        className={`card-sticker ${tilt} relative flex h-full flex-col p-4 opacity-70 grayscale`}
        aria-disabled="true"
      >
        <span className="stamp absolute -right-3 -top-3 rotate-[8deg] text-xs">
          <UiIcon name="lock" size={17} className="mr-1" /> LOCKED
        </span>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-55">
          {quest.subject ?? quest.id.toUpperCase()}
        </p>
        <h3 className="text-lg font-black leading-tight">{quest.title}</h3>
        <p className="mt-1 flex-1 text-sm font-semibold opacity-60">{quest.tagline}</p>
        <p className="mt-3 text-xs font-extrabold uppercase tracking-widest opacity-50">
          drops later
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/quests/${quest.id}`}
      className={`card-sticker card-sticker-press ${tilt} flex h-full flex-col p-4`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* the lesson, not a category — wraps to two lines without squashing the badge */}
        <p className="text-[11px] font-extrabold uppercase leading-snug tracking-[0.06em] opacity-55">
          {quest.subject ?? quest.id.toUpperCase()}
        </p>
        <span
          className="shrink-0 whitespace-nowrap rounded-full border-2 border-[var(--ink)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
          style={{ background: accent }}
        >
          {quest.rubric?.length ? "coached build" : "guided quiz"}
        </span>
      </div>
      <h3 className="mt-1 text-lg font-black leading-tight">{quest.title}</h3>
      <p className="mt-1 flex-1 text-sm font-semibold opacity-70">{quest.tagline}</p>
      <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-[var(--ink)]/25 pt-3">
        <span className="text-xs font-bold opacity-55">{meta}</span>
        <span className="text-sm font-black">play ▸</span>
      </div>
    </Link>
  );
}
