// Campaign constants and planning assumptions, in one place.
// Assumptions are shown on the dashboard in their own panel, next to measured
// values, and are never mixed into the measured numbers.

export const CAMPAIGN = {
  name: "Build. Refer. Compete.",
  workshopTitle: "Build Your First AI Project in 60 Minutes",
  targetRegistrations: 500,
  durationDays: 7,
  budgetInr: 2000,
} as const;

// How the ₹2,000 is allocated in the campaign plan. This is the plan, not
// money that has been spent: measured spend lives in the spend_entries table.
export const BUDGET_PLAN = [
  { id: "ads", label: "Paid acquisition (ads)", amountInr: 500, category: "acquisition" },
  { id: "prize1", label: "1st prize", amountInr: 1000, category: "prize" },
  { id: "prize2", label: "2nd prize", amountInr: 500, category: "prize" },
] as const;

export const PRIZES = { first: 1000, second: 500, pool: 1500 } as const;

// One verified referral (a friend who completes registration) unlocks the
// competition entry.
export const REFERRALS_TO_UNLOCK = 1;

export const PLANNING_ASSUMPTIONS = {
  label: "Planning assumption — replace with measured data",
  // referred registrations ÷ all registrations
  kFactor: 0.34,
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
  referral: "Referral loop",
  direct: "Organic / direct",
};

export const SITE_NAME = "ProjectPitch";
export const TAGLINE = "Build. Refer. Compete.";
export const SHORT_PITCH = "Build your first AI project in 60 minutes.";
export const DISCLAIMER = "Prototype created for the NxtWave Growth Challenge. Not an official NxtWave page.";
export const SIMULATION_NOTE =
  "Campaign simulation: the competition and prizes are part of a proposed plan. No real prizes are paid.";
