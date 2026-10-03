import "server-only";
import { REFERRALS_TO_UNLOCK } from "./config";
import { db, unwrap } from "./db";
import type { Evaluation } from "./evaluation";

// Competition state for one student. Nothing here is stored as a flag:
// eligibility is derived from verified referrals (friends who registered with
// this student's code), so it cannot drift from the data it depends on.
//
// Referral = qualification to enter. Project quality = ranking. The two are
// kept apart: the referral count is never part of a score.

export type Submission = {
  project_url: string;
  demo_url: string | null;
  summary: string;
  ai_usage: string;
  result: string;
  score: number | null;
  evaluation: Evaluation | null;
  created_at: string;
  updated_at: string;
};

export function isEligible(referrals: number): boolean {
  return referrals >= REFERRALS_TO_UNLOCK;
}

export async function getSubmission(registrationId: string): Promise<Submission | null> {
  return unwrap(
    await db()
      .from("submissions")
      .select("project_url, demo_url, summary, ai_usage, result, score, evaluation, created_at, updated_at")
      .eq("registration_id", registrationId)
      .maybeSingle(),
  ) as Submission | null;
}

// The student's journey, for the progress tracker.
//   done    – completed (verified by data)
//   current – the next thing to do
//   locked  – not available yet
//   info    – happens outside ProjectPitch (the workshop); never marked done,
//             because ProjectPitch does not host or verify the build.
export type StepState = "done" | "current" | "locked" | "info";
export type TrackerStep = { id: string; label: string; state: StepState; note?: string };

export function trackerSteps(referrals: number, submission: { score: number | null } | null): TrackerStep[] {
  const eligible = isEligible(referrals);
  const submitted = Boolean(submission);
  return [
    { id: "idea", label: "Project idea, 60-minute ready", state: "done" },
    { id: "registered", label: "Registered for the workshop", state: "done" },
    {
      id: "refer",
      label: "Refer 1 friend to qualify",
      state: eligible ? "done" : "current",
      note: eligible
        ? `${referrals} verified ${referrals === 1 ? "referral" : "referrals"} · competition unlocked`
        : "Counts when your friend registers",
    },
    { id: "build", label: "Build it at the workshop", state: "info", note: "The 60-minute build happens in the workshop" },
    {
      id: "submit",
      label: "Submit your project",
      state: submitted ? "done" : eligible ? "current" : "locked",
      note: submitted ? "Submitted" : eligible ? "Unlocked" : undefined,
    },
    {
      id: "showcase",
      label: "Evaluated and on Campus Builders",
      state: submitted ? "done" : "locked",
      note: submitted && submission?.score != null ? `Preliminary score ${submission.score}/100` : undefined,
    },
  ];
}
