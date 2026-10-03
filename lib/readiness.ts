import { CRITERIA, type CriterionId, type ScoreLine } from "./config";
import type { Blueprint } from "./types";

// 60-Minute Build Readiness.
//
// A rule-based check of how well a PROJECT is scoped for a 60-minute MVP,
// using the same five dimensions as the proposed judging criteria. It scores
// the plan, not the student: it does not predict whether someone will finish.
//
// It is deterministic and runs on every blueprint, whether the blueprint came
// from the AI model or from the built-in templates, so the model never grades
// its own work. No plan gets full marks: some points can only be earned by
// actually building it.

export type Readiness = { total: number; lines: ScoreLine[] };

const has = (text: string, pattern: RegExp) => pattern.test(text);

const AI_PARTS = /llm|gpt|claude|gemini|whisper|yolo|transformer|embedding|scikit|xgboost|lightgbm|pytorch|tensorflow|vision|speech|model|pyannote|faiss|chroma/i;
const UI_PARTS = /streamlit|gradio|react|html/i;
const HEAVY_PARTS = /docker|postgres|redis|pytorch|kubernetes|react|faiss|pyannote|gmail|search api/i;
const MEASURES = /test|accuracy|precision|recall|measure|error rate|hit rate|mae|auc|by hand|record/i;
const GROUNDED = /only from|refus|schema|structured|cit|retriev|fine-tun|threshold|held-out|baseline/i;

export function scoreReadiness(b: Blueprint): Readiness {
  const stack = b.stack.join(" ");
  const plan = b.build_plan.map((s) => s.step).join(" ");
  const longest = Math.max(...b.build_plan.map((s) => s.minutes));
  const heavy = b.stack.filter((tool) => has(tool, HEAVY_PARTS)).length;
  const level = b.difficulty === "Advanced" ? 2 : b.difficulty === "Intermediate" ? 1 : 0;
  const lean = b.stack.length <= 4;
  const screen = has(stack, UI_PARTS);
  const measured = has(plan, MEASURES);

  const score: Record<CriterionId, { value: number; note: string }> = {
    // Is the plan a working end-to-end slice, with a surface to run it on and a check that it works?
    functionality: {
      value: 20 + (screen ? 3 : 0) + (measured ? 3 : 0) + (lean ? 2 : 0) - [0, 1, 3][level],
      note: measured ? "An end-to-end slice with a step that checks it works." : "Add one step that checks the result is right.",
    },
    // Is AI the core of the project, and is its output checked or grounded?
    ai: {
      value: 15 + (has(stack, AI_PARTS) ? 4 : 0) + (measured ? 2 : 0) + (has(plan, GROUNDED) ? 3 : 0),
      note: has(plan, GROUNDED) ? "AI does the core work and its output is checked." : "AI does the core work. Add a check on its output.",
    },
    // Is the problem specific and recognisable, and is the outcome something you can state?
    usefulness: {
      value: 12 + (b.problem.length >= 140 ? 2 : 0) + (has(b.problem, /student|campus|college|placement|class|lab|interview/i) ? 2 : 0) + (has(b.resume_bullet, /\[[A-Z]\]/) ? 2 : 0),
      note: "A specific problem with a result you can state in one line.",
    },
    // Does the scope fit the hour?
    sixty: {
      value: 13 + (lean ? 1 : 0) - (b.build_plan.length > 5 ? 2 : 0) - (longest > 15 ? 1 : 0) - (longest > 20 ? 1 : 0) - Math.min(heavy * 2, 4) - [0, 1, 3][level],
      note:
        heavy > 0 || level === 2
          ? "Tight for one hour: heavier tools or advanced steps. Set up your tools before the workshop."
          : "Five steps or fewer and a small stack. Fits the hour if setup goes smoothly.",
    },
    // Can it be shown working in under a minute?
    demo: {
      value: 5 + (screen ? 3 : 0) + (has(plan, /deploy|demo|page|screen/i) ? 1 : 0),
      note: screen ? "Has a simple screen you can show." : "Add a simple screen so it can be demoed.",
    },
  };

  const lines = CRITERIA.map((criterion) => ({
    ...criterion,
    score: Math.max(Math.round(criterion.max * 0.3), Math.min(criterion.max, Math.round(score[criterion.id].value))),
    note: score[criterion.id].note,
  }));
  return { total: lines.reduce((sum, line) => sum + line.score, 0), lines };
}
