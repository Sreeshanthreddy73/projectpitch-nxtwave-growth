import Link from "next/link";
import { trackerSteps } from "@/lib/competition";
import { PRIZES, SIMULATION_NOTE } from "@/lib/config";
import { inr } from "@/lib/format";
import { ProgressTracker } from "../competition";
import { ArrowIcon, Eyebrow, buttonClass } from "../ui";

// Static landing sections below the hero and generator. Server components:
// no client JavaScript.

// Prize pool, shown in the hero. Amounts come from the campaign plan.
export function PrizeStrip() {
  return (
    <div>
      <dl className="flex flex-wrap gap-2.5">
        <div className="rounded-2xl border border-line bg-card px-4 py-3 shadow-card">
          <dt className="eyebrow text-muted">🥇 1st prize</dt>
          <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{inr(PRIZES.first)}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-card px-4 py-3 shadow-card">
          <dt className="eyebrow text-muted">🥈 2nd prize</dt>
          <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{inr(PRIZES.second)}</dd>
        </div>
      </dl>
      <p className="mt-3 max-w-md text-xs leading-relaxed text-muted">
        {SIMULATION_NOTE} The plan also sets aside ₹500 as a simulated acquisition budget.
      </p>
    </div>
  );
}

const STEPS = [
  { title: "Build", body: "Answer three questions and get an AI project made for you." },
  { title: "Register", body: "Register for the workshop to unlock your 60-minute build plan." },
  { title: "Refer", body: "Send your project link to one friend." },
  { title: "Unlock", body: "When your friend registers, your competition entry unlocks." },
  { title: "Submit", body: "Build your project and submit it to compete." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-5 py-20">
      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-h1 mt-3 max-w-xl">Five steps from idea to competition entry.</h2>

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

        {/* What the student sees after registering: the entry is locked until one friend registers. */}
        <figure className="rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-8 lg:sticky lg:top-24">
          <p className="eyebrow text-white/50">Your competition entry</p>
          <p className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight">
            Refer 1 friend to unlock your competition entry.
          </p>
          <div className="mt-6">
            <ProgressTracker steps={trackerSteps(0, false)} onDark />
          </div>
          <figcaption className="mt-5 text-sm leading-relaxed text-white/60">
            A referral counts only when your friend completes registration through your link. Clicks and visits
            don&apos;t count.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

const VALUE = [
  { label: "AI project idea", body: "A project matched to your interests.", icon: "M10 2.5a5.5 5.5 0 0 0-3 10.1v1.9h6v-1.9a5.5 5.5 0 0 0-3-10.1ZM7.5 16.5h5M8.5 18.5h3" },
  { label: "60-minute roadmap", body: "Know exactly what to build first.", icon: "M10 5.5V10l3 2M17.5 10a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" },
  { label: "Resume bullet", body: "Turn the project into resume-ready evidence.", icon: "M6 2.5h6l4 4v11H4v-15h2ZM12 2.5v4h4M7 11h6M7 14h4" },
  { label: "Competition entry", body: "Refer one friend and your project can compete.", icon: "M6 3.5h8v4a4 4 0 0 1-8 0v-4ZM6 5H3.5v1.5A2.5 2.5 0 0 0 6 9M14 5h2.5v1.5A2.5 2.5 0 0 1 14 9M10 11.5v3M7 17h6" },
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
  { who: "You", step: "Discover", note: "See ProjectPitch in a group or an ad" },
  { who: "You", step: "Build", note: "Generate your AI project" },
  { who: "You", step: "Register", note: "Unlock the full plan" },
  { who: "You", step: "Refer", note: "Invite one friend", gate: true },
  { who: "Friend", step: "Registers", note: "Your referral is verified" },
  { who: "You", step: "Unlocked", note: "Competition entry opens" },
  { who: "You", step: "Submit", note: "Enter your project" },
  { who: "Friend", step: "Refers", note: "They invite the next student" },
];

// The growth loop, told from the student's side. The referral requirement is
// the step that turns every registrant into the next student's invitation.
export function GrowthLoop() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <p className="eyebrow text-white/50">Why one friend?</p>
        <h2 className="text-h1 mt-3 max-w-2xl text-white">Every entry brings one more student in.</h2>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/70">
          To compete, you bring one friend. To compete, your friend brings one too. That is how a class group turns
          into a campus.
        </p>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((item, i) => (
            <li
              key={item.step}
              className={`rounded-2xl border p-4 ${item.gate ? "border-accent/70 bg-accent/10" : "border-white/10 bg-white/[0.04]"}`}
            >
              <p className="flex items-center justify-between font-mono text-[11px] text-white/45">
                <span>0{i + 1}</span>
                <span className={item.who === "Friend" ? "text-[#cfc6ff]" : "text-accent"}>{item.who}</span>
              </p>
              <p className="mt-3 font-display text-lg font-bold tracking-tight text-white">{item.step}</p>
              <p className="mt-1 text-sm text-white/60">{item.note}</p>
              {item.gate && <p className="eyebrow mt-3 text-accent">The gate</p>}
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-center gap-2 text-sm text-white/50">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
            <path d="M16 10a6 6 0 1 1-2-4.5M16 3v3h-3" />
          </svg>
          Then it starts again with your friend.
        </p>
      </div>
    </section>
  );
}

export function FinalCta({ cta }: { cta: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 text-center">
      <h2 className="text-h1 mx-auto max-w-xl">Build. Refer. Compete.</h2>
      <p className="mx-auto mt-3 max-w-md text-body">Your project is three questions away. Your entry is one friend away.</p>
      <Link href="#generator" className={buttonClass("primary", "lg", "mt-8")}>
        {cta} <ArrowIcon />
      </Link>
      <p className="mt-3 text-sm text-muted">No experience? Start anyway.</p>
    </section>
  );
}
