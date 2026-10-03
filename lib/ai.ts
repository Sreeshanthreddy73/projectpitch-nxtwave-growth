import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fallbackBlueprint } from "./fallback";
import { fallbackInsights } from "./insights-fallback";
import type { InsightSnapshot } from "./metrics";
import { INTERESTS, SKILL_LEVELS } from "./options";
import type { Blueprint, BlueprintInput, GeneratedBy, InsightContent } from "./types";

// The single integration point for AI. The rest of the app calls these two
// functions and never knows whether the answer came from the model or from the
// deterministic fallback.
//
//   ANTHROPIC_API_KEY unset  -> fallback, no network call
//   API error / timeout / bad output -> fallback
//
// Adding a key later switches on live AI with no other code change.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(timeoutMs: number): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: timeoutMs, maxRetries: 0 });
}

// Low effort keeps latency down for these short, structured tasks. Haiku
// models do not accept the effort parameter, so it is omitted for them.
const effort = MODEL.includes("haiku") ? {} : { effort: "low" as const };

function logFailure(task: string, err: unknown) {
  const reason = err instanceof Anthropic.APIError ? `${err.status} ${err.name}` : err instanceof Error ? err.message : "unknown";
  console.warn(`[ai] ${task} failed (${reason}); using deterministic fallback`);
}

// --- Blueprint ---------------------------------------------------------------

const BlueprintSchema = z.object({
  title: z.string(),
  problem: z.string(),
  stack: z.array(z.string()),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  build_plan: z.array(z.object({ minutes: z.number(), step: z.string() })),
  resume_bullet: z.string(),
});

const BLUEPRINT_SYSTEM = `You design first AI projects for Indian engineering students preparing for campus placements.

Given a student's branch, year, skill level and area of interest, write one project blueprint they could build in a 60-minute guided workshop and then put on their resume.

Requirements:
- title: a short product-style name, at most 5 words.
- problem: 2-3 sentences. A real problem a student would recognise, and what the project does about it. Tie it to the student's branch where that is natural.
- stack: 3-5 specific, free or free-tier tools appropriate to the skill level.
- difficulty: match the student's stated skill level.
- build_plan: 4-6 steps whose minutes add up to exactly 60. Each step is one concrete action.
- resume_bullet: one line in resume style. Use bracketed placeholders like [N] or [X]% wherever a number must come from the student's own measurement. Never invent results.

Write plainly. No hype words.`;

function blueprintIsUsable(b: Blueprint): boolean {
  const minutes = b.build_plan.reduce((sum, s) => sum + s.minutes, 0);
  return (
    b.title.trim().length > 0 &&
    b.title.length <= 80 &&
    b.problem.length >= 40 &&
    b.stack.length >= 2 &&
    b.stack.length <= 8 &&
    b.build_plan.length >= 3 &&
    b.build_plan.length <= 8 &&
    minutes >= 50 &&
    minutes <= 70 &&
    b.resume_bullet.length >= 30
  );
}

export async function generateBlueprint(
  input: BlueprintInput,
): Promise<{ blueprint: Blueprint; generatedBy: GeneratedBy }> {
  if (aiConfigured()) {
    try {
      const skill = SKILL_LEVELS.find((s) => s.id === input.skill_level)!;
      const interest = INTERESTS.find((i) => i.id === input.interest)!;
      const response = await client(15_000).messages.parse({
        model: MODEL,
        max_tokens: 4000,
        system: BLUEPRINT_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Branch: ${input.branch}\nYear: ${input.year}\nSkill level: ${skill.label} (${skill.hint})\nArea of interest: ${interest.label}`,
          },
        ],
        output_config: { format: zodOutputFormat(BlueprintSchema), ...effort },
      });
      const blueprint = response.parsed_output;
      if (response.stop_reason === "end_turn" && blueprint && blueprintIsUsable(blueprint)) {
        return { blueprint, generatedBy: "ai" };
      }
      logFailure("blueprint", new Error(`unusable output (stop_reason: ${response.stop_reason})`));
    } catch (err) {
      logFailure("blueprint", err);
    }
  }
  return { blueprint: fallbackBlueprint(input), generatedBy: "fallback" };
}

// --- Growth insights ---------------------------------------------------------

const InsightSchema = z.object({
  working: z.object({ headline: z.string(), detail: z.string() }),
  leaking: z.object({ headline: z.string(), detail: z.string() }),
  next_actions: z.array(z.object({ action: z.string(), why: z.string(), metric: z.string() })),
});

const INSIGHTS_SYSTEM = `You are a growth analyst reviewing a 7-day student-registration campaign for a workshop. You receive aggregated funnel metrics as JSON. There is no row-level or personal data, and you must not ask for any.

Return:
- working: the channel, campaign or variant that is performing best, with the metric that shows it.
- leaking: the funnel step losing the most users relative to the planning assumptions, with the numbers.
- next_actions: 2 or 3 specific experiments or actions for the next 24 hours. For each: the action, why (citing a number from the data), and the one metric it should move.

Rules:
- Quote only numbers present in the JSON. Do not estimate or invent figures.
- The "ab_test.verdict" field is computed statistically in code. Repeat its conclusion; never declare a winner it does not declare.
- Do not rank a source or campaign that has fewer visitors than "min_visitors_to_rank"; say there is not enough data instead.
- These are recommendations for a human to accept or reject. Do not say anything has been changed.
- Money is in Indian rupees. Be concrete and brief: one or two sentences per field.`;

export async function generateInsights(
  snapshot: InsightSnapshot,
): Promise<{ insight: InsightContent; generatedBy: GeneratedBy }> {
  if (aiConfigured()) {
    try {
      const response = await client(30_000).messages.parse({
        model: MODEL,
        max_tokens: 4000,
        system: INSIGHTS_SYSTEM,
        // Only the aggregate snapshot is sent. It is built from a whitelist of
        // counts and rates in lib/metrics.ts and contains no names or emails.
        messages: [{ role: "user", content: JSON.stringify(snapshot) }],
        output_config: { format: zodOutputFormat(InsightSchema), ...effort },
      });
      const insight = response.parsed_output;
      if (
        response.stop_reason === "end_turn" &&
        insight &&
        insight.next_actions.length >= 1 &&
        insight.working.headline &&
        insight.leaking.headline
      ) {
        return { insight: { ...insight, next_actions: insight.next_actions.slice(0, 3) }, generatedBy: "ai" };
      }
      logFailure("insights", new Error(`unusable output (stop_reason: ${response.stop_reason})`));
    } catch (err) {
      logFailure("insights", err);
    }
  }
  return { insight: fallbackInsights(snapshot), generatedBy: "fallback" };
}
