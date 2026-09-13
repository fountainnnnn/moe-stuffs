import type { Artifact, Quest } from "./types";

/** Offline fallback artifacts are stored as JSON strings in `quest.mockOutputs`. */
const pack = (a: Artifact): string => JSON.stringify(a);

/**
 * P4's trap. The executor is told to plant these two false claims verbatim when the
 * student's prompt never demands verification — and FlaggedTakeover reveals the same two.
 * Single source of truth: change them here only.
 */
export const PLANTED_FAKES = [
  "MOE made “Computing Literacy” a compulsory O-Level subject for every secondary student from 2017.",
  "The National AI Curriculum Act of 2019 required every primary school to teach at least 10 hours of AI per year.",
] as const;

export const PLANTED_CITATION =
  "Tan, R. & Lim, W. (2021). Computing Education Rollout in Singapore Schools. Asian Journal of Educational Technology, 12(4), 88–104.";

/** Why each planted claim is false — shown in the FlaggedTakeover reveal. */
export const PLANTED_FAKE_REVEALS = [
  `“${PLANTED_FAKES[0]}” — false. O-Level Computing is an elective offered by some schools, never compulsory.`,
  `“${PLANTED_FAKES[1]}” — false. No such Act exists. The agent invented a law, a year and an hour count.`,
  `“${PLANTED_CITATION}” — false. That journal, that volume and that paper were all fabricated to make the answer look sourced.`,
];

export const QUESTS: Quest[] = [
  // ---------------- PROMPTING TRACK ----------------
  {
    id: "p1",
    subject: "Writing Prompts",
    category: "prompting",
    title: "The 90-Second Pitch",
    tagline: "300 bored Sec 1s, one deck. Make them sign up.",
    artifact: "slides",
    task:
      "SCENARIO: Your CCA got 90 seconds at Monday assembly to pitch itself to the whole Sec 1 cohort — about 300 of them, bored, 8am, hall projector. Recruitment closes Friday.\n\nYOUR TASK: Write ONE prompt that makes the agent build the actual pitch deck. It will run your prompt and show you the slides it produces — so if you leave something out, you'll see exactly what it guesses. Hit all five CRAFT parts: Context (which CCA, who's watching, how long, what you need them to do), Role (who the agent is acting as), Action (the exact deliverable), Format (how many slides, how much text per slide), Tone (how it should sound to a Sec 1).",
    rubric: ["context", "role", "action", "format", "tone"],
    mockOutputs: {
      npc: pack({
        kind: "slides",
        title: "CCA Pitch Deck",
        slides: [
          {
            heading: "Introduction",
            bullets: ["Welcome", "About our CCA", "Why you should join"],
            visual: "generic stock photo of students",
          },
          {
            heading: "What We Do",
            bullets: ["Activities", "Events", "Learning opportunities"],
          },
          {
            heading: "Benefits",
            bullets: ["Make new friends", "Develop skills", "Have fun"],
          },
          {
            heading: "Join Us!",
            bullets: ["Sign up today", "Contact us for more information"],
            visual: "placeholder QR code",
          },
        ],
      }),
      grinder: pack({
        kind: "slides",
        title: "Join Our CCA — Assembly Pitch",
        slides: [
          {
            heading: "90 seconds. One question.",
            bullets: ["What are you doing every Wednesday for the next four years?"],
            visual: "big text on plain background",
          },
          {
            heading: "Here's what we actually do",
            bullets: [
              "Weekly sessions after school",
              "One inter-school competition a year",
              "Members run their own projects",
            ],
          },
          {
            heading: "Last year",
            bullets: ["We competed", "We placed", "Nobody quit"],
            visual: "photo from last year's competition",
          },
          {
            heading: "Sign up",
            bullets: ["Trials are open this week", "Find us at the noticeboard"],
          },
        ],
      }),
      farmer: pack({
        kind: "slides",
        title: "Robotics Club — 90-Second Sec 1 Pitch (5 slides)",
        slides: [
          {
            heading: "We built a robot that folds laundry. Badly.",
            bullets: ["And that was the best 6 weeks of last year."],
            visual: "video still: the laundry robot dropping a sock",
          },
          {
            heading: "Wednesdays, 3.30 to 5.30, Lab 4",
            bullets: [
              "Build with real parts, not kits from a box",
              "No experience needed — half of us couldn't solder in January",
            ],
            visual: "wide shot of the lab mid-build, mess included",
          },
          {
            heading: "Two things you'd do by Term 3",
            bullets: [
              "Drive a robot you wired yourself at the National Championship",
              "Teach the next batch of Sec 1s the thing you just learned",
            ],
            visual: "side-by-side: competition floor / member teaching",
          },
          {
            heading: "The honest part",
            bullets: [
              "It's 2 hours a week plus competition season crunch",
              "Things break the night before. That's the job.",
            ],
          },
          {
            heading: "Trials Thursday. Lab 4. Just turn up.",
            bullets: ["Or scan this and we'll chase you instead."],
            visual: "full-bleed QR to the sign-up form + club handle",
          },
        ],
      }),
    },
  },
  {
    id: "p2",
    subject: "Specifying Apps",
    category: "prompting",
    title: "Ship the Party Site",
    tagline: "\"Build me a website\" gets you a broken website. Spec it.",
    artifact: "website",
    task:
      "SCENARIO: Your class is throwing an end-of-year party and the planning is chaos in the group chat. You need a sign-up website: people put their name down, say what food they're bringing, and everyone can see who's coming.\n\nYOUR TASK: Write the prompt that gets an agent to build the right thing — it will run your prompt and show you the site it produces. A usable spec names the stack (what it's built with, where it runs), the data (what gets stored per sign-up and per party), and access (who can create the party, who can sign up, can someone sign up twice, who sees the list). Say how people are identified or logged in and you're farming bonus aura.",
    rubric: ["stack", "data", "access", "scope"],
    mockOutputs: {
      npc: pack({
        kind: "website",
        url: "https://party-app.example.com",
        siteTitle: "Party App",
        hero: {
          headline: "Welcome to Party App",
          sub: "The best way to organise your event. Sign up now to get started!",
          cta: "Get Started",
        },
        sections: [
          { heading: "Features", body: "Everything you need to plan your party in one place." },
          { heading: "About", body: "We help you organise events easily and efficiently." },
        ],
        footer: "© 2026 Party App. All rights reserved.",
      }),
      grinder: pack({
        kind: "website",
        url: "http://localhost:3000/party",
        siteTitle: "Class Party Sign-Up",
        hero: {
          headline: "Class Party Sign-Up",
          sub: "Put your name down and tell us what you're bringing.",
          cta: "Add my name",
        },
        sections: [
          {
            heading: "Who's coming",
            body: "A live list of names as people sign up. 14 so far.",
          },
          {
            heading: "What's on the table",
            body: "Each sign-up can add one food or drink item, shown next to the name.",
          },
          {
            heading: "Built with",
            body: "Next.js with a SQLite file. Runs on one laptop. No accounts — anyone with the link can add a name, edit any row, or delete the list, because you didn't say who's allowed to do what.",
          },
        ],
        footer: "No login. No duplicate check. Don't share the link outside the class.",
      }),
      farmer: pack({
        kind: "website",
        url: "http://localhost:3000/party/3e2-year-end",
        siteTitle: "3E2 Year-End Party · Sign-Up",
        hero: {
          headline: "3E2 Year-End Party",
          sub: "Fri 28 Nov, 5–8pm, Multi-Purpose Hall. 32 in the class, 21 signed up, 11 to go.",
          cta: "Sign up with my class code",
        },
        sections: [
          {
            heading: "Sign-up form",
            body: "Name (from your class list, picked not typed) · what you're bringing (one item, dropdown: main / snack / drink / dessert) · dietary note, optional. One sign-up per person, enforced by the database.",
          },
          {
            heading: "Who's coming (21)",
            body: "Live list, refreshes every 5 seconds: name + item + category chip. Visible to everyone in class 3E2 only.",
          },
          {
            heading: "Food balance",
            body: "Counter per category so we don't end up with 19 packets of chips and no drinks: mains 4, snacks 9, drinks 5, desserts 3.",
          },
          {
            heading: "Stack & data",
            body: "Next.js 15 App Router + TypeScript, SQLite file on the class laptop, no external services. Tables: parties(id, title, datetime, venue, class_code, created_by, closes_at) · signups(id, party_id, student_id, item, category, dietary_note, created_at) with UNIQUE(party_id, student_id).",
          },
          {
            heading: "Access rules",
            body: "Class rep (class code + passphrase) creates and closes the party and can delete a row. Student (name picked from the class list, signed session cookie) signs up once and edits only their own row. Anyone without a session: rejected. No passwords for students, so this is class-private, not secure-secure — stated plainly because it's a real tradeoff.",
          },
        ],
        footer: "Out of scope on purpose: payments, parties across classes, anonymous sign-ups.",
      }),
    },
  },
  {
    id: "p3",
    subject: "Planning Agents",
    category: "prompting",
    title: "IG Autopilot",
    tagline: "One week. Zero hands. Write the plan the agent follows.",
    artifact: "plan",
    task:
      "SCENARIO: Your class wants to run its Instagram account for one week using an agent — posts, captions, replies, the lot. Before it touches anything, it needs a plan.\n\nYOUR TASK: Write the prompt that gets the agent to produce that plan, and it will show you the plan it writes. Four things have to end up in there: the goal (one sentence, what success looks like after seven days), the steps (numbered, each one actually doable), the tools it may use and the ones it must not touch, and done-criteria (how it knows it's finished, and what to do when something fails).",
    rubric: ["goal", "steps", "tools", "done"],
    mockOutputs: {
      npc: pack({
        kind: "plan",
        title: "Instagram Plan",
        goal: "Run the class Instagram account successfully.",
        steps: [
          { n: 1, action: "Create engaging content for the account." },
          { n: 2, action: "Post regularly throughout the week." },
          { n: 3, action: "Interact with followers and respond to comments." },
          { n: 4, action: "Review performance and optimise." },
        ],
        doneCriteria: ["The account is well managed.", "Followers are happy."],
      }),
      grinder: pack({
        kind: "plan",
        title: "Class Instagram — One Week",
        goal: "Post content on the class Instagram account every day for a week.",
        steps: [
          { n: 1, action: "Plan seven post ideas from class events." },
          { n: 2, action: "Draft a caption for each, under 150 characters." },
          { n: 3, action: "Schedule one post per day at 6pm.", tool: "scheduler" },
          { n: 4, action: "Check comments daily and reply to questions." },
        ],
        doneCriteria: [
          "Seven posts are published.",
          "No comment left unanswered for more than a day.",
        ],
      }),
      farmer: pack({
        kind: "plan",
        title: "Class Instagram Agent — 7-Day Run Plan",
        goal:
          "Publish 7 approved posts in 7 days about real class events, with every caption cleared by the class rep and zero named or photographed student posted without consent.",
        steps: [
          {
            n: 1,
            action:
              "Pull the week's confirmed class events from the shared calendar; list date, what happened, who is involved.",
            tool: "calendar read",
          },
          {
            n: 2,
            action:
              "For each event, check the consent sheet: any student not on it is not named and not shown. Drop the event if nothing usable is left.",
            tool: "consent sheet read",
          },
          {
            n: 3,
            action:
              "Draft one post per day: image brief + caption under 150 characters + up to 5 hashtags, in the account's existing voice.",
          },
          {
            n: 4,
            action:
              "Put all 7 drafts in one document and post the link in the class chat for the rep to approve. Wait. Do not publish anything yet.",
            tool: "file write (drafts folder)",
          },
          {
            n: 5,
            action:
              "Publish only approved drafts, one per day at 6pm, using the queue.",
            tool: "instagram publish (approved queue only)",
          },
          {
            n: 6,
            action:
              "Once a day, read new comments. Reply to factual questions about class events. Anything rude, personal, or about a named student: screenshot it, escalate to the rep, reply nothing.",
            tool: "instagram comments read",
          },
          {
            n: 7,
            action:
              "On day 7, write a one-page wrap: what was posted, reach per post, comments escalated, what to change next week.",
            tool: "file write (drafts folder)",
          },
        ],
        doneCriteria: [
          "7 posts published, each one traceable to a real event on the calendar.",
          "Every caption carries a rep approval before it goes out. No approval, no post.",
          "No post names or shows a student who is not on the consent sheet.",
          "Zero replies sent on escalated comments — those go to a human, always.",
          "Wrap-up document exists in the drafts folder.",
          "Two failures in a row (upload rejected, no approval by 6pm) → stop, report in the class chat, do not retry silently and never invent an event to fill a slot.",
        ],
      }),
    },
  },
  {
    id: "p4",
    subject: "Fact-Checking AI",
    category: "prompting",
    title: "Don't Get Played",
    tagline: "The agent will lie to your face. Catch it.",
    artifact: "research",
    task:
      "SCENARIO: History homework, due tomorrow. The question: “When and how did Singapore start teaching computing and AI in schools?” You're about to hand it to an agent.\n\nYOUR TASK: Write the prompt that gets the agent to research it. Careful: this agent invents facts and citations when it doesn't know, and it does it in a confident voice. Your prompt has to force it to show its working — real sources, named publishers or links, and an honest flag on anything it cannot back up. Whatever it hands back is what you're submitting.",
    rubric: ["verification", "sources", "uncertainty", "scope"],
    mockOutputs: {
      npc: pack({
        kind: "research",
        topic: "Computing and AI education in Singapore schools",
        summary:
          "Singapore began formal computing education in the 1980s and moved decisively into AI in the late 2010s, making it one of the earliest adopters in Asia.",
        facts: [
          {
            text:
              "The Ministry of Education introduced computer literacy programmes in schools from the 1980s alongside the national computerisation drive.",
          },
          { text: PLANTED_FAKES[0] },
          { text: PLANTED_FAKES[1] },
          {
            text:
              "Programmes such as Code for Fun introduced coding and computational thinking to primary and secondary students.",
          },
        ],
        citations: [PLANTED_CITATION],
      }),
      grinder: pack({
        kind: "research",
        topic: "Computing and AI education in Singapore schools",
        summary:
          "There is a real history here — national computerisation from the 1980s, coding enrichment in the 2010s, AI features inside the Student Learning Space more recently — but I am not confident on exact dates.",
        facts: [
          {
            text:
              "MOE runs coding and computational-thinking enrichment for primary and lower-secondary students (the Code for Fun programme).",
            source: "MOE website",
          },
          {
            text:
              "O-Level Computing exists as a subject offered by selected secondary schools.",
            source: "MOE / SEAB subject listings",
          },
          {
            text:
              "I am NOT sure when each programme started, how many schools took part, or when AI specifically entered the curriculum. I have left the years out rather than guess.",
          },
        ],
        citations: [],
      }),
      farmer: pack({
        kind: "research",
        topic: "Computing and AI education in Singapore schools",
        summary:
          "Every claim below is tagged either supported (with a checkable publisher you should open yourself) or unverified. Where I have no source, I say so instead of filling the gap.",
        facts: [
          {
            text:
              "SUPPORTED: MOE's Code for Fun programme teaches coding and computational thinking to primary and lower-secondary students as enrichment.",
            source: "Ministry of Education, moe.gov.sg — programme pages and press releases",
          },
          {
            text:
              "SUPPORTED: Computing is offered as a GCE O-Level subject in selected secondary schools; it is an elective, not a compulsory subject.",
            source: "MOE subject information / SEAB syllabus documents, seab.gov.sg",
          },
          {
            text:
              "SUPPORTED: The Student Learning Space (SLS) carries AI-assisted features such as adaptive learning and automated feedback for English writing.",
            source: "MOE / SLS, vle.learning.moe.edu.sg",
          },
          {
            text:
              "UNVERIFIED: the exact start year of each programme, and any figure for how many schools or students are covered. I found nothing I can attribute, so treat any specific percentage you see elsewhere as unsourced until you check it.",
          },
          {
            text:
              "UNVERIFIED: any law or Act named as making computing or AI compulsory. I have no evidence such legislation exists and I have not named one.",
          },
        ],
        citations: [
          "Ministry of Education Singapore — moe.gov.sg (open the programme page and quote its own wording)",
          "Singapore Examinations and Assessment Board — seab.gov.sg (O-Level Computing syllabus)",
          "Student Learning Space — vle.learning.moe.edu.sg",
          "National AI Strategy publications — smartnation.gov.sg",
        ],
      }),
    },
  },


  // ---------------- KNOWLEDGE TRACK ----------------
  {
    id: "k1",
    subject: "Spotting Deepfakes",
    category: "knowledge",
    title: "Real or Fake?",
    tagline: "Six scenes. Some look cooked. Find the clues.",
    task: "Look for visual clues. Would you flag each image as likely AI-generated?",
    items: [
      {
        id: "k1-1",
        prompt: "Portrait of a smiling woman outdoors, hair lit from behind. Any visible AI clues?",
        image: "/deepfakes/1.png",
        options: ["No obvious clues", "Flag as AI"],
        answerIndex: 1,
        explanation:
          "Flag it. Look at where the hair meets the background — generated images can smear individual strands into the blur instead of keeping crisp separate hairs, and backlit hair is one of the hardest cases. Second tell: the earrings don't match each other. Generators may treat left and right as two separate paint jobs, so paired objects — earrings, collar points, shoe laces — drift out of sync.",
      },
      {
        id: "k1-2",
        prompt: "Group of teenagers on a basketball court, mid-laugh. Any visible AI clues?",
        image: "/deepfakes/2.png",
        options: ["No obvious clues", "Flag as AI"],
        answerIndex: 0,
        explanation:
          "No obvious flag. The camera-like cues here are the imperfections: one face is motion-blurred as if the shutter caught them turning, the shadows all fall the same direction with the same softness, and the court lines stay straight and continuous where they pass behind people. Generated crowd shots often fail exactly there — lines bend around bodies and every face is equally sharp.",
      },
      {
        id: "k1-3",
        prompt: "Close-up of hands holding a phone with a coffee cup on the table. Any visible AI clues?",
        image: "/deepfakes/3.png",
        options: ["No obvious clues", "Flag as AI"],
        answerIndex: 1,
        explanation:
          "Flag it. Count the fingers, then check the knuckles — hands are a classic failure because a hand's shape changes drastically with angle and models can average over the mess. Also check the phone screen: generated screens may show text-shaped texture that isn't actual readable text, and the reflection in the screen may not match the room around it.",
      },
      {
        id: "k1-4",
        prompt: "Street scene in a busy neighbourhood, shop signs visible. Any visible AI clues?",
        image: "/deepfakes/4.png",
        options: ["No obvious clues", "Flag as AI"],
        answerIndex: 1,
        explanation:
          "Flag it. Read the signs. Lettering is where generated images can fall apart fastest: letters look right at a glance but spell nothing, the same sign uses two different fonts, or a word repeats with different spelling. Then check the geometry — window frames and roof edges that should line up on one vanishing point wander off in different directions.",
      },
      {
        id: "k1-5",
        prompt: "Fictional politician at a podium, mid-speech, press in the background. Any visible AI clues?",
        image: "/deepfakes/5.png",
        options: ["No obvious clues", "Flag as AI"],
        answerIndex: 0,
        explanation:
          "No obvious flag — and the point is that you can't decide provenance from pixels alone. Before you trust an image of a public figure, check who published it, whether two independent outlets have the same moment from different angles, and whether there is video. A picture that only exists on one account with no wire-service or newsroom original behind it is suspicious, whatever the pixels look like.",
      },
      {
        id: "k1-6",
        prompt: "Cat sitting on a windowsill in afternoon light. Any visible AI clues?",
        image: "/deepfakes/6.png",
        options: ["No obvious clues", "Flag as AI"],
        answerIndex: 1,
        explanation:
          "Flag it. Fur can be a tell: generated fur may be uniformly detailed everywhere, while a camera lens usually has one plane in focus and falls off smoothly in front and behind it. Then check the whiskers where they cross the background, and the light — if the cat is lit from the left while the shadow on the sill also points left, the physics is inconsistent.",
      },
    ],
  },
  {
    id: "k2",
    subject: "AI Ethics",
    category: "knowledge",
    title: "Okay or Not Okay?",
    tagline: "Six scenarios. Some are fine. Some will get you called up.",
    task: "For each scenario, decide whether this use of AI is okay or not okay.",
    items: [
      {
        id: "k2-1",
        prompt:
          "You're stuck starting your History essay, so you ask an AI for five possible angles on the question, pick one, and write the essay yourself.",
        options: ["Okay", "Not okay"],
        answerIndex: 0,
        explanation:
          "Okay. You used it to get unstuck, then did the thinking and the writing. That's the same as brainstorming with a friend. The line most schools draw is about whose reasoning and whose words end up in the submitted work — here, yours.",
      },
      {
        id: "k2-2",
        prompt:
          "The essay is due in 40 minutes, so you paste the question into an AI, copy the answer, change a few words so it doesn't sound robotic, and submit it.",
        options: ["Okay", "Not okay"],
        answerIndex: 1,
        explanation:
          "Not okay. Submitting work as yours when you didn't produce the ideas or the argument is plagiarism, and reworded text doesn't change that. Practical cost beyond getting caught: the essay was the practice, and you skipped it — then the exam arrives and there's no AI in the hall.",
      },
      {
        id: "k2-3",
        prompt:
          "A classmate annoys you, so you generate a fake photo of them doing something embarrassing and send it to the class group chat as a joke.",
        options: ["Okay", "Not okay"],
        answerIndex: 1,
        explanation:
          "Not okay, and this one isn't only a school rule. Making and sharing fake images of a real person to humiliate them is harassment; in Singapore it can fall under the Protection from Harassment Act, and sexualised fakes are more serious again. \"It was obviously a joke\" is not a defence once it's on someone's phone and out of your control.",
      },
      {
        id: "k2-4",
        prompt:
          "You use an AI to check your Math working, and when it says a step is wrong you go back and figure out why yourself.",
        options: ["Okay", "Not okay"],
        answerIndex: 0,
        explanation:
          "Okay — this is close to the ideal use. One caution: AI models get arithmetic and algebra wrong with total confidence, so treat \"that step is wrong\" as a hint to re-check, not a verdict. If you can't see the error yourself, the model may well be the one that's wrong.",
      },
      {
        id: "k2-5",
        prompt:
          "To get better feedback, you paste your friend's full name, class, and a chat screenshot about their family into an AI chatbot.",
        options: ["Okay", "Not okay"],
        answerIndex: 1,
        explanation:
          "Not okay. That's someone else's personal data, handed to a company, without them agreeing to it. Assume anything you type into a consumer chatbot may be stored and may be used to improve the model. If you genuinely need help with a situation, strip the names and details — \"a friend\" works fine.",
      },
      {
        id: "k2-6",
        prompt:
          "For your art project you generate a background with AI, then write on the label exactly which parts were AI-generated and which you drew.",
        options: ["Okay", "Not okay"],
        answerIndex: 0,
        explanation:
          "Okay, because you disclosed it. Most school and competition rules on AI are really rules about honesty: use the tool, say you used it, and say where. The version that gets you in trouble is the identical project with the label left off. Check your specific competition rules though — some ban generated imagery outright.",
      },
    ],
  },
  {
    id: "k3",
    subject: "Spotting Hallucinations",
    category: "knowledge",
    title: "Cap Detector",
    tagline: "One sentence in each answer is straight-up made up. Find it.",
    task: "Each AI answer below contains exactly one fabricated sentence. Pick it.",
    items: [
      {
        id: "k3-1",
        prompt:
          "AI answer about Singapore: pick the made-up sentence.\n(1) Singapore is a city-state in Southeast Asia.\n(2) It separated from Malaysia in 1965.\n(3) Its four official languages are English, Malay, Mandarin and Tamil.\n(4) Its highest natural point is Mount Faber at 538 metres.",
        options: ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4"],
        answerIndex: 3,
        explanation:
          "Sentence 4. Singapore's highest natural point is Bukit Timah Hill, around 164 m — Mount Faber is a different, much lower hill. Notice the shape of the lie: a real place name welded to a confidently precise number. Specific figures are where models hallucinate most, because a number sounds like evidence.",
      },
      {
        id: "k3-2",
        prompt:
          "AI answer about photosynthesis: pick the made-up sentence.\n(1) Plants convert light energy into chemical energy.\n(2) It takes in carbon dioxide and water and releases oxygen.\n(3) The process happens in the chloroplasts.\n(4) Photosynthesis was discovered by Isaac Newton in 1704.",
        options: ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4"],
        answerIndex: 3,
        explanation:
          "Sentence 4. Newton worked on optics and mechanics, not plant biology; the understanding of photosynthesis was built up by Priestley, Ingenhousz and others later in the 1700s. The tell is a famous name doing something outside their field — models reach for the most famous name attached to a century.",
      },
      {
        id: "k3-3",
        prompt:
          "AI answer about your own capabilities: pick the made-up sentence.\n(1) I'm a language model trained on text.\n(2) I can be confidently wrong about facts.\n(3) I have no access to today's news unless you give me a tool for it.\n(4) I double-checked this answer against Wikipedia just now, so it's accurate.",
        options: ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4"],
        answerIndex: 3,
        explanation:
          "Sentence 4. A model with no browsing tool cannot check anything, and one that just told you it has no live access cannot then claim it checked. Watch for a chatbot claiming an action it can't take — \"I verified\", \"I ran the code\", \"I looked it up\". If no tool call actually happened, that sentence is invented.",
      },
      {
        id: "k3-4",
        prompt:
          "AI answer about a book: pick the made-up sentence.\n(1) Harper Lee's To Kill a Mockingbird was published in 1960.\n(2) It's narrated by a child called Scout.\n(3) It won the Pulitzer Prize for Fiction.\n(4) Lee wrote it as the second book in her Maycomb trilogy, after Watchman's Dawn (1957).",
        options: ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4"],
        answerIndex: 3,
        explanation:
          "Sentence 4. There is no \"Maycomb trilogy\" and no book called Watchman's Dawn — the title is assembled from pieces of a real one (Go Set a Watchman, published 2015). This is the most dangerous hallucination type for schoolwork: a fake source with a plausible title and a year attached. Always check the title exists in a library catalogue before you cite it.",
      },
    ],
  },
];

export function getQuest(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}
