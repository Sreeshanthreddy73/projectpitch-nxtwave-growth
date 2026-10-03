import Link from "next/link";
import { trackerSteps } from "@/lib/competition";
import { BUDGET_PLAN, COMPETITION_NOTE } from "@/lib/config";
import { inr } from "@/lib/format";
import { ProgressTracker } from "../competition";
import { ArrowIcon, Eyebrow, buttonClass } from "../ui";

// Static landing sections below the hero and generator. Server components:
// no client JavaScript.

// The path in one line, shown under the hero copy.
export function PathStrip() {
  const steps = ["Get your AI project idea", "Register for the workshop", "Build it in 60 minutes"];
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-medium text-ink">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-card px-3 py-1.5 shadow-card">
            <span className="mr-1.5 font-mono text-xs text-accent-dark">0{i + 1}</span>
            {step}
          </span>
          {i < steps.length - 1 && <ArrowIcon className="size-3.5 text-muted" />}
        </li>
      ))}
    </ol>
  );
}

const STEPS = [
  { title: "Get your idea", body: "Answer three questions, or bring your own idea. Get an AI project scoped for one hour." },
  { title: "Register", body: "Register for the workshop to unlock your 60-minute build blueprint." },
  { title: "Make it 60-minute ready", body: "See the readiness score, what to leave out, and what to keep." },
  { title: "Build at the workshop", body: "Build it live in the workshop. Build Mode keeps the 60-minute clock and shows your current phase." },
  { title: "Submit and get evaluated", body: "Refer one friend to qualify, submit your project, and get a preliminary evaluation." },
  { title: "Campus Builders", body: "Your project gets its own card. Share it, and the next student builds theirs." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-5 py-20">
      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-h1 mt-3 max-w-xl">Before, during and after the workshop.</h2>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-body">
            ProjectPitch gets your project ready, keeps time while you build, and showcases it afterwards. The building is yours, in the workshop.
          </p>

          <div className="relative mt-10">
            {/* the line connecting the steps */}
            <div aria-hidden className="absolute bottom-5 left-[19px] top-5 w-px bg-line" />
            <ol className="space-y-7">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative flex gap-5">
                  <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-medium text-white ring-8 ring-paper">
                    0{i + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-display text-xl font-bold tracking-tight">{step.title}</h3>
                    <p className="mt-1 max-w-md text-[17px] leading-relaxed text-body">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* What the student's journey tracker looks like right after registering. */}
        <figure className="rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-8 lg:sticky lg:top-24">
          <p className="eyebrow text-white/50">Your journey, after you register</p>
          <p className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight">
            One friend qualifies you. Your project earns the rank.
          </p>
          <div className="mt-6">
            <ProgressTracker steps={trackerSteps(0, null)} onDark />
          </div>
          <figcaption className="mt-5 text-sm leading-relaxed text-white/60">
            A referral counts only when your friend completes registration. It qualifies you to enter and never changes
            your project score.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

const VALUE = [
  { label: "AI project idea", body: "Matched to your interests, or scoped from your own idea.", icon: "M10 2.5a5.5 5.5 0 0 0-3 10.1v1.9h6v-1.9a5.5 5.5 0 0 0-3-10.1ZM7.5 16.5h5M8.5 18.5h3" },
  { label: "Readiness score", body: "See how well it fits 60 minutes before you start.", icon: "M3.5 16.5h13M6 13V9M10 13V5M14 13V7.5" },
  { label: "60-minute blueprint", body: "Know exactly what to build first at the workshop.", icon: "M10 5.5V10l3 2M17.5 10a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" },
  { label: "Project card", body: "A shareable card and a place on Campus Builders.", icon: "M7.5 8.5 12.5 5.5M7.5 11.5l5 3M17 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM17 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" },
];

export function ValueSection() {
  return (
    <section className="border-y border-line bg-card">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <Eyebrow>What you get</Eyebrow>
        <h2 className="text-h1 mt-3 max-w-2xl">Walk into the workshop knowing what to build.</h2>
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
  { who: "You", step: "Get idea", note: "An AI project made for you" },
  { who: "You", step: "Register", note: "For the 60-minute workshop" },
  { who: "You", step: "Make it ready", note: "Scoped to a 60-minute MVP" },
  { who: "You", step: "Build", note: "Live at the workshop" },
  { who: "You", step: "Submit", note: "Your finished project" },
  { who: "You", step: "Get evaluated", note: "On five clear criteria" },
  { who: "You", step: "Campus Builders", note: "Your project is showcased" },
  { who: "You", step: "Share project", note: "Your card, not just a link", key: true },
  { who: "Friend", step: "Sees a real project", note: "Built by someone they know" },
  { who: "Friend", step: "Build yours", note: "One tap from your card", key: true },
  { who: "Friend", step: "New student", note: "Gets their own idea" },
];

// The growth loop, told from the student's side: every finished project is
// the invitation for the next student.
export function GrowthLoop() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <p className="eyebrow text-white/50">Why projects spread</p>
        <h2 className="text-h1 mt-3 max-w-3xl text-white">
          Every student who builds a project brings the next student in.
        </h2>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/70">
          A link asks for a favour. A real project a classmate built makes people curious. That is what gets shared.
        </p>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((item, i) => (
            <li
              key={item.step}
              className={`rounded-2xl border p-4 ${item.key ? "border-accent/70 bg-accent/10" : "border-white/10 bg-white/[0.04]"}`}
            >
              <p className="flex items-center justify-between font-mono text-[11px] text-white/45">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span className={item.who === "Friend" ? "text-[#cfc6ff]" : "text-accent"}>{item.who}</span>
              </p>
              <p className="mt-3 font-display text-lg font-bold tracking-tight text-white">{item.step}</p>
              <p className="mt-1 text-sm text-white/60">{item.note}</p>
            </li>
          ))}
          <li className="flex items-center gap-3 rounded-2xl border border-dashed border-white/25 p-4 text-sm text-white/70">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-5 shrink-0">
              <path d="M16 10a6 6 0 1 1-2-4.5M16 3v3h-3" />
            </svg>
            Back to &ldquo;Get idea&rdquo;, with your friend.
          </li>
        </ol>
      </div>
    </section>
  );
}

// The proposed competition: who can enter, and what is recognised.
export function CompetitionSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20">
      <Eyebrow>Proposed campaign competition</Eyebrow>
      <h2 className="text-h1 mt-3 max-w-2xl">The best projects get recognised.</h2>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-body">
        Referring one friend who registers qualifies you to enter. After that, only the project counts.
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {BUDGET_PLAN.map((prize) => (
          <li key={prize.id} className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <p className="font-display text-4xl font-bold tracking-tight text-ink">{inr(prize.amountInr)}</p>
            <h3 className="mt-3 text-[17px] font-semibold text-ink">{prize.label}</h3>
            <p className="mt-1 text-sm text-body">{prize.basis}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted">{COMPETITION_NOTE} This is a simulation: no real prizes are paid.</p>
    </section>
  );
}

export function FinalCta({ cta }: { cta: string }) {
  return (
    <section className="border-t border-line bg-sand/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center">
        <h2 className="text-h1 mx-auto max-w-xl">Your first AI project starts with an idea.</h2>
        <p className="mx-auto mt-3 max-w-md text-body">Get your idea now. Build it in 60 minutes at the workshop.</p>
        <Link href="#generator" className={buttonClass("primary", "lg", "mt-8")}>
          {cta} <ArrowIcon />
        </Link>
        <p className="mt-3 text-sm text-muted">No experience? Start anyway.</p>
      </div>
    </section>
  );
}
