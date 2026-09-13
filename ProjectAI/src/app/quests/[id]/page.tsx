import { notFound } from "next/navigation";
import Link from "next/link";
import { QUESTS } from "@/lib/quests";
import PromptingQuest from "@/components/quest/PromptingQuest";
import KnowledgeQuest from "@/components/quest/KnowledgeQuest";
import UiIcon from "@/components/UiIcon";

export default async function QuestPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quest = QUESTS.find((q) => q.id === id);
  if (!quest) notFound();

  if (quest.locked) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <span className="stamp text-lg"><UiIcon name="lock" size={22} className="mr-1" /> LOCKED</span>
        <h1 className="mt-4 text-2xl font-black">{quest.title}</h1>
        <p className="mt-2 text-sm font-semibold opacity-70">
          Not open yet. Farm some aura on the live quests first.
        </p>
        <Link href="/quests" className="btn-loud card-sticker-press mt-6 inline-block">
          ← quest map
        </Link>
      </main>
    );
  }

  return (
    <main>
      {quest.items?.length ? (
        <KnowledgeQuest quest={quest} />
      ) : (
        <PromptingQuest quest={quest} />
      )}
    </main>
  );
}
