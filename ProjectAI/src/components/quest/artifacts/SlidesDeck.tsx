"use client";

import { useState } from "react";
import type { SlidesArtifact } from "@/lib/types";

export default function SlidesDeck({ artifact }: { artifact: SlidesArtifact }) {
  const [i, setI] = useState(0);
  const total = artifact.slides.length;
  const slide = artifact.slides[Math.min(i, total - 1)];
  const go = (d: number) => setI((n) => Math.min(total - 1, Math.max(0, n + d)));

  return (
    <div className="p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-55">
        deck · {total} slide{total === 1 ? "" : "s"}
      </p>
      <p className="mt-0.5 text-[13px] font-black leading-tight">{artifact.title}</p>

      {/* 16:9 stage */}
      <div
        className="relative mt-2 w-full overflow-hidden rounded-[10px] border-2 border-[var(--ink)] bg-[var(--paper)]"
        // Cap the stage so a wide chat window doesn't turn 16:9 into a full-screen slide.
        style={{ aspectRatio: "16 / 9", maxWidth: "min(100%, 480px)", maxHeight: "27vh" }}
      >
        <div className="absolute inset-0 flex flex-col gap-1.5 overflow-y-auto p-2.5 sm:p-3">
          <h4 className="text-[13px] font-black leading-tight sm:text-[15px]">{slide.heading}</h4>
          {!!slide.bullets.length && (
            <ul className="space-y-1">
              {slide.bullets.map((b, k) => (
                <li key={k} className="flex gap-1.5 text-[11px] font-semibold leading-snug sm:text-[12px]">
                  <span className="shrink-0 font-black" style={{ color: "var(--accent-ink)" }}>
                    ▪
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {slide.visual && (
            <span
              className="mt-auto w-fit rounded-full border-2 border-dashed border-[var(--ink)] bg-[var(--card)] px-2 py-0.5 text-[10px] font-extrabold opacity-70"
              title="visual direction for this slide"
            >
              🖼 {slide.visual}
            </span>
          )}
        </div>
        <span className="absolute bottom-1.5 right-2 font-mono text-[10px] font-bold opacity-45">
          {i + 1}/{total}
        </span>
      </div>

      {/* controls */}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => go(-1)}
          disabled={i === 0}
          aria-label="previous slide"
          className="card-sticker card-sticker-press px-2.5 py-1 text-xs font-black disabled:opacity-30"
          style={{ boxShadow: "2px 2px 0 0 var(--ink)" }}
        >
          ←
        </button>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5">
          {artifact.slides.map((s, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`slide ${k + 1}: ${s.heading}`}
              aria-current={k === i}
              className="h-2.5 w-2.5 rounded-full border-2 border-[var(--ink)]"
              style={{ background: k === i ? "var(--accent)" : "var(--card)" }}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          disabled={i >= total - 1}
          aria-label="next slide"
          className="card-sticker card-sticker-press px-2.5 py-1 text-xs font-black disabled:opacity-30"
          style={{ boxShadow: "2px 2px 0 0 var(--ink)" }}
        >
          →
        </button>
      </div>
    </div>
  );
}
