import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlueprintMeta, BuildTimeline, StackList } from "@/components/blueprint-view";
import { ProgressTracker } from "@/components/competition";
import { ReferralProgress } from "@/components/referral-progress";
import { CopyText, SharePanel } from "@/components/share-panel";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SubmitForm } from "@/components/submit-form";
import { ArrowIcon, Badge, Card, CheckIcon, Eyebrow, LockIcon, SparkIcon, buttonClass, cx } from "@/components/ui";
import { ADVANCED_PROJECTS, STARTER_PROMPTS } from "@/content/packs";
import { splitProblem } from "@/lib/blueprint-text";
import { getSubmission, isEligible, trackerSteps } from "@/lib/competition";
import { CAMPAIGN, PRIZES, SIMULATION_NOTE } from "@/lib/config";
import { db, unwrap } from "@/lib/db";
import { inr } from "@/lib/format";
import { countReferrals } from "@/lib/referrals";
import { REWARD_TIERS, unlockedTiers } from "@/lib/rewards";
import { cleanRef } from "@/lib/tracking-shared";
import type { Blueprint } from "@/lib/types";

// The hub is the student's personal project workspace and their competition
// status. The link acts as their private key to the blueprint.
export const metadata: Metadata = { title: "Your project", robots: { index: false, follow: false } };

async function loadHub(code: string) {
  const registration = unwrap(
    await db().from("registrations").select("id, name, ref_code").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
  );
  if (!registration) return null;
  const [blueprint, referrals, submission] = await Promise.all([
    db()
      .from("blueprints")
      .select("title, problem, stack, difficulty, build_plan, resume_bullet")
      .eq("registration_id", registration.id)
      .maybeSingle(),
    // Verified referrals: friends who completed registration with this code.
    countReferrals(code),
    getSubmission(registration.id),
  ]);
  return { registration, blueprint: unwrap(blueprint) as Blueprint | null, referrals, submission };
}

export default async function HubPage({ params }: { params: Promise<{ code: string }> }) {
  const code = cleanRef((await params).code);
  if (!code) notFound();

  let hub: Awaited<ReturnType<typeof loadHub>>;
  try {
    hub = await loadHub(code);
  } catch (error) {
    return (
      <>
        <SiteHeader />
        <LoadFailure error={error} />
        <SiteFooter />
      </>
    );
  }
  if (!hub || !hub.blueprint) notFound();

  const { registration, blueprint, referrals, submission } = hub;
  const firstName = registration.name.trim().split(/\s+/)[0];
  const unlocked = unlockedTiers(referrals);
  const eligible = isEligible(referrals);
  const steps = trackerSteps(referrals, Boolean(submission));
  const { oneLiner, why } = splitProblem(blueprint.problem);

  const status = submission
    ? "Your project is in the competition."
    : eligible
      ? "Your competition entry is unlocked. Submit your project."
      : "Refer 1 friend to unlock your competition entry.";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
        <div className="animate-rise">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="good">
              <CheckIcon className="size-3.5" /> Registered
            </Badge>
            {eligible ? (
              <Badge tone="good">
                <CheckIcon className="size-3.5" /> Competition entry unlocked
              </Badge>
            ) : (
              <Badge>
                <LockIcon className="size-3" /> Competition entry locked
              </Badge>
            )}
            {unlocked.includes("builder") && <Badge tone="accent">Campus Builder</Badge>}
          </div>
          <h1 className="text-h1 mt-4">Your project is ready, {firstName}.</h1>
          <p className="mt-3 max-w-2xl text-lg font-medium text-ink">{status}</p>
          <p className="mt-1 max-w-2xl text-body">
            You&apos;re registered for &ldquo;{CAMPAIGN.workshopTitle}&rdquo;. This page is your private workspace, so
            bookmark it.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* Left: the project and, once unlocked, the submission */}
          <div className="space-y-6">
            {eligible && (
              <Card id="submit" className="animate-rise border-accent/30 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow className="text-accent-dark">Project submission</Eyebrow>
                  <Badge tone="good">
                    <CheckIcon className="size-3" /> Unlocked
                  </Badge>
                </div>
                {!submission && (
                  <>
                    <h2 className="text-h2 mt-3">Submit your project.</h2>
                    <p className="mt-2 text-body">
                      Share a link to what you built: a GitHub repo, a deployed demo or a short video.
                    </p>
                  </>
                )}
                <div className="mt-5">
                  <SubmitForm code={registration.ref_code} existing={submission} />
                </div>
              </Card>
            )}

            <Card className="animate-rise p-6 sm:p-8">
              <Eyebrow className="text-accent-dark">Your AI project</Eyebrow>
              <h2 className="text-h1 mt-3">{blueprint.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-body">{oneLiner}</p>
              <div className="mt-6">
                <BlueprintMeta difficulty={blueprint.difficulty} />
              </div>
              <div className="mt-7 grid gap-7 border-t border-line pt-7 sm:grid-cols-[1.3fr_1fr]">
                <div>
                  <Eyebrow>Why this project?</Eyebrow>
                  <p className="mt-2.5 leading-relaxed text-body">{why}</p>
                </div>
                <div>
                  <Eyebrow>Tech stack</Eyebrow>
                  <div className="mt-2.5">
                    <StackList stack={blueprint.stack} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Your 60-minute build</Eyebrow>
                <Badge tone="good">
                  <CheckIcon className="size-3" /> Unlocked
                </Badge>
              </div>
              <div className="mt-6">
                <BuildTimeline build_plan={blueprint.build_plan} />
              </div>
            </Card>

            <div className="rounded-2xl border border-ai/25 bg-ai-soft p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow inline-flex items-center gap-1.5 text-ai">
                  <SparkIcon className="size-3.5" /> Resume bullet
                </p>
                <CopyText text={blueprint.resume_bullet} />
              </div>
              <p className="mt-4 font-display text-xl font-medium leading-snug tracking-tight text-ink">
                {blueprint.resume_bullet}
              </p>
              <p className="mt-3 text-sm text-body">
                Replace the [bracketed] values with numbers you measure yourself when you build it.
              </p>
            </div>
          </div>

          {/* Right: competition status, sharing and referrals */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Your competition entry</Eyebrow>
                <span className="font-mono text-xs text-muted">
                  🥇 {inr(PRIZES.first)} · 🥈 {inr(PRIZES.second)}
                </span>
              </div>
              <div className="mt-4">
                <ProgressTracker steps={steps} />
              </div>
              <div className="mt-5">
                {submission ? (
                  <Link href="/leaderboard" className={buttonClass("secondary", "lg", "w-full")}>
                    See the competition <ArrowIcon />
                  </Link>
                ) : eligible ? (
                  <a href="#submit" className={buttonClass("primary", "lg", "w-full")}>
                    Submit Project <ArrowIcon />
                  </a>
                ) : (
                  <a href="#share" className={buttonClass("primary", "lg", "w-full")}>
                    Invite a Friend <ArrowIcon />
                  </a>
                )}
              </div>
              <p className="mt-3 text-xs text-muted">{SIMULATION_NOTE}</p>
            </Card>

            <div id="share" className="rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-7">
              <p className="eyebrow text-white/50">Invite a friend</p>
              <p className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight">
                {eligible ? "Keep sharing your project." : "One friend unlocks your entry."}
              </p>
              <p className="mt-2 text-[15px] text-white/70">
                Send your link. It counts when your friend builds their own project and registers. A click alone
                doesn&apos;t count.
              </p>
              <div className="mt-5">
                <SharePanel code={registration.ref_code} title={blueprint.title} />
              </div>
            </div>

            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Your referrals</Eyebrow>
                <Badge>Verified only</Badge>
              </div>
              <div className="mt-4">
                <ReferralProgress code={registration.ref_code} initial={referrals} />
              </div>
              <ul className="mt-6 space-y-2.5">
                {REWARD_TIERS.map((tier) => {
                  const open = unlocked.includes(tier.id);
                  return (
                    <li
                      key={tier.id}
                      className={cx(
                        "flex gap-3 rounded-xl border p-3.5 transition-colors",
                        open ? "border-good/25 bg-good-soft" : "border-line bg-paper",
                      )}
                    >
                      <span
                        className={cx(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                          open ? "bg-good text-white" : "bg-line text-muted",
                        )}
                      >
                        {open ? <CheckIcon className="size-3.5" /> : <LockIcon className="size-3" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {tier.title}{" "}
                          <span className="font-normal text-muted">
                            · {tier.referrals} {tier.referrals === 1 ? "referral" : "referrals"}
                          </span>
                          <span className="sr-only">{open ? " (unlocked)" : " (locked)"}</span>
                        </p>
                        <p className="text-sm text-body">{tier.blurb}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-muted">
                Bonus packs and badges are features of this prototype. They are not offered or endorsed by NxtWave.
              </p>
            </Card>
          </div>
        </div>

        {/* Reward content is only rendered once the server has counted enough referrals. */}
        {unlocked.includes("starter") && (
          <section className="mt-14 animate-rise">
            <Eyebrow className="text-good">Unlocked with your first referral</Eyebrow>
            <h2 className="text-h2 mt-2">Starter Prompt Pack</h2>
            <p className="mt-2 text-body">Replace the [brackets] with your own details.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {STARTER_PROMPTS.map((item) => (
                <li key={item.use} className="rounded-2xl border border-line bg-card p-5">
                  <p className="text-sm font-semibold text-ink">{item.use}</p>
                  <p className="mt-2 font-mono text-[13px] leading-relaxed text-body">{item.prompt}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unlocked.includes("advanced") && (
          <section className="mt-14 animate-rise">
            <Eyebrow className="text-good">Unlocked with three referrals</Eyebrow>
            <h2 className="text-h2 mt-2">Advanced AI Project Pack</h2>
            <p className="mt-2 text-body">Three ways to take your project further.</p>
            <ul className="mt-6 grid gap-3 lg:grid-cols-3">
              {ADVANCED_PROJECTS.map((project) => (
                <li key={project.title} className="rounded-2xl border border-line bg-card p-5">
                  <p className="font-semibold text-ink">{project.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-body">{project.brief}</p>
                  <p className="mt-3 text-sm text-muted">What it proves: {project.proves}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
