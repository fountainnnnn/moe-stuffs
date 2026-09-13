"use client";

import { useMemo } from "react";

const COLORS = ["var(--accent)", "var(--pop)", "var(--sky)", "var(--ink)"];

export default function Confetti({ count = 70 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 13) % 90) / 100,
        dur: 1.7 + ((i * 7) % 12) / 10,
        size: 7 + ((i * 5) % 9),
        rot: (i * 47) % 360,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [count],
  );

  return (
    <div className="cf-root" aria-hidden="true">
      <style>{`
        .cf-root { position:fixed; inset:0; overflow:hidden; pointer-events:none; z-index:60; }
        .cf-bit { position:absolute; top:-8%; border:2px solid var(--ink); animation-name: cf-fall; animation-timing-function: linear; animation-iteration-count: 1; animation-fill-mode: forwards; }
        @keyframes cf-fall {
          0% { transform: translateY(0) rotate(0deg); opacity:1; }
          100% { transform: translateY(115vh) rotate(720deg); opacity:0.9; }
        }
      `}</style>
      {bits.map((b, i) => (
        <span
          key={i}
          className="cf-bit"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 1.6,
            background: b.color,
            borderRadius: b.round ? "999px" : "2px",
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            rotate: `${b.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
