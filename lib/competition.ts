import "server-only";
import { REFERRALS_TO_UNLOCK } from "./config";
import { db, unwrap } from "./db";

// Competition state for one student. Nothing here is stored as a flag:
// eligibility is derived from verified referrals (friends who registered with
// this student's code), so it cannot drift from the data it depends on.

export type Submission = { project_url: string; summary: string; created_at: string; updated_at: string };

export function isEligible(referrals: number): boolean {
  return referrals >= REFERRALS_TO_UNLOCK;
}

export async function getSubmission(registrationId: string): Promise<Submission | null> {
  return unwrap(
    await db()
      .from("submissions")
      .select("project_url, summary, created_at, updated_at")
      .eq("registration_id", registrationId)
      .maybeSingle(),
  ) as Submission | null;
}

// The five steps of the student's journey, for the progress tracker.
export type StepState = "done" | "current" | "locked";
export type TrackerStep = { id: string; label: string; state: StepState; note?: string };

export function trackerSteps(referrals: number, submitted: boolean): TrackerStep[] {
  const eligible = isEligible(referrals);
  return [
    { id: "created", label: "Project created", state: "done" },
    { id: "registered", label: "Registration complete", state: "done" },
    {
      id: "refer",
      label: "Refer 1 friend",
      state: eligible ? "done" : "current",
      note: eligible
        ? `${referrals} verified ${referrals === 1 ? "referral" : "referrals"}`
        : "Counts when your friend registers",
    },
    { id: "entry", label: "Competition entry", state: eligible ? "done" : "locked", note: eligible ? "Unlocked" : undefined },
    {
      id: "submit",
      label: "Project submission",
      state: submitted ? "done" : eligible ? "current" : "locked",
      note: submitted ? "Submitted" : eligible ? "Unlocked" : undefined,
    },
  ];
}
