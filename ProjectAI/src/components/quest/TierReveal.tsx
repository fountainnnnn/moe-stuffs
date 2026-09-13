"use client";

import Link from "next/link";
import { TIER_LABEL, type Tier } from "@/lib/types";
import AgentAvatar from "@/components/AgentAvatar";
import Confetti from "./Confetti";
import UiIcon from "@/components/UiIcon";

const FLAVOR: Record<Tier, string> = {
  npc: "bro really typed that and hit send 💀 run it back",
  grinder: "solid grind. one or two CRAFT bits short of legendary 😤",
  farmer: "W prompt. no cap, that would work IRL 👑",
};

export default function TierReveal({
  tier,
  auraGained,
  newAura,
  firstTryBonus,
  advice,
  retryLabel = "↺ Try another prompt",
  onRetry,
}: {
  tier: Tier;
  auraGained: number;
  newAura: number;
  firstTryBonus?: boolean;
  advice?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="tr-root">
      <style>{`
        .tr-root { position:fixed; inset:0; z-index:50; display:grid; place-items:center; padding:1.25rem;
          background: color-mix(in srgb, var(--ink) 55%, transparent); animation: tr-fade 220ms ease-out both; }
        @keyframes tr-fade { from{opacity:0} to{opacity:1} }
        .tr-panel { position:relative; width:100%; max-width:560px; text-align:center; padding:2rem 1.5rem 1.5rem;
          animation: tr-pop 420ms cubic-bezier(.2,1.6,.4,1) both; }
        @keyframes tr-pop { from{transform:scale(.7) rotate(-6deg); opacity:0} to{transform:scale(1) rotate(0); opacity:1} }
        .tr-stamp { display:inline-block; border:5px solid var(--ink); border-radius:14px; padding:.4rem 1.2rem;
          font-size:clamp(1.6rem,7vw,2.6rem); font-weight:900; letter-spacing:-.02em; background:var(--accent);
          animation: tr-slam 520ms cubic-bezier(.2,1.8,.3,1) both; }
        @keyframes tr-slam {
          0% { transform: scale(2.6) rotate(-18deg); opacity:0; }
          60% { transform: scale(1) rotate(-5deg); opacity:1; }
          75% { transform: scale(1.06) rotate(-2deg); }
          100% { transform: scale(1) rotate(-4deg); }
        }
        .tr-aura { font-size:clamp(1.4rem,5vw,2rem); font-weight:900; color:var(--accent-ink);
          animation: tr-float 1.5s ease-out .35s both; }
        @keyframes tr-float {
          0% { transform: translateY(24px); opacity:0; }
          25% { transform: translateY(0); opacity:1; }
          100% { transform: translateY(-10px); opacity:1; }
        }
      `}</style>
      {tier === "farmer" && <Confetti />}
      <div className="tr-panel card-sticker">
        <div className="flex justify-center">
          <AgentAvatar mood={tier === "npc" ? "disappointed" : "hyped"} size="lg" />
        </div>
        <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.2em] opacity-60">
          final verdict
        </p>
        <div className="mt-2">
          <span className="tr-stamp">{TIER_LABEL[tier]}</span>
        </div>
        <p className="mx-auto mt-4 max-w-sm text-base font-semibold">{FLAVOR[tier]}</p>
        {advice && (
          <p className="mx-auto mt-2 max-w-sm text-sm opacity-70">&ldquo;{advice}&rdquo;</p>
        )}
        <p className="tr-aura mt-4">+{auraGained} AURA</p>
        <p className="text-sm font-bold opacity-70">
          total aura: {newAura}
          {firstTryBonus ? " · first-try bonus 🔥" : ""}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/leaderboard" className="btn-loud card-sticker-press inline-block">
            <UiIcon name="leaderboard" size={20} className="mr-1.5" /> See the leaderboard
          </Link>
          <Link
            href="/quests"
            className="card-sticker card-sticker-press inline-block px-4 py-2 text-sm font-extrabold"
          >
            <UiIcon name="quest-map" size={20} className="mr-1.5" /> Quest map
          </Link>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-bold underline decoration-2 underline-offset-4 opacity-70"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
