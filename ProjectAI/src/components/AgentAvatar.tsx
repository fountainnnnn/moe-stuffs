"use client";

import { useEffect, useState } from "react";

export type AgentMood = "idle" | "thinking" | "disappointed" | "hyped";

const SIZES = { sm: 56, md: 92, lg: 140 } as const;

export default function AgentAvatar({
  mood = "idle",
  size = "md",
  className = "",
}: {
  mood?: AgentMood;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  // SVG renders first; upgrade to the PNG only once it actually loads.
  // (A bare <img onError> misses errors that fire before hydration.)
  const [imgOk, setImgOk] = useState(false);
  const px = SIZES[size];

  useEffect(() => {
    let alive = true;
    const probe = new Image();
    probe.onload = () => alive && setImgOk(true);
    probe.onerror = () => alive && setImgOk(false);
    probe.src = `/avatar/${mood}.png`;
    return () => {
      alive = false;
    };
  }, [mood]);

  return (
    <div
      className={`aa-wrap ${mood === "hyped" ? "aa-hype" : mood === "thinking" ? "aa-think" : "aa-bob"} ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      <style>{`
        .aa-wrap { display:inline-block; line-height:0; }
        .aa-wrap img, .aa-wrap svg { width:100%; height:100%; display:block; }
        @keyframes aa-bob { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-5px) rotate(1deg)} }
        @keyframes aa-think { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-2px) rotate(3deg)} }
        @keyframes aa-hype { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-10px) scale(1.06) rotate(-4deg)} 60%{transform:translateY(-3px) scale(1.02) rotate(4deg)} }
        .aa-bob { animation: aa-bob 2.6s ease-in-out infinite; }
        .aa-think { animation: aa-think 0.7s ease-in-out infinite; }
        .aa-hype { animation: aa-hype 0.8s ease-in-out infinite; }
      `}</style>
      {imgOk ? (
        <img
          src={`/avatar/${mood}.png`}
          alt=""
          onError={() => setImgOk(false)}
        />
      ) : (
        <AvatarSvg mood={mood} />
      )}
    </div>
  );
}

function AvatarSvg({ mood }: { mood: AgentMood }) {
  const bodyFill =
    mood === "disappointed" ? "var(--sky)" : mood === "hyped" ? "var(--accent)" : "var(--card)";

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* antenna */}
      <line x1="50" y1="14" x2="50" y2="26" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      <circle
        cx="50"
        cy="11"
        r="6"
        fill={mood === "thinking" ? "var(--pop)" : "var(--accent)"}
        stroke="var(--ink)"
        strokeWidth="3.5"
      />
      {/* blobby body */}
      <path
        d="M50 24c18 0 30 12 30 28 0 18-13 28-30 28S20 70 20 52c0-16 12-28 30-28z"
        fill={bodyFill}
        stroke="var(--ink)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {mood === "disappointed" ? (
        <>
          {/* half-lidded eyes */}
          <path d="M33 48h13" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <path d="M54 48h13" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          {/* flat frown */}
          <path d="M39 66q11 -8 22 0" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* sweat drop */}
          <path d="M76 38c3 5 5 7 5 9a5 5 0 0 1-10 0c0-2 2-4 5-9z" fill="var(--sky)" stroke="var(--ink)" strokeWidth="3" />
        </>
      ) : mood === "thinking" ? (
        <>
          {/* squinty eyes looking up */}
          <circle cx="40" cy="46" r="5" fill="var(--ink)" />
          <circle cx="62" cy="46" r="5" fill="var(--ink)" />
          <circle cx="41.5" cy="44" r="1.8" fill="var(--card)" />
          <circle cx="63.5" cy="44" r="1.8" fill="var(--card)" />
          {/* small o mouth */}
          <circle cx="50" cy="65" r="4.5" fill="none" stroke="var(--ink)" strokeWidth="4" />
        </>
      ) : mood === "hyped" ? (
        <>
          {/* star eyes */}
          <path
            d="M40 40l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z"
            fill="var(--ink)"
          />
          <path
            d="M62 40l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z"
            fill="var(--ink)"
          />
          {/* big open grin */}
          <path d="M36 62q14 16 28 0z" fill="var(--ink)" />
        </>
      ) : (
        <>
          {/* idle round eyes */}
          <circle cx="39" cy="48" r="6" fill="var(--ink)" />
          <circle cx="61" cy="48" r="6" fill="var(--ink)" />
          <circle cx="41" cy="46" r="2.1" fill="var(--card)" />
          <circle cx="63" cy="46" r="2.1" fill="var(--card)" />
          {/* small smile */}
          <path d="M41 64q9 7 18 0" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* cheeks */}
      <circle cx="28" cy="58" r="3.5" fill="var(--pop)" opacity="0.55" />
      <circle cx="72" cy="58" r="3.5" fill="var(--pop)" opacity="0.55" />
    </svg>
  );
}
