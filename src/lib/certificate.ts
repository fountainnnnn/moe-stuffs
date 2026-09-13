import type Database from "better-sqlite3";
import { QUESTS } from "./quests";

export const CERTIFICATE_QUEST_IDS = QUESTS.filter((quest) => !quest.locked).map(
  (quest) => quest.id,
);

export type CertificateProgress = {
  completedQuestIds: string[];
  completedCount: number;
  requiredCount: number;
  isEligible: boolean;
  completedAt: string | null;
};

export function getCertificateProgress(
  db: Database.Database,
  userId: number,
): CertificateProgress {
  const rows = db
    .prepare(
      `SELECT quest_id, MAX(created_at) AS completed_at
       FROM attempts
       WHERE user_id = ? AND submitted = 1
       GROUP BY quest_id`,
    )
    .all(userId) as { quest_id: string; completed_at: string }[];

  const requiredIds = new Set(CERTIFICATE_QUEST_IDS);
  const eligibleRows = rows.filter((row) => requiredIds.has(row.quest_id));
  const completedQuestIds = eligibleRows.map((row) => row.quest_id);
  const isEligible = completedQuestIds.length === CERTIFICATE_QUEST_IDS.length;
  const completedAt = isEligible
    ? eligibleRows.reduce(
        (latest, row) => (row.completed_at > latest ? row.completed_at : latest),
        "",
      )
    : null;

  return {
    completedQuestIds,
    completedCount: completedQuestIds.length,
    requiredCount: CERTIFICATE_QUEST_IDS.length,
    isEligible,
    completedAt,
  };
}
