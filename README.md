# ProjectPitch — Build. Refer. Compete.

A working growth asset for the NxtWave Growth Intern – Growth Challenge.

> **This is a prototype and a simulation.** It was created for the NxtWave Growth Challenge. It is not an
> official NxtWave page, and the competition and prizes described here are part of a proposed campaign plan,
> not an official NxtWave competition, unless NxtWave itself states otherwise. No real prizes are paid, no ads
> were bought, and no students were contacted. The app does not claim 500 students were acquired: it shows how
> the campaign could reach 500 registrations in 7 days under stated assumptions.

## Campaign concept

| | |
|---|---|
| Workshop | "Build Your First AI Project in 60 Minutes" |
| Goal | 500 final-year engineering student registrations |
| Duration | 7 days |
| Budget | ₹2,000 |
| Idea | A student builds an AI project, registers, and must refer **one friend who also registers** to unlock a competition entry |

The working asset is not a landing page. It is:

**AI project generator + registration + referral tracker/gate + competition eligibility + project submission + growth analytics.**

### Student journey

1. Land on ProjectPitch: "Build. Refer. Compete."
2. Answer three questions and get a personalised AI project (preview visible before sign-up).
3. Register to unlock the full 60-minute build plan and resume bullet.
4. Receive a unique referral link and see: "Refer 1 friend to unlock your competition entry."
5. A friend opens the link ("You were invited to build an AI project"), builds their own project and registers.
6. The original student's referral becomes **verified** and their competition entry **unlocks**.
7. The student submits their project. Entries appear on the Campus Builders page.

The progress tracker on the student's hub shows the five steps and their real state:
Project created → Registration complete → Refer 1 friend → Competition entry → Project submission.

### The referral rule

- A referral counts **only** when the referred friend completes registration through the referrer's link.
- A link click, a visit to the referral page, or a generated project does not count.
- Eligibility is not a stored flag. It is computed from the database each time: a student is eligible when at
  least one real registration has `referred_by` equal to their code. `/api/submit` re-checks this on the server
  and refuses with `403 locked` otherwise, whatever the page shows.
- Self-referral is blocked where it can be seen: a visitor's own code is never credited to them (cookie check),
  and each email can register once.

### Budget allocation (plan)

| Item | Amount | Share |
|---|---|---|
| Paid acquisition (ads) | ₹500 | 25% |
| 1st prize | ₹1,000 | 50% |
| 2nd prize | ₹500 | 25% |
| **Total** | **₹2,000** | |

The dashboard keeps two things apart: the **simulated campaign allocation** above (a plan, shown in both views)
and **measured real spend** (entries an admin records, shown only in the Real view). Acquisition cost per
registration uses acquisition spend only; total cost per registration includes prizes.

### Growth loop

```
Paid / community exposure → student generates project → registration → referral requirement
      ↑                                                                        ↓
more students enter ← student shares ← project submission ← competition unlocked ← friend registers
```

The referral requirement is the central mechanism: every student who wants to compete must bring one more
registered student.

## Simulation assumptions

Demo mode on the dashboard is the campaign simulation. It is always labelled **DEMO DATA — CAMPAIGN
SIMULATION** and is never mixed with real data. It is built from the assumptions in `lib/demo-data.ts`, not
measured:

- **Registrations per day:** 40, 55, 65, 75, 85, 90, 90. Cumulative: 40, 95, 160, 235, 320, 410, 500.
- **Registrations by source (of 500):**

  | Source | Registrations | Assumed visit → registration |
  |---|---|---|
  | WhatsApp / student communities | 170 | 30% |
  | Referral loop | 170 | 38.5% |
  | Clubs / community distribution | 95 | 32% |
  | Organic / direct | 40 | 20% |
  | Paid acquisition (Instagram ads, ₹500) | 25 | 12.6% |

- **Referral share:** 34% of registrations come through the referral gate (K ≈ 0.34).
- **Submissions:** 60% of students who unlock their entry are assumed to submit.
- **A/B test:** the simulated split is deliberately close (52/48), so the demo shows "no significant
  difference" rather than a manufactured winner.
- People are invented: random first names with an initial, fictional colleges, `example.com` emails.

These numbers are assumptions chosen to be plausible. The paid-acquisition figure in particular (25
registrations from ₹500) is an estimate, not a quote from an ad platform.

## A/B test

Visitors are split 50/50 and keep their variant (`?v=a` or `?v=b` forces one for demos).

- **A — project-first:** "Create an AI project in 60 minutes. Refer one friend to unlock your competition entry."
- **B — competition-first:** "Compete for the prize pool with an AI project you build in 60 minutes…"

The headline, CTA and generator are identical. The verdict is a two-proportion z-test computed in code
(`lib/stats.ts`) and reports "not enough data" until each variant has 100 visitors.

## What is tracked

| Event | When |
|---|---|
| `visit` | landing page viewed |
| `generate` | project generated |
| `register` | registration completed (this also creates the referral link) |
| `share_click` | referrer copies or shares their link |
| `card_view` | a friend opens the referral link (the click) |
| `referral_verified` | a referred friend completes registration |
| `competition_unlocked` | a student's first verified referral |
| `project_submission` | a competition entry is submitted |

Every event and registration carries first-touch `utm_source`, `utm_medium`, `utm_campaign`, the referral code
and the A/B variant, read on the server from httpOnly cookies set by `proxy.ts`.

## Architecture

One Next.js application. No separate backend, queue or auth service.

```
Browser ──► proxy.ts            session id, A/B variant, first-touch attribution (httpOnly cookies)
        ──► pages (app/)        landing, referral card, hub, Campus Builders, admin
        ──► route handlers      app/api/*  (server only)
              ├─ lib/db.ts          Supabase client, secret key
              ├─ lib/ai.ts          Claude API  ──fails / no key──► deterministic fallback
              ├─ lib/competition.ts eligibility and tracker state, derived from referrals
              ├─ lib/tracking.ts    reads attribution cookies, writes events
              └─ lib/metrics.ts     calls the SQL function dashboard_metrics()
```

- **The blueprint lock is server-side.** `/api/generate` returns only the preview; the plan and resume bullet
  stay in the database until `/api/register` succeeds for the same browser session.
- **Real and demo data never mix.** Every table has `is_demo`; every query filters on one value; public pages
  read real data only.
- **AI is optional.** Without `ANTHROPIC_API_KEY`, projects come from 18 hand-written templates and insights
  from rules. If a key is set and the call fails, the same fallback is used.
- **Insights use aggregates only**, and only recommend: the campaign owner accepts or rejects each action.

### Folder structure

```
app/
  page.tsx                  landing: hero (variant A or B), generator, 5 steps, growth loop
  b/[id]/page.tsx           referral page / public project card
  hub/[code]/page.tsx       project workspace: tracker, submission, share, referrals
  r/[code]/route.ts         short referral link → referral page
  leaderboard/page.tsx      Campus Builders: competition entries, top referrers, colleges
  admin/                    login + dashboard
  api/generate, register, submit, event, referral/[code]
  api/admin/login, metrics, insights, insights/[id], demo-data, spend
components/                 generator, blueprint views, competition tracker, submit form, landing/, admin/
lib/                        db, ai, fallback, competition, tracking, metrics, stats, demo-data, auth, config
supabase/schema.sql         tables, indexes, RLS, SQL functions
proxy.ts                    session, variant and attribution cookies
```

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres) · Recharts · Anthropic SDK
(optional) · Zod · deployable on Vercel.

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | no | Supabase project URL |
| `SUPABASE_SECRET_KEY` | yes | **yes** | Server-side database access (replaces the old service-role key) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | no | no | Not read by the app today; kept for a future browser client |
| `ADMIN_PASSWORD` | for `/admin` | **yes** | Admin dashboard password |
| `ANTHROPIC_API_KEY` | no | **yes** | Switches on live AI; empty = deterministic fallback |
| `ANTHROPIC_MODEL` | no | no | Model override (default `claude-opus-5-5`) |

The secrets are read only in `lib/db.ts`, `lib/auth.ts` and `lib/ai.ts`, which import `server-only`, so the
build fails if one is pulled into browser code. `.env*` files are git-ignored except `.env.example`.

If something is missing, nothing crashes. Students see "Project generator temporarily unavailable. Please try
again shortly." The exact setup steps go to the server log (`[setup] ...`), to a collapsed "Developer details"
block when running `npm run dev`, and to the signed-in admin dashboard.

## How to run

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings → API Keys** and copy the project URL, publishable key and secret key into `.env.local`.

`schema.sql` is safe to re-run and upgrades an existing database in place. **If you created your database from
an earlier version of this project, run it again**: this version adds the `submissions` table, three event
types and a spend category, and the hub page needs them.

Row level security is enabled on every table with no policies, so the publishable key can read nothing. The app
only uses the secret key, on the server.

### 2. Local

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

Other commands: `npm run build`, `npm run start`, `npm run lint`.

Attribution is first-touch and stored in a cookie for 30 days. To test a referral, open the link in a **new
incognito window**.

### 3. Admin and demo data

`/admin` asks for `ADMIN_PASSWORD` and sets a signed, httpOnly session cookie for 12 hours. Click **Load Demo
Data** to load the campaign simulation; **Clear** removes every simulated row and nothing else.

### 4. Deploy to Vercel

Import the repository, add the environment variables, deploy.

## 3-minute demo flow

1. Open `/?utm_source=whatsapp&utm_campaign=cse_group_a`. Show "Build. Refer. Compete." and the prize pool.
2. Click **Build My Project**, answer three questions, show the preview with the locked plan.
3. Register. The hub shows the tracker: entry and submission locked, **Invite a Friend**.
4. Copy the project link and open it in an incognito window: "You were invited to build an AI project."
5. Back on the hub: still locked. A click alone does not count.
6. In the incognito window, build a project and register.
7. Back on the hub (updates within 10 seconds): referral verified, entry **unlocked**, **Submit Project**.
8. Submit a project link. It appears under Competition entries on Campus Builders.
9. Open `/admin`. **Real data**: two registrations, one eligible student, one submission.
10. Switch to **Demo data**: the 7-day simulation, 500 registrations, the cumulative chart, sources and budget.
11. Click **Generate Insights**, then accept one recommendation and reject another with a reason.

## Testing

`npm run lint` and `npm run build` must pass. The functional checklist (generation, registration, referral
link, referred registration, verification, unlock, submission, dashboard, Demo/Real separation, invalid input,
AI fallback) was run end to end during development against a real Postgres engine loaded with `schema.sql`.

## Known limitations

- **Identity is not verified.** Email is the only duplicate check, so one person with two email addresses and
  two browsers can refer themselves. OTP or college-email verification would close this at the cost of a longer
  form; it was left out deliberately to keep registration short.
- **Self-referral is blocked only by cookie and email.** Clearing cookies defeats the cookie check.
- **No judging system.** Entries are listed by verified referrals; picking winners is outside this prototype.
- **Submitted links are not shown publicly** and are not checked beyond requiring `https://`.
- **The hub link is the student's only way back** to their project; there is no "resend my link".
- **Rate limiting is in memory**, per server instance: it slows abuse but does not stop a determined attacker.
- **No workshop or competition is actually scheduled.** Registration records intent only.
- **The live AI path needs an API key** and has only been exercised through its failure path.
