# ProjectPitch

**An AI-powered project-to-registration-to-showcase growth loop**, built as the working asset for the NxtWave
Growth Intern – Growth Challenge.

> **This is a prototype and a simulation.** It was created for the NxtWave Growth Challenge and is not an
> official NxtWave page. The competition, prizes and judging criteria described here are a **proposed campaign
> mechanic, not an official NxtWave competition**. No real prizes are paid and no students were contacted. The
> app does not claim 500 students were acquired: it shows how the campaign could reach 500 registrations in 7
> days under stated assumptions.

## The idea in one line

**Every student who builds a project becomes the acquisition channel for the next student.**

| | |
|---|---|
| Workshop | "Build Your First AI Project in 60 Minutes" |
| Goal | 500 final-year engineering student registrations in 7 days |
| Budget | ₹2,000 (simulated) |

ProjectPitch works **before**, **during** and **after** the workshop:

- **ProjectPitch does not host the actual NxtWave workshop.** The student builds their project there.
- **Build Mode is a prototype of the workshop engagement experience**: a 60-minute countdown that follows the
  student's own blueprint, phase by phase.
- **The timer is an engagement mechanism, not proof of build completion.** It does not verify that anything
  was built, and it has no effect on eligibility or scores.

There is no coding environment here, and the timer never appears in the idea or registration flow.

```
GET IDEA → REGISTER → 60-MINUTE BLUEPRINT → START 60-MINUTE BUILD → SUBMIT → EVALUATE
   ↑                                                                           ↓
NEW STUDENT ← BUILD YOURS ← FRIEND SEES A REAL PROJECT ← SHARE PROJECT ← CAMPUS BUILDERS
```

## Student journey

1. **Get your AI project idea.** Three questions, or type your own idea.
2. **See it made 60-minute ready.** A readiness score out of 100 and a scope optimizer (what to leave out, what
   to keep) are shown before sign-up.
3. **Register for the workshop** to unlock the personalised 60-minute build blueprint and a resume bullet.
4. **Refer one friend who registers** to qualify for the competition.
5. **Start the 60-minute build** in Build Mode when the workshop starts, and follow the blueprint against the
   clock. (The journey tracker shows this step as "At workshop" and never marks it done.)
6. **Submit the project** and get a preliminary evaluation.
7. **Appear on Campus Builders** with a shareable project card: "I built X in the NxtWave AI workshop."
8. **A friend sees the real project**, taps **Build Yours**, and starts at step 1, credited to the builder.

## Features

### 60-Minute Build Readiness (score out of 100)

Rates how well the **project** is scoped for a 60-minute MVP, not whether the student will finish. It is
rule-based and deterministic (`lib/readiness.ts`), and runs on every project whether it came from the AI model
or the built-in templates, so the model never grades its own work. No plan gets full marks: some points can
only be earned by building it.

### Scope optimizer

If a student types their own idea, it is cut down to a 60-minute MVP (`lib/scope.ts`):

```
Your idea:       "AI Medical Diagnosis Platform"
60-minute MVP:   "Medical Diagnosis Classification Demo"
Leave out:       Multi-feature platform · High-stakes decisions · Authentication · Complex database · Advanced UI
Keep:            One input · The AI / API call · The prediction or result · A simple demo screen
```

Projects generated without a typed idea are already scoped; the same Keep / Leave out lists are shown.

### Personalised 60-minute build blueprint

Unlocked by registration. For a typed idea it follows five phases: 0–10 setup, 10–25 AI integration, 25–45 core
functionality, 45–55 interface and testing, 55–60 demo preparation. It is a planning blueprint for the
workshop, labelled as such.

### 60-Minute Build Mode

Opened from the student's hub with **Start 60-Minute Build** (`/hub/CODE/build`). It is not shown anywhere in
the idea-generation or registration flow.

- A real countdown from 60:00 to 00:00.
- The five phases of the student's own blueprint, with their timings: Setup, AI integration, Core
  functionality, Interface + testing, Demo preparation. The current phase is highlighted automatically from the
  elapsed time, and finished phases are ticked.
- Pause and resume. The session survives a page reload.
- At zero: "Time's up — submit what you built." with **Submit Project**, which goes to the existing submission
  form on the hub.

What the timer deliberately does not do:

- It runs entirely in the student's browser (`localStorage`). Nothing about it is sent to or stored on the
  server, and there is no timer API.
- Reaching zero does not submit anything, does not mark the project as completed, and awards no points.
- It does not unlock the competition: a student who has not referred a friend is still told to qualify first.
- It is not an input to the evaluation. A submission scores the same whether or not the timer was ever opened.
- It does not prove the "60-minute execution" criterion, which is marked **Needs human verification** wherever
  an evaluation is shown and can never receive full marks from the automated pass.

### Competition qualification and submission

- **Referral = qualification. Project quality = ranking.** The two are kept apart: referral counts are never
  passed to the evaluation and never change a score.
- A referral counts only when the referred friend **completes registration** through the student's link. A
  click, a visit or a generated project does not count.
- Eligibility is not a stored flag. It is computed from the database and re-checked on the server in
  `/api/submit`, which refuses with `403 locked` otherwise.

### Project evaluation — proposed criteria

| Criterion | Weight |
|---|---|
| Project functionality | 30 |
| Meaningful AI implementation | 25 |
| Problem usefulness & originality | 20 |
| 60-minute execution | 15 |
| Demo / explanation | 10 |

**These are proposed campaign judging criteria, not official NxtWave criteria.** The same five dimensions are
used for the readiness score, so students know in advance how they are judged.

On submission the project gets a **preliminary** score: AI-assisted when an API key is configured, rule-based
otherwise (`lib/evaluation.ts`). Either way it reads only what the student wrote and linked. It does not open
the project, so it cannot confirm that the project works or that it was built in 60 minutes. Neither the AI
nor the rule-based pass can award full marks on those two criteria, and "60-minute execution" is labelled
**Needs human verification**: the Build Mode timer is not evidence for it. The UI says this, and says human
judges decide.

### Campus Builders (public showcase)

Each submitted project is a card with the project name, description, AI stack, builder's first name and
college, preliminary score, demo and project links, and a **Build Yours →** button. That button carries the
builder's referral code, so a new student who registers is credited to the project they saw. The page also
shows colleges with their number of builders and submitted projects.

Campus Builders shows real data only. Simulated students never appear on public pages.

### Shareable project card

After submission the student's link opens a card that leads with the project, not a generic invite: project,
AI stack, result, first name and college, and **Build Yours**. Before submission the same link shows only the
project idea and nothing about the student.

## Proposed campaign competition (simulated ₹2,000)

| Prize | Amount | Decided by |
|---|---|---|
| 1st — Best AI Project | ₹1,000 | Highest evaluated project |
| 2nd — Runner-up | ₹500 | Second-highest evaluated project |
| People's Choice — Most Shared Project | ₹500 | Most **verified registrations** through the project's card, not clicks |

Proposed campaign mechanic, not an official NxtWave competition. The whole budget is prize money; acquisition
is organic. The dashboard shows this allocation as a plan, separate from **measured real spend**, which only
the Real view records.

## Simulation assumptions

Demo mode on the dashboard is the campaign simulation, always labelled **DEMO DATA — CAMPAIGN SIMULATION** and
never mixed with real data. It is built from the assumptions in `lib/demo-data.ts`, not measured:

- **Registrations per day:** 40, 55, 65, 75, 85, 90, 90. Cumulative: 40, 95, 160, 235, 320, 410, 500.
- **Registrations by source (of 500):** shared project cards / referral loop 180 · WhatsApp and student
  communities 175 · clubs 100 · organic 45. No paid channel.
- **Referral share:** 36% of registrations arrive through a shared project.
- **Submissions:** 60% of qualified students are assumed to submit; their scores are simulated.
- **A/B test:** the simulated split is deliberately close, so the demo shows "no significant difference"
  rather than a manufactured winner.
- People are invented: random first names with an initial, fictional colleges, `example.com` emails.

## A/B test

Visitors are split 50/50 and keep their variant (`?v=a` or `?v=b` forces one for demos).

- **A — idea-first:** "Turn your idea into a 60-minute-ready AI project, register for the workshop, and build it with us."
- **B — showcase-first:** "See what students are building, get your own 60-minute-ready AI project…"

The headline, CTA and generator are identical. The verdict is a two-proportion z-test computed in code and
reports "not enough data" until each variant has 100 visitors.

## What is tracked

`visit`, `generate`, `register`, `share_click`, `card_view` (a friend opens a project card),
`referral_verified`, `competition_unlocked`, `project_submission`. Every event and registration carries
first-touch `utm_source`, `utm_medium`, `utm_campaign`, the referral code and the A/B variant, read on the
server from httpOnly cookies set by `proxy.ts`.

## Architecture

One Next.js application. No separate backend, queue or auth service.

```
Browser ──► proxy.ts            session id, A/B variant, first-touch attribution (httpOnly cookies)
        ──► pages (app/)        landing, project card, hub, Campus Builders, admin
        ──► route handlers      app/api/*  (server only)
              ├─ lib/db.ts          Supabase client, secret key
              ├─ lib/ai.ts          Claude API  ──fails / no key──► deterministic fallback
              ├─ lib/readiness.ts   60-minute readiness score (rule-based)
              ├─ lib/scope.ts       scope optimizer (rule-based)
              ├─ lib/evaluation.ts  preliminary evaluation (rule-based fallback)
              ├─ lib/competition.ts eligibility and journey state, derived from referrals
              ├─ lib/build-mode.ts  phases and clock maths for Build Mode (timer runs in the browser only)
              └─ lib/metrics.ts     calls the SQL function dashboard_metrics()
```

- **The blueprint lock is server-side.** `/api/generate` returns the preview, readiness and scope; the plan and
  resume bullet stay in the database until `/api/register` succeeds for the same browser session.
- **Real and demo data never mix.** Every table has `is_demo`; every query filters on one value.
- **AI is optional.** Without `ANTHROPIC_API_KEY`, projects come from 18 hand-written templates (or the
  five-phase plan for typed ideas), evaluation and insights from rules.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres) · Recharts · Anthropic SDK
(optional) · Zod · deployable on Vercel.

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | no | Supabase project URL |
| `SUPABASE_SECRET_KEY` | yes | **yes** | Server-side database access |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | no | no | Not read by the app today; kept for a future browser client |
| `ADMIN_PASSWORD` | for `/admin` | **yes** | Admin dashboard password |
| `ANTHROPIC_API_KEY` | no | **yes** | Switches on live AI; empty = deterministic fallback |
| `ANTHROPIC_MODEL` | no | no | Model override (default `claude-opus-5-5`) |

Secrets are read only in `lib/db.ts`, `lib/auth.ts` and `lib/ai.ts`, which import `server-only`. `.env*` files
are git-ignored except `.env.example`.

## How to run

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Copy the project URL, publishable key and secret key from **Project Settings → API Keys** into `.env.local`.

`schema.sql` is safe to re-run and upgrades an existing database in place without touching data. **Run it
again after pulling this version**: it adds `blueprints.original_idea` and the evaluation columns on
`submissions`, which the hub and Campus Builders need.

Row level security is enabled on every table with no policies. The app only uses the secret key, on the server.

### 2. Local

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

To test a referral, open the link in a **new incognito window**: attribution is first-touch and stored in a
cookie.

### 3. Admin and demo data

`/admin` asks for `ADMIN_PASSWORD`. **Load Demo Data** loads the campaign simulation; **Clear** removes every
simulated row and nothing else.

## Demo flow for an evaluator (3 to 4 minutes)

1. Open `/?utm_source=whatsapp&utm_campaign=cse_group_a`. Hero: "Get your first AI project idea."
2. Click **Get My Project Idea**. Answer the three questions and type an oversized idea such as
   `AI Medical Diagnosis Platform`.
3. Show the result: the scoped-down MVP name, the **readiness score**, and the Leave out / Keep lists.
4. Register. The hub shows the 60-minute blueprint and the journey tracker: qualification locked, workshop step
   marked "At workshop".
5. Copy the project link and open it in an incognito window: "You were invited to build an AI project."
6. Back on the hub: still locked. A click does not count.
7. In the incognito window, tap **Build Yours**, get an idea and register.
8. Back on the hub: referral verified, competition unlocked.
9. Click **Start 60-Minute Build**. Show the 60:00 clock and the five phases, press start, and pause. Explain
   that this represents the workshop and that the timer proves nothing by itself.
10. Click **Submit Project** and submit. Show the **preliminary evaluation**, the "Needs human verification" tag
    on 60-minute execution, and the "not official criteria, human judges decide" note.
11. Open **View your project card**: "I built … in the NxtWave AI workshop."
12. Open **Campus Builders**: the project card with score and **Build Yours**. Click it to show the loop closing.
13. Open `/admin`. **Real data**: the two registrations, one qualified student, one submission.
14. Switch to **Demo data**: the 7-day, 500-registration simulation, sources, budget and judging criteria.
15. Click **Generate Insights**; accept one recommendation and reject another with a reason.

## Testing

`npm run lint` and `npm run build` must pass. The functional checklist (idea scoping, readiness score,
registration, referral link, referred registration, qualification, Build Mode, submission and evaluation,
project card, Campus Builders, dashboard, Demo/Real separation, invalid input, AI fallback) was run end to end
during development against a real Postgres engine loaded with `schema.sql`. Build Mode was also driven in a
real browser: start, countdown, pause and resume, reload, each phase transition, reaching zero, and a check
that the same submission scores the same with and without the timer.

## Known limitations

- **ProjectPitch does not verify the build.** It cannot confirm a project works or was built in 60 minutes.
  The "60-minute execution" score is self-reported and capped; a judge has to open the project.
- **The Build Mode timer is trust-based.** It lives in the browser, can be paused, restarted or ignored, and is
  per device. That is intentional: it is an engagement tool, and recording it would invite treating it as
  proof.
- **The automated evaluation reads text only.** It can be gamed by writing well. It is a first pass for human
  judges, not a decision.
- **The readiness score and scope optimizer are rules, not understanding.** They key on tools, step counts and
  scope words; an unusual idea may be scored or renamed awkwardly.
- **Identity is not verified.** Email is the only duplicate check, so one person with two emails and two
  browsers can refer themselves. Self-referral is otherwise blocked by cookie.
- **Submitted links are shown publicly** with `nofollow`, and are only required to be `https://`. There is no
  moderation.
- **People's Choice** uses verified registrations as the measure of sharing; there is no separate voting.
- **The hub link is the student's only way back** to their project.
- **Rate limiting is in memory**, per server instance.
- **No workshop or competition is actually scheduled.** The live AI path needs an API key and has only been
  exercised through its failure path.
