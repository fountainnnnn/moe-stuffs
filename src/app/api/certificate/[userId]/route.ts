import { NextResponse } from "next/server";
import { CERTIFICATE_QUEST_IDS, getCertificateProgress } from "@/lib/certificate";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { getDb, type AttemptRow, type UserRow } from "@/lib/db";
import type { Tier } from "@/lib/types";

export const runtime = "nodejs";

const TIER_RANK: Record<Tier, number> = { npc: 0, grinder: 1, farmer: 2 };

function isTier(value: string): value is Tier {
  return value === "npc" || value === "grinder" || value === "farmer";
}

function safeFilename(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "student";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const isExample = userId === "example";
  const id = Number(userId);
  const db = getDb();
  const storedUser = Number.isInteger(id) && id > 0
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

  if (!user) return NextResponse.json({ error: "certificate not found" }, { status: 404 });

  const progress = isExample
    ? {
        completedCount: CERTIFICATE_QUEST_IDS.length,
        requiredCount: CERTIFICATE_QUEST_IDS.length,
        isEligible: true,
        completedAt: "2026-09-13 00:00:00",
      }
    : getCertificateProgress(db, user.id);

  if (!progress.isEligible) {
    return NextResponse.json(
      {
        error: "certificate not earned",
        completedCount: progress.completedCount,
        requiredCount: progress.requiredCount,
      },
      { status: 403 },
    );
  }

  const attempts = isExample
    ? []
    : (db
        .prepare("SELECT * FROM attempts WHERE user_id = ? AND submitted = 1")
        .all(user.id) as AttemptRow[]);
  const best = attempts.reduce<Tier>((current, attempt) => {
    const tier = isTier(attempt.tier) ? attempt.tier : "npc";
    return TIER_RANK[tier] > TIER_RANK[current] ? tier : current;
  }, isExample ? "farmer" : "npc");
  const title =
    user.title ??
    (best === "farmer" ? "Aura Farmer" : best === "grinder" ? "Prompt Grinder" : "Certified NPC");
  const awardedDate = new Date(`${progress.completedAt!.replace(" ", "T")}Z`).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const certificateId = `PAI-${isExample ? "EXAMPLE" : String(user.id).padStart(5, "0")}`;
  const pdf = generateCertificatePdf({
    name: user.name,
    classCode: user.class_code,
    title,
    tier: best,
    aura: user.aura,
    questsDone: progress.completedCount,
    requiredQuests: progress.requiredCount,
    awardedDate,
    certificateId,
    example: isExample,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="projectai-certificate-${safeFilename(user.name)}.pdf"`,
      "Cache-Control": isExample ? "public, max-age=86400" : "private, no-store",
    },
  });
}
