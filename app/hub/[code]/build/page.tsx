import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildMode } from "@/components/build-mode";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Eyebrow } from "@/components/ui";
import { buildPhases } from "@/lib/build-mode";
import { getSubmission, isEligible } from "@/lib/competition";
import { db, unwrap } from "@/lib/db";
import { countReferrals } from "@/lib/referrals";
import { cleanRef } from "@/lib/tracking-shared";
import type { PlanStep } from "@/lib/types";

// 60-Minute Build Mode: a prototype of the workshop engagement experience.
// Reached only from a registered student's hub. This page reads the student's
// blueprint and status; it writes nothing. The countdown itself runs entirely
// in the browser (components/build-mode.tsx).
export const metadata: Metadata = { title: "60-Minute Build Mode", robots: { index: false, follow: false } };

async function loadBuild(code: string) {
  const registration = unwrap(
    await db().from("registrations").select("id, ref_code").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
  );
  if (!registration) return null;
  const [blueprint, referrals, submission] = await Promise.all([
    db().from("blueprints").select("title, build_plan").eq("registration_id", registration.id).maybeSingle(),
    countReferrals(code),
    getSubmission(registration.id),
  ]);
  const plan = unwrap(blueprint) as { title: string; build_plan: PlanStep[] } | null;
  return plan ? { code: registration.ref_code as string, plan, eligible: isEligible(referrals), submitted: Boolean(submission) } : null;
}

export default async function BuildModePage({ params }: { params: Promise<{ code: string }> }) {
  const code = cleanRef((await params).code);
  if (!code) notFound();

  let build: Awaited<ReturnType<typeof loadBuild>>;
  try {
    build = await loadBuild(code);
  } catch (error) {
    return (
      <>
        <SiteHeader />
        <LoadFailure error={error} />
        <SiteFooter />
      </>
    );
  }
  if (!build) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10">
        <Link href={`/hub/${build.code}`} className="text-sm font-medium text-muted hover:text-ink">
          ← Back to your project
        </Link>
        <div className="mt-5">
          <Eyebrow className="text-accent-dark">Build Mode</Eyebrow>
          <h1 className="text-h1 mt-2">Build Your Project in 60 Minutes</h1>
          <p className="mt-3 max-w-xl text-body">
            Follow your blueprint against the clock. Start when the workshop starts, pause if you need to, and submit
            what you built when time is up.
          </p>
        </div>

        <div className="mt-8">
          <BuildMode
            code={build.code}
            title={build.plan.title}
            phases={buildPhases(build.plan.build_plan)}
            eligible={build.eligible}
            submitted={build.submitted}
          />
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Build Mode is a prototype of the workshop engagement experience. ProjectPitch does not host the NxtWave
          workshop. The timer is a challenge timer that runs in your browser: it does not verify that a project was
          built in 60 minutes, does not submit or complete anything, and does not affect competition eligibility or
          your evaluation score. The &ldquo;60-minute execution&rdquo; criterion needs human verification.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
