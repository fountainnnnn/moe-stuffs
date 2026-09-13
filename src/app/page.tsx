"use client";

import { useState } from "react";
import UiIcon from "@/components/UiIcon";

type Role = "student" | "teacher";

export default function Landing() {
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("3E4");
  const [role, setRole] = useState<Role>("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Need a name first lah.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          classCode: classCode.trim().toUpperCase() || "3E4",
          role,
        }),
      });
      if (!res.ok) throw new Error("join failed");
      window.location.assign(role === "teacher" ? "/teacher" : "/quests");
    } catch {
      setError("Couldn't get you in. Try again?");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-16">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        {/* ---- hero: hand-placed sticker collage ---- */}
        <section className="relative">
          <span className="stamp text-xs uppercase tracking-[0.18em]">
            Edu2030 · Challenge 3
          </span>

          <h1 className="font-display mt-5 text-[clamp(2.6rem,8vw,5.2rem)] leading-[0.92] font-bold">
            <span className="block">Learn AI.</span>
            <span className="relative inline-block">
              <span
                className="absolute inset-x-[-6px] bottom-[0.12em] -z-10 h-[0.42em] -rotate-1"
                style={{ background: "var(--accent)" }}
                aria-hidden
              />
              Farm Aura.
            </span>
            <UiIcon name="crown" size={58} className="ml-2 rotate-6" />
          </h1>

          <p className="mt-6 max-w-lg text-lg font-medium leading-snug">
            Real prompts. A real AI marking them. Your class watching the
            leaderboard. Write a lazy prompt and the agent will let you know —
            loudly.
          </p>

          {/* scattered stickers, deliberately uneven */}
          <div className="mt-8 flex flex-wrap items-end gap-3">
            <span
              className="stamp text-sm"
              style={{ background: "var(--accent)", rotate: "-4deg" }}
            >
              aura +50
            </span>
            <span
              className="stamp text-sm"
              style={{ background: "var(--sky)", rotate: "2.5deg" }}
            >
              no cap detected
            </span>
            <span
              className="stamp text-sm"
              style={{ background: "var(--pop)", color: "#fff", rotate: "-1.5deg" }}
            >
              FLAGGED: hallucination 💀
            </span>
            <span className="stamp text-sm" style={{ rotate: "5deg" }}>
              W prompt
            </span>
          </div>

          {/* the aura ledger — a stamped table, not feature cards */}
          <div className="card-sticker tilt-l mt-10 max-w-lg overflow-hidden">
            <div className="border-b-[2.5px] border-ink px-4 py-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em]">
                How aura works
              </h2>
            </div>
            <ul className="divide-y-2 divide-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
              {[
                ["NPC 💀", "score < 50", "+10", "bro just typed “do it for me”"],
                ["Grinder 😤", "50 – 79", "+25", "close, missing a CRAFT piece or two"],
                ["Aura Farmer 👑", "80+", "+50", "full CRAFT, would actually work IRL"],
              ].map(([tier, band, aura, flavor]) => (
                <li key={tier} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-[9.5rem] shrink-0 font-bold">{tier}</span>
                  <span className="hidden w-20 shrink-0 text-xs font-semibold opacity-60 sm:block">
                    {band}
                  </span>
                  <span className="flex-1 text-xs font-medium opacity-75">
                    {flavor}
                  </span>
                  <span
                    className="shrink-0 rounded-full border-2 border-ink px-2 py-[1px] text-xs font-extrabold"
                    style={{ background: "var(--accent)" }}
                  >
                    {aura}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- join card ---- */}
        <section className="lg:pt-14">
          <form
            onSubmit={join}
            className="card-sticker tilt-r relative p-5 sm:p-6"
          >
            <span
              className="stamp absolute -top-4 right-4 text-xs uppercase tracking-widest"
              style={{ background: "var(--accent)" }}
            >
              start here
            </span>
            <h2 className="font-display text-2xl font-bold">Get in the class</h2>
            <p className="mt-1 text-sm font-medium opacity-70">
              No password. No email. Just a name your teacher can read.
            </p>

            <label className="mt-5 block text-xs font-extrabold uppercase tracking-[0.14em]">
              Your name / handle
              <input
                className="field mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. kaya_toast_enjoyer"
                maxLength={32}
                autoFocus
              />
            </label>

            <label className="mt-4 block text-xs font-extrabold uppercase tracking-[0.14em]">
              Class code
              <input
                className="field mt-1.5 font-display tracking-widest"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="3E4"
                maxLength={8}
              />
            </label>

            <fieldset className="mt-4">
              <legend className="text-xs font-extrabold uppercase tracking-[0.14em]">
                I am a
              </legend>
              <div className="mt-1.5 inline-flex overflow-hidden rounded-full border-[2.5px] border-ink">
                {(["student", "teacher"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    className="px-4 py-1.5 text-sm font-extrabold capitalize transition-colors"
                    style={{
                      background: role === r ? "var(--ink)" : "var(--card)",
                      color: role === r ? "var(--paper)" : "var(--ink)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </fieldset>

            {error ? (
              <p
                className="mt-4 rounded-lg border-2 border-ink px-3 py-2 text-sm font-bold"
                style={{ background: "var(--pop)", color: "#fff" }}
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-loud mt-5 w-full" disabled={busy}>
              {busy ? "letting you in…" : role === "teacher" ? "Open my class →" : "Start farming →"}
            </button>

            <p className="mt-3 text-[11px] font-medium opacity-55">
              Demo build. Your progress is saved securely for this session.
            </p>
          </form>

          <p className="mt-6 max-w-xs pl-2 text-sm font-semibold leading-snug opacity-70">
            Teachers: the same code opens a dashboard showing exactly which part
            of CRAFT your class keeps fumbling.
          </p>
        </section>
      </div>
    </main>
  );
}
