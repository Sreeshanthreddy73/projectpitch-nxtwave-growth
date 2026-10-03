// Campaign constants and planning assumptions, in one place.
// Assumptions are shown on the dashboard in their own panel, next to measured
// values, and are never mixed into the measured numbers.

export const CAMPAIGN = {
  workshopTitle: "Build Your First AI Project in 60 Minutes",
  targetRegistrations: 500,
  durationDays: 7,
  budgetInr: 2000,
} as const;

export const PLANNING_ASSUMPTIONS = {
  label: "Planning assumption — replace with measured data",
  kFactor: 0.6,
  visitToGenerate: 0.5,
  generateToRegister: 0.45,
  shareRate: 0.4,
} as const;

// A/B: no verdict until each variant has at least this many visitors.
export const AB_MIN_VISITORS_PER_VARIANT = 100;
// Sources/campaigns below this many visitors are not ranked as "best" or "worst".
export const MIN_VISITORS_TO_RANK = 50;

export const SITE_NAME = "ProjectPitch";
export const TAGLINE = "Turn your idea into an AI project you can actually build.";
export const SHORT_PITCH = "Build your first AI project in 60 minutes.";
export const DISCLAIMER = "Prototype created for the NxtWave Growth Challenge. Not an official NxtWave page.";
