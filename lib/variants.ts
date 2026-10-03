// The two landing-page messages under test. The headline, CTA, generator and
// everything after are identical; only what the hero leads with changes, so a
// difference in conversion can be attributed to the message.
//
//   A — project-first:     lead with building the project
//   B — competition-first: lead with the competition and prize pool

export type Variant = "a" | "b";

export const VARIANTS: Record<Variant, { name: string; eyebrow: string; sub: string }> = {
  a: {
    name: "Project-first",
    eyebrow: "Build your first AI project",
    sub: "Create an AI project in 60 minutes. Refer one friend to unlock your competition entry.",
  },
  b: {
    name: "Competition-first",
    eyebrow: "AI project competition · ₹1,500 prize pool",
    sub: "Compete for the prize pool with an AI project you build in 60 minutes. Refer one friend to unlock your entry.",
  },
};

export const HERO_HEADLINE = ["Build.", "Refer.", "Compete."];
export const HERO_CTA = "Build My Project";
