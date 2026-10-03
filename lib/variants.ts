// The two landing-page variants under test. Only the hook changes; the
// generator and everything after it are identical, so any difference in
// conversion can be attributed to the message.

export type Variant = "a" | "b";

export const VARIANTS: Record<Variant, { name: string; eyebrow: string; headline: string; sub: string; cta: string }> = {
  a: {
    name: "Resume hook",
    eyebrow: "For final-year engineering students",
    headline: "Walk into placements with an AI project on your resume.",
    sub: "Tell us your branch and skill level. Get a personalised AI project blueprint in 30 seconds, with the resume bullet written for you, then build it in a 60-minute live workshop.",
    cta: "Get my resume project",
  },
  b: {
    name: "Build hook",
    eyebrow: "A 60-minute live workshop",
    headline: "Build your first AI project in 60 minutes.",
    sub: "Pick what interests you and get a personalised project blueprint in 30 seconds: what to build, which tools to use and a step-by-step plan. Then build it live with us.",
    cta: "Generate my project",
  },
};
