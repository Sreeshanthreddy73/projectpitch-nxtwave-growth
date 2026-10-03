import { NextResponse } from "next/server";
import { z } from "zod";
import { generateBlueprint } from "@/lib/ai";
import { db, unwrap } from "@/lib/db";
import { clientIp, jsonError, readJson, routeError } from "@/lib/http";
import { BRANCHES, INTEREST_IDS, SKILL_IDS, YEARS } from "@/lib/options";
import { allow } from "@/lib/rate-limit";
import { scoreReadiness } from "@/lib/readiness";
import { cleanIdea, scopeFor } from "@/lib/scope";
import { getTracking, logEvent } from "@/lib/tracking";
import type { BlueprintPreview } from "@/lib/types";

const Input = z.object({
  branch: z.enum(BRANCHES),
  year: z.enum(YEARS),
  skill_level: z.enum(SKILL_IDS),
  interest: z.enum(INTEREST_IDS),
  // Optional: the student's own idea, to be scoped down to a 60-minute MVP.
  idea: z.string().max(120).optional(),
});

// Creates a blueprint and returns ONLY the preview, plus its 60-minute
// readiness score and scope. The build plan and resume bullet stay in the
// database until /api/register succeeds.
export async function POST(request: Request) {
  try {
    if (!allow(`generate:${clientIp(request)}`, 8, 60_000)) {
      return jsonError(429, "rate_limited", "That's a lot of projects. Please wait a minute and try again.");
    }
    const input = Input.safeParse(await readJson(request));
    if (!input.success) {
      return jsonError(400, "invalid_input", "Please choose a branch, year, skill level and area of interest.");
    }
    const { idea: rawIdea, ...choices } = input.data;
    const idea = cleanIdea(rawIdea);

    db(); // surface missing configuration before doing any work
    const tracking = await getTracking();
    const { blueprint, generatedBy } = await generateBlueprint(choices, idea);

    const row = unwrap(
      await db()
        .from("blueprints")
        .insert({
          ...choices,
          ...blueprint,
          // only sent when present, so the request is unchanged for students who do not type an idea
          ...(idea ? { original_idea: idea } : {}),
          session_id: tracking.sessionId,
          generated_by: generatedBy,
          is_demo: false,
        })
        .select("id")
        .single(),
    );
    if (!row) throw new Error("blueprint insert returned no row");
    await logEvent("generate", tracking);

    const preview: BlueprintPreview = {
      id: row.id,
      title: blueprint.title,
      problem: blueprint.problem,
      stack: blueprint.stack,
      difficulty: blueprint.difficulty,
      locked_steps: blueprint.build_plan.length,
      readiness: scoreReadiness(blueprint),
      scope: scopeFor(idea, blueprint.title),
    };
    return NextResponse.json({ preview, generated_by: generatedBy });
  } catch (err) {
    return routeError(err);
  }
}
