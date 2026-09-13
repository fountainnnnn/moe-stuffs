import { AURA, TIER_LABEL } from "./types";
import type { Tier, User } from "./types";

export const TIER_ORDER: Record<Tier, number> = { npc: 0, grinder: 1, farmer: 2 };

export const AURA_FARMER_TITLE = "Aura Farmer";

export function auraFor(tier: Tier): number {
  return AURA[tier];
}

export function tierLabel(tier: Tier): string {
  return TIER_LABEL[tier];
}

/** True when `next` is a strictly better tier than `prev` (prev = null means nothing earned yet). */
export function isBetterTier(next: Tier, prev: Tier | null): boolean {
  if (!prev) return true;
  return TIER_ORDER[next] > TIER_ORDER[prev];
}

/**
 * Aura to award on submit.
 * - Nothing earned for this quest yet -> full tier value (+ first-try bonus if this is their very first attempt).
 * - Already earned a tier -> only the delta, and only if the new tier is better.
 */
export function auraDelta(newTier: Tier, bestTier: Tier | null, firstTry: boolean): { auraGained: number; firstTryBonus: boolean } {
  if (!bestTier) {
    const bonus = firstTry;
    return { auraGained: AURA[newTier] + (bonus ? AURA.firstTryBonus : 0), firstTryBonus: bonus };
  }
  if (TIER_ORDER[newTier] > TIER_ORDER[bestTier]) {
    return { auraGained: AURA[newTier] - AURA[bestTier], firstTryBonus: false };
  }
  return { auraGained: 0, firstTryBonus: false };
}

/**
 * Mark the top 3 by aura as "Aura Farmer". Input should be one class's students.
 * Returns a new sorted array (desc by aura); does not mutate the input.
 */
export function applyTitles(users: User[]): User[] {
  return [...users]
    .sort((a, b) => b.aura - a.aura || a.id - b.id)
    .map((u, i) => ({ ...u, title: i < 3 && u.aura > 0 ? AURA_FARMER_TITLE : null }));
}
