import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3157";
const output = "docs/screenshots/curriculum-qa";
mkdirSync(output, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  userDataDir: `${process.env.TMPDIR ?? "/tmp"}/projectai-curriculum-${Date.now()}`,
  args: ["--no-first-run", "--hide-scrollbars"],
});

const errors = [];
const page = await browser.newPage();
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`${base}/quests`, { waitUntil: "networkidle0" });
await page.screenshot({ path: `${output}/map-desktop.png` });
const firstTrack = await page.$("#foundations");
if (firstTrack) {
  const box = await firstTrack.boundingBox();
  if (box) {
    await page.screenshot({
      path: `${output}/map-foundations-close.png`,
      clip: {
        x: Math.max(0, box.x - 20),
        y: Math.max(0, box.y - 20),
        width: Math.min(1920, box.width + 40),
        height: Math.min(1080, box.height + 40),
      },
    });
  }
}
const desktopMetrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  tracks: document.querySelectorAll(".quest-track").length,
  cards: document.querySelectorAll(".quest-track li").length,
}));

for (const track of ["foundations", "prompting", "agents", "truth", "responsibility"]) {
  await page.goto(`${base}/quests#${track}`, { waitUntil: "networkidle0" });
  await page.$eval(`#${track}`, (element) => element.scrollIntoView({ block: "start" }));
  await new Promise((resolve) => setTimeout(resolve, 150));
  await page.screenshot({ path: `${output}/track-${track}-desktop.png` });
}

await page.goto(`${base}/quests/a2`, { waitUntil: "networkidle0" });
await page.screenshot({ path: `${output}/agent-coaching-desktop.png` });

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(`${base}/quests`, { waitUntil: "networkidle0" });
await page.screenshot({ path: `${output}/map-mobile.png` });
const mobileMetrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));

await page.goto(`${base}/quests/f1`, { waitUntil: "networkidle0" });
await page.screenshot({ path: `${output}/guided-quiz-mobile.png` });
await page.getByText?.("Need a nudge?");
const hintButton = await page.$("button[aria-expanded='false']");
if (hintButton) await hintButton.click();
await page.screenshot({ path: `${output}/guided-hint-mobile.png` });
const answerButtons = await page.$$("section button[aria-pressed]");
if (answerButtons[0]) await answerButtons[0].click();
const checkButton = await page.$("button.btn-loud");
if (checkButton) await checkButton.click();
await page.screenshot({ path: `${output}/guided-feedback-mobile.png` });
const quizMetrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  hintVisible: document.body.innerText.includes("Ask whether the program"),
  explanationVisible: document.body.innerText.includes("It does not learn from data"),
}));

await browser.close();
console.log(JSON.stringify({ errors, desktopMetrics, mobileMetrics, quizMetrics }, null, 2));
