// Campaign constants and planning assumptions, in one place.
// Assumptions are shown on the dashboard in their own panel, next to measured
// values, and are never mixed into the measured numbers.

export const CAMPAIGN = {
  name: "Idea → Workshop → Showcase",
  workshopTitle: "Build Your First AI Project in 60 Minutes",
  targetRegistrations: 500,
  durationDays: 7,
  budgetInr: 2000,
} as const;

// How the ₹2,000 is allocated in the campaign plan: all of it is prize money
// for the proposed competition; acquisition is organic (communities, clubs and
// shared project cards). This is the plan, not money that has been spent:
// measured spend lives in the spend_entries table.
export const BUDGET_PLAN = [
  { id: "prize1", label: "1st — Best AI Project", amountInr: 1000, category: "prize", basis: "Highest evaluated project" },
  { id: "prize2", label: "2nd — Runner-up", amountInr: 500, category: "prize", basis: "Second-highest evaluated project" },
  {
    id: "people",
    label: "People's Choice — Most Shared Project",
    amountInr: 500,
    category: "prize",
    basis: "Most verified registrations through the project's card (not clicks)",
  },
] as const;

export const PRIZE_POOL_INR = 2000;

// Shown wherever prizes or the competition appear.
export const COMPETITION_NOTE = "Proposed campaign mechanic — not an official NxtWave competition.";
export const SIMULATION_NOTE =
  "Proposed campaign mechanic — not an official NxtWave competition. This is a simulation: no real prizes are paid.";

// One verified referral (a friend who completes registration) qualifies a
// student for the competition. Referrals never affect the project score.
export const REFERRALS_TO_UNLOCK = 1;

// PROPOSED campaign judging criteria (not official NxtWave criteria). The same
// five dimensions are used for the pre-workshop readiness score and for the
// post-workshop evaluation, so students know in advance how they are judged.
export const CRITERIA = [
  { id: "functionality", label: "Project functionality", max: 30 },
  { id: "ai", label: "Meaningful AI implementation", max: 25 },
  { id: "usefulness", label: "Problem usefulness & originality", max: 20 },
  { id: "sixty", label: "60-minute execution", max: 15 },
  { id: "demo", label: "Demo / explanation", max: 10 },
] as const;

export type CriterionId = (typeof CRITERIA)[number]["id"];
export type ScoreLine = { id: CriterionId; label: string; max: number; score: number; note: string };

export const PLANNING_ASSUMPTIONS = {
  label: "Planning assumption — replace with measured data",
  // referred registrations ÷ all registrations
  kFactor: 0.36,
  visitToGenerate: 0.6,
  generateToRegister: 0.47,
  shareRate: 0.35,
} as const;

// A/B: no verdict until each variant has at least this many visitors.
export const AB_MIN_VISITORS_PER_VARIANT = 100;
// Sources/campaigns below this many visitors are not ranked as "best" or "worst".
export const MIN_VISITORS_TO_RANK = 50;

// Display names for utm_source values on the dashboard. Unknown sources are
// shown as they were tracked.
export const SOURCE_LABELS: Record<string, string> = {
  instagram: "Paid acquisition (Instagram ads)",
  whatsapp: "WhatsApp / student communities",
  clubs: "Clubs / community distribution",
  referral: "Shared project cards (referral loop)",
  direct: "Organic / direct",
};

export const SITE_NAME = "ProjectPitch";
export const TAGLINE = "Get your AI project idea. Register. Build it in 60 minutes.";
export const SHORT_PITCH = "Get your AI project idea, register for the workshop, and build it in 60 minutes.";
export const DISCLAIMER = "Prototype created for the NxtWave Growth Challenge. Not an official NxtWave page.";
