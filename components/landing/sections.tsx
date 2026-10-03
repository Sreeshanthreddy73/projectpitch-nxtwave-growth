import Link from "next/link";
import { ArrowIcon, Eyebrow, buttonClass } from "../ui";

// Static landing sections below the hero and generator. Server components:
// no client JavaScript.

const STEPS = [
  { n: "01", title: "Generate", body: "Tell us what you're interested in." },
  { n: "02", title: "Build", body: "Get a personalized 60-minute project roadmap." },
  { n: "03", title: "Share", body: "Share your project and invite friends to build theirs." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-5 py-20">
      <Eyebrow>How it works</Eyebrow>
      <h2 className="text-h1 mt-3 max-w-2xl">From idea to a project you can show, in three steps.</h2>

      <div className="relative mt-12">
        {/* the line connecting the three steps */}
        <div aria-hidden className="absolute left-[19px] top-5 h-[calc(100%-2.5rem)] w-px bg-line md:left-0 md:top-[19px] md:h-px md:w-full" />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((step) => (
          <li key={step.n} className="relative flex gap-5 md:block">
            <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-medium text-white ring-8 ring-paper">
              {step.n}
            </span>
            <div className="md:mt-6">
              <h3 className="font-display text-2xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-2 max-w-xs text-[17px] leading-relaxed text-body">{step.body}</p>
            </div>
          </li>
        ))}
        </ol>
      </div>
    </section>
  );
}

const VALUE = [
  { label: "AI project idea", body: "A project matched to your interests.", icon: "M10 2.500a5.500 5.500 0 0 0-3 10.100V14.500h6v-1.900a5.500 5.500 0 0 0-3-10.100ZM7.500 16.500h5M8.500 18.500h3" },
  { label: "60-minute roadmap", body: "Know exactly what to build first.", icon: "M10 5.500V10l3 2M17.500 10a7.500 7.500 0 1 1-15 0 7.500 7.500 0 0 1 15 0Z" },
  { label: "Resume bullet", body: "Turn the project into resume-ready evidence.", icon: "M6 2.500h6l4 4v11H4v-15h2ZM12 2.500v4h4M7 11h6M7 14h4" },
  { label: "Shareable project", body: "Show your project to classmates.", icon: "M7.500 8.500 12.500 5.500M7.500 11.500l5 3M17 4.500a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0ZM8 10a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0ZM17 15.500a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0Z" },
];

export function ValueSection() {
  return (
    <section className="border-y border-line bg-card">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <Eyebrow>What you get</Eyebrow>
        <h2 className="text-h1 mt-3 max-w-2xl">Everything you need to start, on one page.</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE.map((item) => (
            <li
              key={item.label}
              className="group rounded-2xl border border-line bg-paper p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ink/20 hover:shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-ink text-white transition-colors group-hover:bg-accent">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-5">
                  <path d={item.icon} />
                </svg>
              </span>
              <h3 className="eyebrow mt-5 text-ink">{item.label}</h3>
              <p className="mt-2 text-[17px] leading-snug text-body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const LOOP = [
  { who: "You", step: "Generate", note: "Get your project" },
  { who: "You", step: "Register", note: "Unlock the full plan" },
  { who: "You", step: "Share", note: "Send your project card" },
  { who: "Friend", step: "Generates", note: "Gets their own project" },
  { who: "Friend", step: "Registers", note: "Unlocks their plan" },
  { who: "You", step: "Referral", note: "You earn credit" },
];

// The growth loop, told from the student's side: every project made is an
// invitation for the next student.
export function GrowthLoop() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <p className="eyebrow text-white/50">Better with friends</p>
        <h2 className="text-h1 mt-3 max-w-2xl text-white">Every project you share helps a classmate start theirs.</h2>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/70">
          Your project card is yours to share. When a friend builds their own from it, you both move forward.
        </p>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
          {LOOP.map((item, i) => (
            <li key={item.step} className="relative lg:pr-3">
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="flex items-center justify-between font-mono text-[11px] text-white/45">
                  <span>0{i + 1}</span>
                  <span className={item.who === "Friend" ? "text-[#cfc6ff]" : "text-accent"}>{item.who}</span>
                </p>
                <p className="mt-3 font-display text-lg font-bold tracking-tight text-white">{item.step}</p>
                <p className="mt-1 text-sm text-white/60">{item.note}</p>
              </div>
              {i < LOOP.length - 1 && (
                <span aria-hidden className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 text-white/40 lg:block">
                  <ArrowIcon className="size-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-center gap-2 text-sm text-white/50">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
            <path d="M16 10a6 6 0 1 1-2-4.500M16 3v3h-3" />
          </svg>
          Then your friend shares theirs, and it starts again.
        </p>
      </div>
    </section>
  );
}

export function FinalCta({ cta }: { cta: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 text-center">
      <h2 className="text-h1 mx-auto max-w-xl">Your first AI project is three questions away.</h2>
      <Link href="#generator" className={buttonClass("primary", "lg", "mt-8")}>
        {cta} <ArrowIcon />
      </Link>
      <p className="mt-3 text-sm text-muted">No experience? Start anyway.</p>
    </section>
  );
}
