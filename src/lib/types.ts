// ProjectAI shared contract — ALL agents build against this. Do not change shapes without updating PLAN.md.

export type Tier = "npc" | "grinder" | "farmer";

export type QuestCategory =
  | "foundations"
  | "prompting"
  | "agents"
  | "truth"
  | "responsibility";

export interface Quest {
  id: string; // "p1" | "p2" | "p3" | "p4" | "k1" | "k2" | "k3"
  category: QuestCategory;
  title: string;
  subject?: string; // the actual AI-literacy subject being taught, shown on cards/headers
  tagline: string; // meme-y one-liner shown on the card
  task: string; // what the student must achieve
  locked?: boolean; // teaser tiles
  // prompting quests only:
  rubric?: string[]; // rubric element keys, e.g. ["context","role","action","format","tone"]
  artifact?: ArtifactKind; // what the agent actually produces for this quest
  mockOutputs?: Record<Tier, string>; // OFFLINE FALLBACK artifacts: JSON string of an Artifact, per tier
  // knowledge quests only:
  items?: KnowledgeItem[];
}

// ---- Artifacts: what the agent actually produces when the student's prompt runs ----

export type ArtifactKind = "slides" | "website" | "plan" | "research";

export interface SlidesArtifact {
  kind: "slides";
  title: string;
  slides: { heading: string; bullets: string[]; visual?: string }[];
}

export interface WebsiteArtifact {
  kind: "website";
  url: string;
  siteTitle: string;
  hero: { headline: string; sub: string; cta: string };
  sections: { heading: string; body: string }[];
  footer?: string;
}

export interface PlanArtifact {
  kind: "plan";
  title: string;
  goal: string;
  steps: { n: number; action: string; tool?: string }[];
  doneCriteria: string[];
}

export interface ResearchArtifact {
  kind: "research";
  topic: string;
  summary: string;
  facts: { text: string; source?: string }[];
  citations: string[];
}

export type Artifact = SlidesArtifact | WebsiteArtifact | PlanArtifact | ResearchArtifact;

export interface KnowledgeItem {
  id: string;
  prompt: string; // question / scenario text
  image?: string; // for k1, path under /public
  options: string[]; // e.g. ["Real", "Fake"] or ["Okay", "Not okay"]
  answerIndex: number;
  hint?: string; // optional thinking nudge shown before the learner commits
  explanation: string;
}

export interface JudgeVerdict {
  score: number; // 0-100
  tier: Tier;
  missing: string[]; // rubric element keys not satisfied
  advice: string; // one punchy coaching line, student voice
  fallback?: boolean; // true when rule-based scorer was used
}

export interface User {
  id: number;
  name: string;
  classCode: string;
  role: "student" | "teacher";
  aura: number;
  title: string | null; // "Aura Farmer" for top 3
}

export interface Attempt {
  id: number;
  userId: number;
  questId: string;
  prompt: string;
  score: number;
  tier: Tier;
  feedback: string;
  submitted: 0 | 1;
  createdAt: string;
}

// ---- API contract ----
// POST /api/join        body {name, classCode, role?} -> {user: User}  (sets cookie "pai_user")
// POST /api/judge       body {questId, prompt} -> JudgeVerdict         (does NOT award aura; records attempt submitted=0)
// POST /api/run         body {questId, prompt} -> {verdict, response, responseFallback, trapSprung}
//                       (judge + real LLM execution of the student's prompt, concurrently; records attempt submitted=0)
// POST /api/submit      body {questId, prompt} -> {verdict: JudgeVerdict, auraGained: number, newAura: number, firstTryBonus: boolean}
// POST /api/answer      body {questId, answers: number[]} -> {correct: number, total: number, auraGained: number, newAura: number, results: {correct: boolean, explanation: string}[]}
// GET  /api/leaderboard ?classCode= -> {users: User[]} (sorted desc by aura, titles applied to top 3)
// GET  /api/teacher     ?classCode= -> {students: (User & {questsDone: number, tiers: Record<string, Tier>})[], commonGaps: {element: string, count: number}[]}

export const AURA = { npc: 10, grinder: 25, farmer: 50, firstTryBonus: 10 } as const;
export const TIER_LABEL: Record<Tier, string> = {
  npc: "NPC 💀",
  grinder: "Grinder 😤",
  farmer: "Aura Farmer 👑",
};
