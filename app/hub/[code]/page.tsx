import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlueprintMeta, BuildTimeline, StackList } from "@/components/blueprint-view";
import { ProgressTracker } from "@/components/competition";
import { ReferralProgress } from "@/components/referral-progress";
import { ScopeCard, ScoreBreakdown } from "@/components/score-card";
import { CopyText, SharePanel } from "@/components/share-panel";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SubmitForm } from "@/components/submit-form";
import { ArrowIcon, Badge, Card, CheckIcon, Eyebrow, LockIcon, SparkIcon, buttonClass, cx } from "@/components/ui";
import { ADVANCED_PROJECTS, STARTER_PROMPTS } from "@/content/packs";
import { splitProblem } from "@/lib/blueprint-text";
import { getSubmission, isEligible, trackerSteps } from "@/lib/competition";
import { CAMPAIGN, COMPETITION_NOTE } from "@/lib/config";
import { db, unwrap } from "@/lib/db";
import { totalScore } from "@/lib/evaluation";
import { countReferrals } from "@/lib/referrals";
import { scoreReadiness } from "@/lib/readiness";
import { REWARD_TIERS, unlockedTiers } from "@/lib/rewards";
import { scopeFor } from "@/lib/scope";
import { cleanRef } from "@/lib/tracking-shared";
import type { Blueprint } from "@/lib/types";

// The hub is the student's workspace before and after the workshop: the
// 60-minute-ready project and plan, competition qualification, submission,
// evaluation and sharing. The link acts as their private key.
export const metadata: Metadata = { title: "Your project", robots: { index: false, follow: false } };

async function loadHub(code: string) {
  const registration = unwrap(
    await db().from("registrations").select("id, name, ref_code").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
  );
  if (!registration) return null;
  const [blueprint, referrals, submission] = await Promise.all([
    db()
      .from("blueprints")
      .select("id, title, problem, stack, difficulty, build_plan, resume_bullet, original_idea")
      .eq("registration_id", registration.id)
      .maybeSingle(),
    // Verified referrals: friends who completed registration with this code.
    countReferrals(code),
    getSubmission(registration.id),
  ]);
  return {
    registration,
    blueprint: unwrap(blueprint) as (Blueprint & { id: string; original_idea: string | null }) | null,
    referrals,
    submission,
  };
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
  const steps = trackerSteps(referrals, submission);
  const { oneLiner, why } = splitProblem(blueprint.problem);
  const readiness = scoreReadiness(blueprint);
  const scope = scopeFor(blueprint.original_idea, blueprint.title);
  const evaluation = submission?.evaluation ?? null;

  const status = submission
    ? "Your project is on Campus Builders. Share it."
    : eligible
      ? "You qualify for the competition. Build your project at the workshop, then submit it here."
      : "Next: refer 1 friend to qualify for the competition. You build the project at the workshop.";

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
                <CheckIcon className="size-3.5" /> Competition unlocked
              </Badge>
            ) : (
              <Badge>
                <LockIcon className="size-3" /> Competition locked
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
          {/* Left: after the workshop (submission, evaluation), then the project and its plan */}
          <div className="space-y-6">
            {submission && evaluation && (
              <Card className="animate-rise border-ai/25 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="eyebrow inline-flex items-center gap-1.5 text-ai">
                    <SparkIcon className="size-3.5" /> Preliminary evaluation
                  </p>
                  <Badge tone={evaluation.generated_by === "ai" ? "ai" : "neutral"}>
                    {evaluation.generated_by === "ai" ? "AI-assisted review" : "Rule-based review"}
                  </Badge>
                </div>
                <div className="mt-5">
                  <ScoreBreakdown total={submission.score ?? totalScore(evaluation.criteria)} lines={evaluation.criteria} evaluation />
                </div>
                <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-body">
                  A first pass based on what you wrote in your submission. It does not open your links, so it cannot
                  confirm that the project works or that it was built in 60 minutes. &ldquo;60-minute execution&rdquo;
                  needs human verification: the Build Mode timer is not sent to us and does not prove it. Human judges
                  decide the ranking.
                  These are proposed campaign judging criteria, not official NxtWave criteria. Referrals are not part of
                  this score.
                </p>
              </Card>
            )}

            {eligible && (
              <Card id="submit" className="animate-rise border-accent/30 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow className="text-accent-dark">Project submission</Eyebrow>
                  <Badge tone="good">
                    <CheckIcon className="size-3" /> {submission ? "Submitted" : "Unlocked"}
                  </Badge>
                </div>
                {submission ? (
                  <>
                    <h2 className="text-h2 mt-3">Your project is submitted.</h2>
                    <dl className="mt-4 space-y-3 text-[15px]">
                      <div>
                        <dt className="eyebrow text-muted">Project link</dt>
                        <dd className="mt-1 break-all">
                          <a
                            href={submission.project_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="font-medium text-ink underline underline-offset-4 hover:text-accent-dark"
                          >
                            {submission.project_url}
                          </a>
                        </dd>
                      </div>
                      {submission.summary && (
                        <div>
                          <dt className="eyebrow text-muted">What it does</dt>
                          <dd className="mt-1 text-body">{submission.summary}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link href={`/b/${blueprint.id}`} className={buttonClass("dark", "md")}>
                        View your project card <ArrowIcon />
                      </Link>
                    </div>
                    <div className="mt-4">
                      <SubmitForm code={registration.ref_code} existing={submission} />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-h2 mt-3">Built it at the workshop? Submit it.</h2>
                    <p className="mt-2 text-body">
                      Add a link to what you built and tell us about it. You get a preliminary evaluation and a public
                      project card to share.
                    </p>
                    <div className="mt-5">
                      <SubmitForm code={registration.ref_code} existing={null} />
                    </div>
                  </>
                )}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Eyebrow>60-minute build readiness</Eyebrow>
                <Badge tone="ai">Scored on scope, not on you</Badge>
              </div>
              <div className="mt-5">
                <ScoreBreakdown total={readiness.total} lines={readiness.lines} />
              </div>
              <div className="mt-6">
                <ScopeCard scope={scope} />
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Your 60-minute build blueprint</Eyebrow>
                <Badge tone="good">
                  <CheckIcon className="size-3" /> Unlocked
                </Badge>
              </div>
              <p className="mt-2 text-sm text-body">
                Your plan for the workshop. When the workshop starts, open Build Mode to follow it against the clock.
              </p>
              <div className="mt-6">
                <BuildTimeline build_plan={blueprint.build_plan} />
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6">
                <Link href={`/hub/${registration.ref_code}/build`} className={buttonClass("dark", "lg")}>
                  Start 60-Minute Build <ArrowIcon />
                </Link>
                <p className="text-sm text-muted">Opens Build Mode. The timer starts when you press start.</p>
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
                Use it after you have built the project. Replace the [bracketed] values with numbers you measure yourself.
              </p>
            </div>
          </div>

          {/* Right: the journey, sharing and referrals */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <Card className="p-6 sm:p-7">
              <Eyebrow>Your journey</Eyebrow>
              <div className="mt-4">
                <ProgressTracker steps={steps} />
              </div>
              <div className="mt-5">
                {submission ? (
                  <Link href="/leaderboard" className={buttonClass("secondary", "lg", "w-full")}>
                    See Campus Builders <ArrowIcon />
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
              <p className="mt-3 text-xs leading-relaxed text-muted">
                A referral qualifies you to enter. It never changes your project score. {COMPETITION_NOTE}
              </p>
            </Card>

            <div id="share" className="rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-7">
              <p className="eyebrow text-white/50">{submission ? "Share your project" : "Invite a friend"}</p>
              <p className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight">
                {submission ? `I built ${blueprint.title} with AI.` : eligible ? "Keep sharing your project." : "One friend qualifies you."}
              </p>
              <p className="mt-2 text-[15px] text-white/70">
                {submission
                  ? "Your link opens your project card. Friends who see a real project build their own."
                  : "Send your link. It counts when your friend gets their own project idea and registers. A click alone doesn't count."}
              </p>
              <div className="mt-5">
                <SharePanel code={registration.ref_code} title={blueprint.title} built={Boolean(submission)} />
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
