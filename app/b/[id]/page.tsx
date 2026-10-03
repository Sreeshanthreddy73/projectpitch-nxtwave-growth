import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BlueprintSummary } from "@/components/blueprint-view";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Track } from "@/components/track";
import { Card, LockIcon } from "@/components/ui";
import { CAMPAIGN } from "@/lib/config";
import { db, unwrap } from "@/lib/db";
import { isUuid } from "@/lib/tracking-shared";
import type { Blueprint } from "@/lib/types";

// Public blueprint card: the thing students share. It selects only the four
// preview fields plus the owner's referral code. No name, email or college is
// queried, so none can leak.

const loadCard = cache(async (id: string) => {
  const blueprint = unwrap(
    await db()
      .from("blueprints")
      .select("title, problem, stack, difficulty, registration_id")
      .eq("id", id)
      .eq("is_demo", false)
      .maybeSingle(),
  );
  if (!blueprint) return null;

  let refCode: string | null = null;
  if (blueprint.registration_id) {
    const owner = unwrap(
      await db().from("registrations").select("ref_code").eq("id", blueprint.registration_id).maybeSingle(),
    );
    refCode = owner?.ref_code ?? null;
  }
  const { title, problem, stack, difficulty } = blueprint as Pick<Blueprint, "title" | "problem" | "stack" | "difficulty">;
  return { title, problem, stack, difficulty, refCode };
});

// First two sentences: enough to understand the project, short enough for a card.
function shortProblem(problem: string): string {
  const sentences = problem.match(/[^.!?]+[.!?]+/g) ?? [problem];
  return sentences.slice(0, 2).join("").trim();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const card = isUuid(id) ? await loadCard(id) : null;
    if (!card) return { title: "Blueprint not found" };
    const description = `${shortProblem(card.problem)} Get your own AI project blueprint in 30 seconds.`;
    return {
      title: `${card.title} — an AI project blueprint`,
      description,
      openGraph: { title: `${card.title} — an AI project blueprint`, description },
    };
  } catch {
    return { title: "AI project blueprint" };
  }
}

export default async function BlueprintCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  let card: Awaited<ReturnType<typeof loadCard>>;
  try {
    card = await loadCard(id);
  } catch (error) {
    return (
      <>
        <SiteHeader />
        <LoadFailure error={error} />
        <SiteFooter />
      </>
    );
  }
  if (!card) notFound();

  const generateHref = card.refCode ? `/?ref=${card.refCode}` : "/";

  return (
    <>
      <Track type="card_view" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-5 pb-20 pt-4">
        <p className="text-sm font-semibold text-accent-dark">
          {card.refCode ? "A classmate shared their AI project blueprint" : "An AI project blueprint"}
        </p>
        <Card className="mt-4 animate-rise p-6 shadow-[0_12px_32px_-12px_rgba(17,17,20,0.12)] sm:p-8">
          <BlueprintSummary title={card.title} problem={shortProblem(card.problem)} stack={card.stack} difficulty={card.difficulty} />
          <p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
            <LockIcon /> The build plan and resume bullet are private to the student who generated this.
          </p>
        </Card>

        <div className="mt-8 rounded-2xl bg-ink p-6 text-white sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">What would your project be?</h1>
          <p className="mt-2 text-white/75">
            Answer three questions and get a blueprint matched to your branch and skill level, then build it in the
            &ldquo;{CAMPAIGN.workshopTitle}&rdquo; workshop.
          </p>
          <Link
            href={generateHref}
            className="mt-5 inline-flex items-center rounded-lg bg-accent px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Generate yours
          </Link>
          {card.refCode && (
            <p className="mt-3 text-xs text-white/55">
              Referred by code <span className="font-mono">{card.refCode}</span>. If you register, it counts towards
              their rewards.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
