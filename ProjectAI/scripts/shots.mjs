// One-off README screenshot capture. Run: node scripts/shots.mjs <baseUrl>
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:51501";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  userDataDir: `${process.env.TMPDIR ?? "/tmp"}/shots-profile-${Date.now()}`,
  args: ["--no-first-run", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const go = async (path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
};

// 1. landing (logged out)
await go("/");
await shot("landing");

// join as a student so the nav chip + pages have a user
await page.evaluate(async () => {
  await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "readme_demo", classCode: "3E4", role: "student" }),
  });
});

// 2. quest map
await go("/quests");
await shot("quest-map");

// 3. the money shot: chat quest with a real generated artifact
await go("/quests/p1");
await page.waitForSelector("textarea");
await page.click("textarea");
await page.type(
  "textarea",
  "You are a pitch-deck designer for school CCAs. Context: our Robotics Club (25 members, 2 national comp wins, meets Tue/Thu) has 90 seconds at Monday assembly to pitch 300 bored Sec 1s at 8am; recruitment closes Friday. Action: build the actual pitch deck. Format: exactly 5 slides, max 3 short bullets each, one visual suggestion per slide, final slide is a clear sign-up-by-Friday CTA. Tone: high energy, funny, Sec-1 friendly, school-safe.",
);
await page.keyboard.press("Enter");
// wait for the artifact bubble (slides viewer) then the coach bubble
await page.waitForFunction(
  () => document.body.innerText.includes("W prompt") || document.body.innerText.includes("MISSING"),
  { timeout: 45000 },
);
await new Promise((r) => setTimeout(r, 1200));
await shot("quest-chat");

// 4. leaderboard
await go("/leaderboard");
await new Promise((r) => setTimeout(r, 1000));
await shot("leaderboard");

// 5. teacher dashboard
await page.evaluate(async () => {
  await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ms Tan", classCode: "3E4", role: "teacher" }),
  });
});
await go("/teacher");
await new Promise((r) => setTimeout(r, 1000));
await shot("teacher");

await browser.close();
console.log("done");
