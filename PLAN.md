# ProjectAI — AI Literacy Quest Platform
**Edu2030 Vibe Hackathon · Challenge 3: Education that Prepares Students for an AI-Driven Future**

A gamified platform where students learn AI literacy by *doing*: writing real prompts that a real LLM judges, spotting deepfakes, calling out hallucinations — and farming aura on the class leaderboard.

**Hard constraint: ~2 hour build.** Tasks (quests) are the core feature. Everything else is allowed to be mocked, seeded, or faked convincingly.

---

## 1. Concept

- Students join a class, pick quests across two tracks:
  - **Knowledge track** (static content, no LLM risk): Deepfakes · Ethics · Hallucination
  - **Prompting track** (LLM-judged): Ideation/CRAFT · Secure App Spec · Build-an-Agent · Hallucination Trap
- Core mechanic: student writes a prompt → a task agent responds using the quest's context → a **real LLM silently judges the prompt** against a rubric → weak prompt = the agent avatar provides progressive coaching → student iterates → **Submit** locks in the attempt → aura points by tier.
- Aura → leaderboard → Top 3 hold the title **"Aura Farmer"**. Finishing a track earns a certificate. Teachers get a dashboard.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 15 (App Router) + TypeScript** | One process, API routes = backend, fastest to demo locally |
| DB | **SQLite via better-sqlite3** | Zero setup, survives restarts, file lives in `data/app.db` |
| Styling | Tailwind CSS v4 + custom design tokens | Speed without looking like Tailwind |
| Judge LLM | **OpenRouter** → `anthropic/claude-haiku-4.5` | Key provided; fast + cheap; fallback model `openai/gpt-4o-mini` |
| Auth | None. Name + class code, stored in a cookie | Hackathon theatre |
| Deploy | `npm run dev` on the demo laptop | SQLite ≠ serverless; local is safest on Wireless@SG |

**Secrets:** `OPENROUTER_API_KEY` lives in `.env.local` only (gitignored). Never in code or this file. *(Rotate the key after the event — it was shared in chat.)*

**Network failure plan:** every judge call has a 10s timeout → falls back to a rule-based scorer (keyword/structure checks per rubric) so the demo never stalls on stage.

## 3. Architecture

```
./
├── PLAN.md
├── .env.local              # OPENROUTER_API_KEY (gitignored)
├── data/app.db             # SQLite (gitignored), created+seeded on first run
├── src/
│   ├── lib/
│   │   ├── db.ts           # better-sqlite3 singleton, schema init, seed
│   │   ├── judge.ts        # OpenRouter call + rubric prompts + fallback scorer
│   │   ├── execute.ts      # runs the student's prompt with quest context → Markdown response
│   │   ├── quests.ts       # quest definitions + p4 planted-fake config (content in code, not DB)
│   │   └── aura.ts         # tiers, titles, point math
│   ├── app/
│   │   ├── page.tsx                    # landing / join (name + class code)
│   │   ├── quests/page.tsx             # quest map (two tracks, locked teasers ok)
│   │   ├── quests/[id]/page.tsx        # QUEST PLAYER — the star of the demo
│   │   ├── leaderboard/page.tsx        # aura leaderboard, Top-3 = Aura Farmer
│   │   ├── cert/[userId]/page.tsx      # printable certificate
│   │   ├── teacher/page.tsx            # teacher dashboard
│   │   └── api/
│   │       ├── join/route.ts           # POST name+class → user cookie
│   │       ├── judge/route.ts          # POST {questId, prompt} → score+feedback (LLM)
│   │       ├── run/route.ts            # POST {questId, prompt} → verdict + executed Artifact
│   │       │                           #   (what the chat window calls)
│   │       ├── submit/route.ts         # POST final attempt → aura awarded
│   │       ├── answer/route.ts         # POST knowledge-quest answers (static grading)
│   │       ├── leaderboard/route.ts    # GET
│   │       └── teacher/route.ts        # GET class overview
│   └── components/         # AgentAvatar, AgentResponseBubble, quest coaching, shell, etc.
```

### DB schema (minimal)
```sql
users(id, name, class_code, role 'student'|'teacher', aura INTEGER DEFAULT 0, title TEXT, created_at)
attempts(id, user_id, quest_id TEXT, prompt TEXT, score INTEGER, tier TEXT, feedback TEXT, submitted INTEGER, created_at)
-- quests are code, not rows. Seed: 1 teacher + ~8 fake students with plausible aura so the leaderboard looks alive.
```

## 4. The Judge + the Executor (core mechanic)

`POST /api/run` is what the chat window calls. It fires **two** OpenRouter calls concurrently (`Promise.all`) and records the attempt (`submitted=0`):

1. **The judge** (`lib/judge.ts`) — grades the *prompt* against the quest rubric. Never executes it.
2. **The task agent** (`lib/execute.ts`) — runs the student's prompt with the quest's scenario, learning goal, rubric, and output boundary, then returns a natural Markdown response. Website quests return a build brief and never generate or imitate a website.

```
POST /api/run {questId, prompt} → {verdict: JudgeVerdict, response: string, responseFallback: boolean, trapSprung: boolean}
```

**The pedagogy rule** (in the executor's system prompt, and the whole reason this works): the agent must produce output *strictly at the quality the prompt earns* — only details the prompt actually supplied, and a thin generic result when the prompt is vague. It must never rescue a lazy prompt with invented specifics. A one-line prompt visibly returns filler slides ("Introduction / Benefits / Sign Up Now"); a full-CRAFT prompt returns a deck you could present.

`POST /api/judge` still exists unchanged for other callers. `POST /api/submit` re-judges only — it does not re-execute.

**Offline fallback:** authored per-tier samples are converted into text-only responses when the model is unavailable. The chat labels the fallback clearly.

**Chat rendering:** `AgentResponseBubble` renders safe Markdown. The quest workspace fills the viewport; only the transcript and coach regions scroll. After repeated unsuccessful runs, Pixel shows one analogous example from a different scenario so students can borrow the structure without copying the answer.

### Judge verdict shape
Response is **strict JSON**:

```json
{ "score": 0-100, "tier": "npc|grinder|farmer", "missing": ["context","format"], "advice": "one punchy coaching line in student-friendly voice" }
```

- The judge knows the **CRAFT framework** (Context, Role, Action, Format, Tone) and each quest's rubric; it evaluates the *student's prompt*, never executes it.
- "Run" = judge + real execution + artifact bubble + avatar advice if tier < farmer. Unlimited runs. **Submit** = final; aura = f(score, attempts used).
- Fallback scorer (offline): checks rubric elements with heuristics (length, presence of role/format/constraints keywords, citation markers for the hallucination trap).

### Tiers & aura
| Tier | Score | Aura | Flavor |
|---|---|---|---|
| NPC | <50 | +10 | "bro just typed 'do it for me' 💀" |
| Grinder | 50–79 | +25 | solid, missing 1–2 CRAFT elements |
| Aura Farmer | 80+ | +50 | full CRAFT, would work IRL |
First-try bonus +10. Leaderboard Top 3 display the **Aura Farmer 👑** title.

## 5. Quests (v1 content)

### Prompting track (LLM-judged) — every quest is a concrete scenario with a real deliverable
Each quest gives a **scenario briefing** in the chat, then the agent *actually executes* the student's prompt and shows the artifact.

1. **P1 · Prompt Like You Mean It (CRAFT/ideation)** → artifact **slides**. Scenario: your CCA has 90 seconds at Monday assembly to pitch itself to ~300 Sec 1s; recruitment closes Friday. Task: prompt the agent to build the pitch deck. Rubric: all 5 CRAFT elements. *This is the demo quest — must ship.*
2. **P4 · The Hallucination Trap** → artifact **research brief**. Scenario: history homework — "when and how did Singapore start teaching computing/AI in schools?" The trap is deterministic: if the prompt never demands verification/sources, the executor plants **2 fake facts + 1 fabricated citation** (single source of truth: `PLANTED_FAKES` / `PLANTED_CITATION` in `lib/quests.ts`, which `FlaggedTakeover` reveals verbatim). Submit then springs the red **FLAGGED: you just shipped a hallucination** takeover. Demand verification and the agent returns hedged, source-tagged facts and no fakes. Rubric key `verification` must stay.
3. **P2 · Spec It, Don't Wing It** → artifact **website**. Scenario: class party sign-up site (names, what they're bringing, who's coming). Rubric: stack, data, access, scope — a vague prompt returns a bare-bones site that admits its own gaps.
4. **P3 · Agent Architect** → artifact **plan doc**. Scenario: an agent that runs your class Instagram for a week. Rubric: goal, steps, tools, done-criteria.

### Knowledge track (static, no LLM) — ship as many as time allows, else locked teaser tiles
- **K1 · Real or Fake?** — 6 images, guess deepfake vs real (static assets + explanations).
- **K2 · Okay or Not Okay?** — swipe/choose ethics scenarios (using AI for homework vs brainstorming, deepfaking a classmate, etc.).
- **K3 · Cap Detector** — spot the hallucinated sentence in an AI answer.

## 6. UI/UX direction — "meme-native game energy"

Anti-AI-slop rules (from impeccable / web-design-guidelines / ui-ux-pro-max):
- **No** purple-gradient-on-white SaaS look, no Inter-on-default-Tailwind, no emoji-as-design-system, no centered-hero-with-three-feature-cards.
- Direction: **playful arcade-classroom** — off-white paper/notebook ground, thick ink outlines, one loud accent (electric green or hot orange), chunky display font (e.g. Clash Display/Space Grotesk) + readable sans, sticker/stamp textures, tilted cards, real hover/press states, confetti on tier-up.
- Copy voice: SG-student meme energy but school-safe ("aura +50", "no cap detected", "W prompt"). Humanizer pass on all copy.
- **Agent avatar**: slot in `components/AgentAvatar.tsx` with a placeholder character (CSS/SVG blob with expressions: idle/thinking/disappointed/hyped). User will generate the real avatar art separately (Codex image-gen) → drop into `public/avatar/*.png`, component swaps automatically if files exist.
- Leaderboard = "classroom wall" vibe; certificate = print-styled page with stamp + title earned.

## 7. Teacher dashboard (mostly theatre)
- Class picker → table: student, quests done, aura, tier per quest.
- "Common gaps" panel: aggregated `missing` elements from attempts (real data, trivial GROUP BY) — this is the genuinely impressive bit for MOE judges: *teachers see exactly which CRAFT element the class is weak at*.

## 8. Build order (2h, orchestrated)

| # | Work | Owner |
|---|---|---|
| 0 | Scaffold Next.js, deps, tokens, .env, db.ts + seed | Orchestrator (now) |
| A | `lib/judge.ts` + `lib/quests.ts` + API routes (judge/submit/answer/join/leaderboard/teacher) + fallback scorer | Opus agent A (backend) |
| B | Quest player page + AgentAvatar + run/submit loop + quest map | Opus agent B (frontend core) |
| C | Landing, leaderboard, cert, teacher dashboard, design system polish | Opus agent C (frontend shell) |
| 4 | Integration, seed demo data, end-to-end test with real key, fix | Orchestrator |
| 5 | Stretch: K-track quests, confetti, sounds | Whoever's free |

**Cut lines if behind:** K-track → locked tiles · cert → static page · teacher → screenshot-grade with seed data. **Never cut:** P1 quest loop, avatar coaching, leaderboard.

## 9. Risks
- **Wireless@SG flakiness** → fallback scorer (§4) + hotspot.
- **Judge returns non-JSON** → strict JSON instruction + parse-retry once + fallback scorer.
- **Time** → cut lines above; demo script = join → P1 (bad prompt → avatar roast → fix → Aura Farmer tier) → leaderboard → teacher gaps panel.
