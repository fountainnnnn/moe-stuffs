import { TIER_LABEL, type Tier } from "@/lib/types";

const BG: Record<Tier, string> = {
  npc: "var(--paper-line)",
  grinder: "var(--sky)",
  farmer: "var(--accent)",
};

export default function TierChip({
  tier,
  label,
  compact = false,
}: {
  tier: Tier;
  label?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-ink font-bold whitespace-nowrap ${
        compact ? "px-2 py-[1px] text-[11px]" : "px-2.5 py-0.5 text-xs"
      }`}
      style={{ background: BG[tier] }}
    >
      {label ?? TIER_LABEL[tier]}
    </span>
  );
}
