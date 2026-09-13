import Link from "next/link";
import { QUESTS } from "@/lib/quests";
import type { Quest } from "@/lib/types";
import UiIcon from "@/components/UiIcon";

const TRACKS = [
  {
    category: "prompting" as const,
    name: "Prompting Arena",
    blurb: "Write the prompt. A real model grades it. No vibes, only receipts.",
    color: "var(--accent)",
    icon: "prompting" as const,
  },
  {
    category: "knowledge" as const,
    name: "Knowledge Grind",
    blurb: "Spot the fake, call out the cap, decide what's actually okay.",
    color: "var(--sky)",
    icon: "knowledge" as const,
  },
];

export default function QuestMapPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] opacity-55">
            quest map
          </p>
          <h1 className="text-4xl font-black leading-none sm:text-5xl">
            Pick your grind.
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold opacity-70">
            Two tracks. Every clear = aura. Top 3 in class hold the Aura Farmer crown.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="card-sticker card-sticker-press px-4 py-2 text-sm font-extrabold"
        >
          <UiIcon name="leaderboard" size={20} className="mr-1.5" /> leaderboard
        </Link>
      </header>

      {TRACKS.map((track) => {
        const quests = QUESTS.filter((q) => q.category === track.category);
        if (!quests.length) return null;
        return (
          <section key={track.category} className="mt-12">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="stamp text-lg"
                style={{ background: track.color }}
              >
                <UiIcon name={track.icon} size={28} className="mr-1.5" /> {track.name}
              </span>
              <p className="text-sm font-semibold opacity-65">{track.blurb}</p>
            </div>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    quest.category === "prompting"
      ? `${quest.rubric?.length ?? 0} rubric checks`
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
          {quest.category === "prompting" ? "LLM judged" : "quiz"}
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
