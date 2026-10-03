import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BlueprintMeta, StackList } from "@/components/blueprint-view";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Track } from "@/components/track";
import { ArrowIcon, SparkIcon, buttonClass } from "@/components/ui";
import { shortProblem } from "@/lib/blueprint-text";
import { SITE_NAME } from "@/lib/config";
import { db, unwrap } from "@/lib/db";
import { isUuid } from "@/lib/tracking-shared";
import type { Blueprint } from "@/lib/types";

// Public project card: the thing students share. It selects only the four
// preview fields plus the owner's referral code (used in the link, never
// displayed). No name, email or college is queried, so none can leak.

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const card = isUuid(id) ? await loadCard(id) : null;
    if (!card) return { title: "Project not found" };
    const description = `${shortProblem(card.problem)} Generate your own AI project in 30 seconds.`;
    return {
      title: `${card.title} — an AI project made with ${SITE_NAME}`,
      description,
      openGraph: { title: `${card.title} — an AI project made with ${SITE_NAME}`, description },
    };
  } catch {
    return { title: "AI project" };
  }
}

export default async function ProjectCardPage({ params }: { params: Promise<{ id: string }> }) {
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

  // The referral code rides in the link so the referrer is credited even if
  // this page was opened without ?ref. It is not shown on the page.
  const generateHref = card.refCode ? `/?ref=${card.refCode}#generator` : "/#generator";

  return (
    <>
      <Track type="card_view" />
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-xl px-5 pb-24 pt-12">
          <p className="text-center text-[15px] font-medium text-body">Someone created this AI project.</p>

          <div className="relative mt-6">
            <div aria-hidden className="absolute -inset-5 rounded-[2.5rem] bg-ai/15 blur-3xl" />
            <article className="relative animate-rise rounded-3xl bg-ink p-7 text-white shadow-lift sm:p-9">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow text-white/55">{SITE_NAME}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ai/25 px-2.5 py-1 text-[11px] font-medium text-[#cfc6ff]">
                  <SparkIcon className="size-3" /> AI project blueprint
                </span>
              </div>
              <h1 className="mt-6 font-display text-[32px] font-bold leading-[1.08] tracking-tight text-white sm:text-[40px]">
                {card.title}
              </h1>
              <p className="mt-4 text-[17px] leading-relaxed text-white/75">{shortProblem(card.problem)}</p>
              <div className="mt-6">
                <BlueprintMeta difficulty={card.difficulty} onDark />
              </div>
              <div className="mt-6">
                <p className="eyebrow text-white/50">Stack</p>
                <div className="mt-2.5">
                  <StackList stack={card.stack} onDark />
                </div>
              </div>
            </article>
          </div>

          <div className="mt-10 text-center">
            <h2 className="text-h2">What would your project be?</h2>
            <p className="mx-auto mt-2 max-w-sm text-body">
              Answer three questions and get an AI project matched to you, with a 60-minute build roadmap.
            </p>
            <Link href={generateHref} className={buttonClass("primary", "lg", "mt-6")}>
              Generate My Own Project <ArrowIcon />
            </Link>
            <p className="mt-3 text-sm text-muted">No experience? Start anyway.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
