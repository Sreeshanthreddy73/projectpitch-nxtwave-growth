// The two landing-page hooks under test. Only the hero message changes; the
// CTA, the generator and everything after it are identical, so a difference in
// conversion can be attributed to the hook.

export type Variant = "a" | "b";

export const VARIANTS: Record<Variant, { name: string; eyebrow: string; headline: string; sub: string }> = {
  a: {
    name: "Resume hook",
    eyebrow: "For final-year engineering students",
    headline: "Turn your idea into an AI project your resume can show.",
    sub: "Tell us what you're interested in. ProjectPitch creates a personalized project idea, tech stack, 60-minute build roadmap and a resume-ready bullet.",
  },
  b: {
    name: "Build hook",
    eyebrow: "Build your first AI project",
    headline: "Turn your idea into an AI project you can actually build.",
    sub: "Tell us what you're interested in. ProjectPitch creates a personalized project idea, tech stack and 60-minute build roadmap.",
  },
};

export const HERO_CTA = "Generate My AI Project";
