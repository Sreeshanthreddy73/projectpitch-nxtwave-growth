import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlueprintPlan, BlueprintSummary } from "@/components/blueprint-view";
import { ReferralProgress } from "@/components/referral-progress";
import { SharePanel } from "@/components/share-panel";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge, Card, CheckIcon, LockIcon, cx } from "@/components/ui";
import { ADVANCED_PROJECTS, STARTER_PROMPTS } from "@/content/packs";
import { CAMPAIGN } from "@/lib/config";
import { db, unwrap } from "@/lib/db";
import { countReferrals } from "@/lib/referrals";
import { REWARD_TIERS, unlockedTiers } from "@/lib/rewards";
import { cleanRef } from "@/lib/tracking-shared";
import type { Blueprint } from "@/lib/types";

// The hub link acts as the student's private key to their blueprint.
export const metadata: Metadata = { title: "Your blueprint", robots: { index: false, follow: false } };

async function loadHub(code: string) {
  const registration = unwrap(
    await db().from("registrations").select("id, name, ref_code").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
  );
  if (!registration) return null;
  const [blueprint, referrals] = await Promise.all([
    db()
      .from("blueprints")
      .select("title, problem, stack, difficulty, build_plan, resume_bullet")
      .eq("registration_id", registration.id)
      .maybeSingle(),
    countReferrals(code),
  ]);
  return { registration, blueprint: unwrap(blueprint) as Blueprint | null, referrals };
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

  const { registration, blueprint, referrals } = hub;
  const firstName = registration.name.trim().split(/\s+/)[0];
  const unlocked = unlockedTiers(referrals);

  return (
    <>
      <SiteHeader>
        <Link href="/leaderboard" className="hover:text-ink">
          Leaderboard
        </Link>
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="good">
            <CheckIcon className="size-3.5" /> Registered
          </Badge>
          {unlocked.includes("builder") && <Badge tone="accent">Campus Builder</Badge>}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">You&apos;re in, {firstName}.</h1>
        <p className="mt-2 max-w-2xl text-body">
          You&apos;re registered for &ldquo;{CAMPAIGN.workshopTitle}&rdquo;. Here is your full blueprint. Bookmark this
          page: it is your private link.
        </p>
        <p className="mt-1 text-sm text-muted">This is a prototype, so no live session is scheduled.</p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Card className="animate-rise p-6 sm:p-8">
            <BlueprintSummary {...blueprint} />
            <div className="mt-6 border-t border-line pt-6">
              <BlueprintPlan {...blueprint} />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Share your blueprint</h2>
              <p className="mt-1 text-sm text-muted">
                Classmates see your project card and can generate their own. Registrations through your card count
                towards your rewards.
              </p>
              <div className="mt-4">
                <SharePanel code={registration.ref_code} title={blueprint.title} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Referral rewards</h2>
                <Badge>Prototype rewards</Badge>
              </div>
              <div className="mt-4">
                <ReferralProgress code={registration.ref_code} initial={referrals} />
              </div>
              <ul className="mt-5 space-y-2.5">
                {REWARD_TIERS.map((tier) => {
                  const open = unlocked.includes(tier.id);
                  return (
                    <li
                      key={tier.id}
                      className={cx(
                        "flex gap-3 rounded-xl border p-3.5",
                        open ? "border-good/25 bg-good-soft" : "border-line bg-paper",
                      )}
                    >
                      <span
                        className={cx(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                          open ? "bg-good text-white" : "bg-line text-muted",
                        )}
                      >
                        {open ? <CheckIcon className="size-3.5" /> : <LockIcon className="size-3.5" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {tier.title}{" "}
                          <span className="font-normal text-muted">
                            · {tier.referrals} {tier.referrals === 1 ? "referral" : "referrals"}
                          </span>
                        </p>
                        <p className="text-sm text-body">{tier.blurb}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-muted">
                These rewards are features of this prototype. They are not offered or endorsed by NxtWave.
              </p>
            </Card>
          </div>
        </div>

        {/* Reward content is only rendered once the server has counted enough referrals. */}
        {unlocked.includes("starter") && (
          <section className="mt-10 animate-rise">
            <h2 className="text-xl font-semibold tracking-tight">Starter Prompt Pack</h2>
            <p className="mt-1 text-sm text-muted">Unlocked with your first referral. Replace the [brackets] with your own details.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {STARTER_PROMPTS.map((item) => (
                <li key={item.use} className="rounded-xl border border-line bg-card p-4">
                  <p className="text-sm font-semibold text-ink">{item.use}</p>
                  <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-body">{item.prompt}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unlocked.includes("advanced") && (
          <section className="mt-10 animate-rise">
            <h2 className="text-xl font-semibold tracking-tight">Advanced AI Project Pack</h2>
            <p className="mt-1 text-sm text-muted">Unlocked with three referrals. Three ways to take your project further.</p>
            <ul className="mt-4 grid gap-3 lg:grid-cols-3">
              {ADVANCED_PROJECTS.map((project) => (
                <li key={project.title} className="rounded-xl border border-line bg-card p-4">
                  <p className="text-sm font-semibold text-ink">{project.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{project.brief}</p>
                  <p className="mt-2 text-sm text-muted">What it proves: {project.proves}</p>
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
