import { CRITERIA, type CriterionId, type ScoreLine } from "./config";

// Preliminary evaluation of a submitted project.
//
// The five criteria and weights are PROPOSED campaign judging criteria, not
// official NxtWave criteria. This rule-based version is used when no AI key is
// configured or the AI call fails. It reads only what the student wrote and
// linked; it does not open the project, so it cannot verify that the project
// works or that it was built in 60 minutes. It is a first pass for human
// judges, not a decision.
//
// The Build Mode timer is never an input here: it runs in the browser and is
// not sent to the server.

export type SubmissionText = {
  title: string;
  project_url: string;
  demo_url: string | null;
  summary: string;
  ai_usage: string;
  result: string;
};

export type Evaluation = { criteria: ScoreLine[]; generated_by: "ai" | "fallback" };

const has = (text: string, pattern: RegExp) => pattern.test(text);
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));
// 0..1 for how much was written, saturating at `full` characters.
const depth = (text: string, full: number) => Math.min(text.trim().length / full, 1);

// Two criteria cannot be confirmed from text alone, so an automated pass (AI
// or rules) never awards them full marks: a judge has to open the project.
export const AUTOMATED_CEILING: Partial<Record<CriterionId, number>> = { functionality: 27, sixty: 12 };
export const SIXTY_NEEDS_HUMAN = "Needs human verification.";

export function totalScore(criteria: ScoreLine[]): number {
  return criteria.reduce((sum, line) => sum + line.score, 0);
}

export function fallbackEvaluation(s: SubmissionText): Evaluation {
  const all = `${s.summary} ${s.ai_usage} ${s.result}`;
  const codeHost = has(s.project_url, /github\.com|gitlab\.com|huggingface\.co|colab\.research\.google|replit\.com|kaggle\.com/i);
  const numbers = has(s.result, /\d/);

  const score: Record<CriterionId, { value: number; note: string }> = {
    functionality: {
      value: 8 + (codeHost ? 6 : 2) + (s.demo_url ? 6 : 0) + depth(s.result, 120) * 6 + (has(s.result, /work|run|tested|pass|correct|accura/i) ? 4 : 0),
      note: s.demo_url
        ? "Code and a demo link are provided. A judge still needs to open them."
        : "No demo link: add one so the project can be seen working.",
    },
    ai: {
      value: 5 + depth(s.ai_usage, 140) * 10 + (has(s.ai_usage, /llm|gpt|claude|gemini|whisper|yolo|model|embedding|classifier|prompt|fine-?tun|rag|retriev|api/i) ? 6 : 0) + (has(all, /prompt|threshold|evaluat|refus|ground|schema|accura|precision/i) ? 4 : 0),
      note: s.ai_usage.trim().length >= 40 ? "Explains how AI is used in the project." : "Say which model or API you used and what it does in the project.",
    },
    usefulness: {
      value: 5 + depth(s.summary, 160) * 9 + (has(s.summary, /student|user|team|people|class|campus|customer|patient|teacher/i) ? 3 : 0) + (has(s.summary, /because|so that|instead of|problem|saves|faster|easier/i) ? 3 : 0),
      note: s.summary.trim().length >= 60 ? "Describes who it is for and what problem it solves." : "Describe the problem and who has it in two sentences.",
    },
    sixty: {
      value: 5 + (has(all, /mvp|scope|left out|cut|only|first version|in 60|one hour|within the hour|workshop/i) ? 5 : 0) + depth(s.result, 100) * 3 + (numbers ? 2 : 0),
      note: "Needs human verification. Based only on what you say you finished and left out; the Build Mode timer is not evidence.",
    },
    demo: {
      value: 2 + (s.demo_url ? 4 : 0) + depth(all, 320) * 3 + (numbers ? 1 : 0),
      note: s.demo_url ? "Has a demo link and a written explanation." : "A short demo video or live link would raise this.",
    },
  };

  return {
    criteria: CRITERIA.map((criterion) => ({
      ...criterion,
      score: clamp(score[criterion.id].value, AUTOMATED_CEILING[criterion.id] ?? criterion.max),
      note: score[criterion.id].note,
    })),
    generated_by: "fallback",
  };
}
