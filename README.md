# ProjectPitch

A working growth prototype for the NxtWave Growth Challenge: drive registrations for the workshop
**"Build Your First AI Project in 60 Minutes"** (target: 500 final-year engineering students, 7 days, ₹2,000).

> Prototype for a growth challenge, not an official NxtWave page. Referral rewards in the app are
> features of this prototype, not NxtWave offers.

## What the product does

A student answers three questions (branch/year, skill level, interest) and gets a personalised AI project
blueprint. They see a preview straight away; registering for the workshop unlocks the 60-minute build plan
and a resume bullet. Each registrant gets a public **blueprint card** to share. Classmates who open the card
generate their own blueprint, and the referral is credited to the sharer.

Every step is tracked, so the admin dashboard shows the funnel, sources, campaigns, an A/B test, referral
performance and cost per registration, and can generate a growth recommendation from those numbers.

```
visit → generate blueprint → preview → register → unlock → share card
                                                              │
                 friend opens card → generates → registers ◄──┘  (referral credited)
```

## Why it was built

With ₹2,000, paid reach cannot deliver 500 registrations; most have to come from organic sharing. Three decisions follow:

- **Value before the form.** The student gets something useful before being asked for details.
- **The blueprint is the growth object.** Students share their own project, not an "invite a friend" link.
- **Measure, then learn.** Attribution, an A/B test with a real significance check, and an insights step
  whose recommendations the campaign owner accepts or rejects.

It maps onto the growth workflow: Idea (the blueprint hook) → Build (this app) → Launch (tracked links) →
Measure (dashboard) → Learn (A/B test + insights) → Scale (referral loop, best channel).

## Architecture

One Next.js application. No separate backend, queue or auth service.

```
Browser ──► proxy.ts            sets session id, A/B variant, first-touch attribution (httpOnly cookies)
        ──► pages (app/)        landing, public card, hub, leaderboard, admin
        ──► route handlers      app/api/*  (server only)
              ├─ lib/db.ts        Supabase client, service-role key
              ├─ lib/ai.ts        Claude API  ──fails / no key──► deterministic fallback
              ├─ lib/tracking.ts  reads attribution cookies, writes events
              └─ lib/metrics.ts   calls the SQL function dashboard_metrics()
```

Key design points:

- **The lock is server-side.** `/api/generate` returns only the preview. The build plan and resume bullet stay
  in the database until `/api/register` succeeds for the same browser session.
- **Real and demo data never mix.** Every table has `is_demo`. Every query filters on one value. The dashboard
  has a Real / Demo switch and no combined view; public pages read real data only.
- **AI is optional.** Without `ANTHROPIC_API_KEY`, blueprints come from 18 hand-written templates
  (`lib/fallback.ts`) and insights from rules (`lib/insights-fallback.ts`). If a key is set and the call fails,
  the same fallback is used. Each result records `generated_by: ai | fallback`.
- **Insights use aggregates only.** SQL computes the metrics; `toSnapshot()` in `lib/metrics.ts` copies counts
  and rates into the payload. Names, emails and referral codes are never sent to the model.
- **The A/B verdict is computed in code** (`lib/stats.ts`, two-proportion z-test) and reports
  "not enough data" until each variant has 100 visitors.

### Folder structure

```
app/
  page.tsx                  landing page + generator (variant A or B)
  b/[id]/page.tsx           public blueprint card
  hub/[code]/page.tsx       full blueprint, share panel, referral rewards
  r/[code]/route.ts         short referral link → card
  leaderboard/page.tsx
  admin/                    login + dashboard
  api/generate, register, event, referral/[code]
  api/admin/login, metrics, insights, insights/[id], demo-data, spend
components/                 UI (generator, share panel, admin dashboard panels)
lib/                        db, ai, fallback, tracking, metrics, stats, demo-data, auth, config
content/packs.ts            content of the prototype reward packs
supabase/schema.sql         tables, indexes, RLS, SQL functions
proxy.ts                    session, variant and attribution cookies
```

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres) · Recharts ·
Anthropic SDK (optional) · Zod · deployed on Vercel.

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | no | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **yes** | Server-side database access |
| `ADMIN_PASSWORD` | for `/admin` | **yes** | Admin dashboard password |
| `ANTHROPIC_API_KEY` | no | **yes** | Switches on live AI; empty = deterministic fallback |
| `ANTHROPIC_MODEL` | no | no | Model override (default `claude-opus-5-5`; e.g. `claude-haiku-4-5` for lower cost) |

The three secrets are read only in `lib/db.ts`, `lib/auth.ts` and `lib/ai.ts`. Those files import
`server-only`, so the build fails if one is ever pulled into browser code. `.env*` files are git-ignored
except `.env.example`.

If something is missing, the app says so: the landing page and the APIs return the exact setup steps instead
of crashing.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**. It is safe to re-run.
3. Open **Project Settings → API**. Copy the **Project URL** and the **service_role** key into `.env.local`.

Row level security is enabled on every table with no policies, so the public anon key can read nothing. The app
only uses the service-role key, on the server.

## Local development

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

Other commands: `npm run build`, `npm run start`, `npm run lint`.

Attribution is first-touch and stored in a cookie for 30 days. To test a new source or a referral, use a
**new incognito window** each time.

## Demo data

The campaign in this challenge is a simulation, so the dashboard can load a simulated one.

- Sign in at `/admin`, then click **Load Demo Data**. This writes about 300 registrations and 3,000 events with
  `is_demo = true`: five days of a seven-day campaign across WhatsApp, Instagram, LinkedIn, direct and referral
  traffic, two landing variants, and ₹1,600 of spend.
- The Demo view always shows a **DEMO DATA — SIMULATION** banner. Students are invented, colleges are fictional,
  emails use `example.com`.
- **Clear** removes every demo row and nothing else. The numbers are produced by `lib/demo-data.ts` from the
  channel assumptions at the top of that file.

## Admin access

`/admin` asks for `ADMIN_PASSWORD`. A correct password sets a signed, httpOnly session cookie valid for 12 hours.
There are no user accounts. Changing the password signs everyone out.

The dashboard shows: progress to 500, daily pace and required pace, visitors, blueprint generations,
registrations, shares, referral registrations, conversion rates, measured K-factor, source / campaign / A/B
performance, top referrers, college and branch distribution, spend and cost per registration, planning
assumptions next to measured values, and which dataset is on screen.

## Testing

`npm run lint` and `npm run build` must pass.

The functional checklist below was run end to end during development against a real Postgres engine loaded with
`supabase/schema.sql`. Run it again by hand after connecting your own Supabase project:

| | Check |
|---|---|
| A–B | Generate a blueprint; the preview shows title, problem, stack, difficulty; the plan is locked |
| C–D | Register; the hub shows the full build plan and resume bullet |
| E–G | Copy the link; open it in incognito; the card shows no personal data; register a second student |
| H–I | First hub shows 1 referral and the Starter Prompt Pack |
| J–K | Dashboard (Real) shows both registrations with the right source, campaign and variant |
| L–M | `/admin` redirects to login when signed out; wrong password is rejected |
| N–O | Load Demo Data; Demo view fills in; Real view is unchanged |
| P–Q | Generate Insights; accept one action and reject another with a reason |
| R | Every screen works at 390 px wide with no sideways scrolling |
| S | Invalid email, missing consent, duplicate email and unknown links are handled with clear messages |
| T | With an invalid `ANTHROPIC_API_KEY`, generation still works via the fallback |

## Deployment to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, import the repository. Framework is detected as Next.js.
3. Add the environment variables from the table above (Production and Preview).
4. Deploy, then open `/admin` and sign in.

## 3-minute demo flow

1. Open `/?utm_source=whatsapp&utm_campaign=cse_group_a`.
2. Choose branch, skill level and interest; generate a blueprint.
3. Show the preview and the locked build plan.
4. Register.
5. The hub shows the full blueprint.
6. Copy the blueprint link.
7. Open it in an incognito window: the public card.
8. Click **Generate yours**, generate and register a second student.
9. Back on the first hub: 1 referral, Starter Prompt Pack unlocked (updates within 10 seconds).
10. Open `/admin` and sign in. **Real data**: two registrations, one from `whatsapp / cse_group_a`, one from `referral`.
11. Click **Load Demo Data**: the Demo view shows a full campaign under the simulation banner.
12. Click **Generate Insights**.
13. Read Working / Leaking / Next 24 hours.
14. Accept one recommendation and reject another, typing the reason for each.

Add `?v=a` or `?v=b` to the landing URL to force a variant when demonstrating the A/B test.

## Known limitations

- Email is the only duplicate check, so one person with several addresses can inflate referrals. OTP
  verification would close this at the cost of a longer form.
- The hub link is the student's only way back to their blueprint; there is no "resend my link".
- Rate limiting is in memory, per server instance: it slows abuse but does not stop a determined attacker.
- No workshop is scheduled. Registration records intent only.
