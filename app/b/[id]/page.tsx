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

// Public project card: the object students share.
//
// Before submission it shows only the project idea (title, short problem,
// stack, difficulty) and nothing about the student.
// After submission it becomes "I built X": it adds what the student wrote in
// their submission, their links, and their first name and college, which they
// agreed to make public when submitting. Email is never queried.
//
// The owner's referral code rides in the "Build Yours" link, so a friend who
// registers is credited to the student who shared.

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
  const { title, problem, stack, difficulty } = blueprint as Pick<Blueprint, "title" | "problem" | "stack" | "difficulty">;
  const card = { title, problem, stack, difficulty, refCode: null as string | null, built: null as null | Built };
  if (!blueprint.registration_id) return card;

  const [owner, submission] = await Promise.all([
    db().from("registrations").select("ref_code, name, college").eq("id", blueprint.registration_id).maybeSingle(),
    db()
      .from("submissions")
      .select("summary, result, project_url, demo_url, score")
      .eq("registration_id", blueprint.registration_id)
      .maybeSingle(),
  ]);
  const student = unwrap(owner);
  const entry = unwrap(submission);
  card.refCode = student?.ref_code ?? null;
  if (student && entry) {
    card.built = {
      firstName: String(student.name).trim().split(/\s+/)[0],
      college: student.college,
      summary: entry.summary,
      result: entry.result,
      projectUrl: entry.project_url,
      demoUrl: entry.demo_url,
      score: entry.score,
    };
  }
  return card;
});

type Built = {
  firstName: string;
  college: string;
  summary: string;
  result: string;
  projectUrl: string;
  demoUrl: string | null;
  score: number | null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const card = isUuid(id) ? await loadCard(id) : null;
    if (!card) return { title: "Project not found" };
    const title = card.built ? `I built ${card.title} with AI` : `${card.title} — an AI project idea`;
    const description = `${card.built?.summary || shortProblem(card.problem)} Build yours with ${SITE_NAME}.`;
    return { title, description, openGraph: { title, description } };
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

  const { built } = card;
  const buildHref = card.refCode ? `/?ref=${card.refCode}#generator` : "/#generator";

  return (
    <>
      <Track type="card_view" />
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-xl px-5 pb-24 pt-12">
          <div className="text-center">
            <h1 className="text-h2">
              {built
                ? `${built.firstName} built this at the AI workshop.`
                : card.refCode
                  ? "You were invited to build an AI project."
                  : "Someone is building this AI project."}
            </h1>
            <p className="mt-2 text-[15px] text-body">
              {built
                ? "A real project by a student like you. Get your own idea and build yours."
                : "A classmate is building the project below. Get your own idea, register, and build it in 60 minutes."}
            </p>
          </div>

          <div className="relative mt-6">
            <div aria-hidden className="absolute -inset-5 rounded-[2.5rem] bg-ai/15 blur-3xl" />
            <article className="relative animate-rise rounded-3xl bg-ink p-7 text-white shadow-lift sm:p-9">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow text-white/55">{SITE_NAME}</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ai/25 px-2.5 py-1 text-[11px] font-medium text-[#cfc6ff]">
                  <SparkIcon className="size-3" /> {built ? "Built with AI" : "AI project idea"}
                </span>
              </div>

              {built && <p className="mt-6 text-[15px] font-medium text-white/70">I built</p>}
              <h2 className={`font-display text-[32px] font-bold leading-[1.08] tracking-tight text-white sm:text-[40px] ${built ? "mt-1" : "mt-6"}`}>
                {card.title}
              </h2>
              {built && <p className="mt-1 text-[15px] font-medium text-white/70">in the NxtWave AI workshop.</p>}

              <p className="mt-4 text-[17px] leading-relaxed text-white/75">{built?.summary || shortProblem(card.problem)}</p>

              {built?.result && (
                <div className="mt-5 rounded-2xl bg-white/[0.06] p-4">
                  <p className="eyebrow text-white/50">Result</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">{built.result}</p>
                </div>
              )}

              <div className="mt-6">
                <BlueprintMeta difficulty={card.difficulty} onDark />
              </div>
              <div className="mt-6">
                <p className="eyebrow text-white/50">AI stack</p>
                <div className="mt-2.5">
                  <StackList stack={card.stack} onDark />
                </div>
              </div>

              {built && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                  <p className="text-sm text-white/75">
                    <span className="font-semibold text-white">{built.firstName}</span> · {built.college}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                    {built.demoUrl && (
                      <a href={built.demoUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-white underline underline-offset-4 hover:text-[#cfc6ff]">
                        Demo
                      </a>
                    )}
                    <a href={built.projectUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-white underline underline-offset-4 hover:text-[#cfc6ff]">
                      Project
                    </a>
                  </div>
                </div>
              )}
            </article>
          </div>

          <div className="mt-10 text-center">
            <h2 className="text-h2">What would you build?</h2>
            <p className="mx-auto mt-2 max-w-sm text-body">
              Answer three questions, get an AI project idea scoped for 60 minutes, and register for the workshop.
            </p>
            <Link href={buildHref} className={buttonClass("primary", "lg", "mt-6")}>
              Build Yours <ArrowIcon />
            </Link>
            <p className="mt-3 text-sm text-muted">No experience? Start anyway.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
