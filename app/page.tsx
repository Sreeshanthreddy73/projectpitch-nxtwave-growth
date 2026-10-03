import { headers } from "next/headers";
import Link from "next/link";
import { Generator } from "@/components/generator";
import { SetupNotice, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Track } from "@/components/track";
import { Card } from "@/components/ui";
import { CAMPAIGN } from "@/lib/config";
import { describeSetupProblem, missingDbEnv, SetupError } from "@/lib/db";
import { VARIANTS, type Variant } from "@/lib/variants";

const STEPS = [
  { title: "Generate", body: "Three choices in, one project blueprint out: the problem, the stack and the difficulty." },
  { title: "Unlock", body: "Register for the workshop to get the 60-minute build plan and a ready-made resume bullet." },
  { title: "Share", body: "Send your blueprint card to classmates. Each one who registers unlocks more for you." },
];

export default async function LandingPage() {
  // proxy.ts assigns the variant and passes it in a request header.
  const assigned = (await headers()).get("x-pp-variant");
  const variant: Variant = assigned === "b" ? "b" : "a";
  const copy = VARIANTS[variant];

  const missing = missingDbEnv();
  const setup = missing.length > 0 ? describeSetupProblem(new SetupError(missing)) : null;

  return (
    <>
      {!setup && <Track type="visit" />}
      <SiteHeader>
        <Link href="/leaderboard" className="hover:text-ink">
          Leaderboard
        </Link>
      </SiteHeader>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20">
        <section className="grid items-start gap-10 pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-14">
          <div className="lg:sticky lg:top-10">
            <p className="text-sm font-semibold text-accent-dark">{copy.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
              {copy.headline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">{copy.sub}</p>

            <dl className="mt-8 hidden max-w-xl grid-cols-3 gap-4 border-t border-line pt-6 text-sm lg:grid">
              <div>
                <dt className="text-muted">Workshop</dt>
                <dd className="mt-1 font-medium text-ink">{CAMPAIGN.workshopTitle}</dd>
              </div>
              <div>
                <dt className="text-muted">You need</dt>
                <dd className="mt-1 font-medium text-ink">A laptop and basic Python, or none</dd>
              </div>
              <div>
                <dt className="text-muted">You leave with</dt>
                <dd className="mt-1 font-medium text-ink">A working project and a resume line</dd>
              </div>
            </dl>
          </div>

          <div id="generator">
            {setup ? (
              <SetupNotice problem={setup} />
            ) : (
              <Card className="overflow-hidden shadow-[0_1px_2px_rgba(17,17,20,0.04),0_12px_32px_-12px_rgba(17,17,20,0.12)]">
                <Generator cta={copy.cta} />
              </Card>
            )}
          </div>
        </section>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-line bg-card p-5">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
