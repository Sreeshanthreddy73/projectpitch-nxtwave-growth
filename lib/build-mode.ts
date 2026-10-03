import type { PlanStep } from "./types";

// 60-Minute Build Mode: pure helpers for the workshop timer.
//
// Build Mode is a prototype of the workshop engagement experience. The timer
// is an engagement mechanism that runs in the student's browser. It is not
// sent to the server, it does not prove a project was built in 60 minutes,
// and it has no effect on competition eligibility or evaluation scores.

export const BUILD_MINUTES = 60;
export const BUILD_MS = BUILD_MINUTES * 60_000;

const PHASE_NAMES = ["Setup", "AI integration", "Core functionality", "Interface + testing", "Demo preparation"];

export type BuildPhase = { name: string; detail: string; startMin: number; endMin: number };

// Turns the student's blueprint into timed phases covering exactly 60 minutes.
// A five-step plan gets the five workshop phase names; the minutes and the
// instructions are the student's own.
export function buildPhases(plan: PlanStep[]): BuildPhase[] {
  const total = plan.reduce((sum, step) => sum + step.minutes, 0) || 1;
  let elapsed = 0;
  return plan.map((step, i) => {
    const startMin = Math.round((elapsed / total) * BUILD_MINUTES);
    elapsed += step.minutes;
    const endMin = i === plan.length - 1 ? BUILD_MINUTES : Math.round((elapsed / total) * BUILD_MINUTES);
    const name = plan.length === PHASE_NAMES.length ? PHASE_NAMES[i] : `Step ${i + 1}`;
    // Plans made from a typed idea already start each step with the phase name.
    const detail = step.step.replace(/^(setup|ai integration|core functionality|interface and testing|demo preparation):\s*/i, "");
    return { name, detail: detail.charAt(0).toUpperCase() + detail.slice(1), startMin, endMin };
  });
}

// Index of the phase the given elapsed time falls in.
export function phaseIndexAt(phases: BuildPhase[], elapsedMs: number): number {
  const minutes = elapsedMs / 60_000;
  const index = phases.findIndex((phase) => minutes < phase.endMin);
  return index === -1 ? phases.length - 1 : index;
}

// "47:32"
export function formatClock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
