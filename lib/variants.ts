// The two landing-page messages under test. The headline, CTA, generator and
// everything after are identical; only what the hero leads with changes, so a
// difference in conversion can be attributed to the message.
//
//   A — idea-first:     lead with getting a project idea and building it
//   B — showcase-first: lead with other students' projects and the competition

export type Variant = "a" | "b";

export const VARIANTS: Record<Variant, { name: string; eyebrow: string; sub: string }> = {
  a: {
    name: "Idea-first",
    eyebrow: "Build your first AI project",
    sub: "Turn your idea into a 60-minute-ready AI project, register for the workshop, and build it with us.",
  },
  b: {
    name: "Showcase-first",
    eyebrow: "Campus Builders · proposed campaign competition",
    sub: "See what students are building, get your own 60-minute-ready AI project, build it at the workshop and put it on Campus Builders.",
  },
};

export const HERO_HEADLINE = "Get your first AI project idea.";
export const HERO_CTA = "Get My Project Idea";
