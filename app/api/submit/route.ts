import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateSubmission } from "@/lib/ai";
import { getSubmission, isEligible } from "@/lib/competition";
import { db, unwrap } from "@/lib/db";
import { totalScore } from "@/lib/evaluation";
import { clientIp, jsonError, readJson, routeError } from "@/lib/http";
import { allow } from "@/lib/rate-limit";
import { countReferrals } from "@/lib/referrals";
import { getTracking, logEvent } from "@/lib/tracking";
import { cleanRef } from "@/lib/tracking-shared";

const httpsUrl = (tooLong: string) =>
  z
    .string()
    .trim()
    .max(300, tooLong)
    .pipe(z.url({ protocol: /^https$/, error: "Enter a link starting with https://" }));

const Input = z.object({
  project_url: httpsUrl("That link is too long."),
  demo_url: z.union([z.literal(""), httpsUrl("That link is too long.")]).default(""),
  summary: z.string().trim().max(280, "Keep this under 280 characters.").default(""),
  ai_usage: z.string().trim().max(400, "Keep this under 400 characters.").default(""),
  result: z.string().trim().max(400, "Keep this under 400 characters.").default(""),
});

// Submit (or update) a competition entry, and give it a preliminary evaluation.
//
// The student's hub code identifies them, the same way the hub page does.
// Eligibility is checked first, on the server: without at least one verified
// referral the request is refused, whatever the page shows.
//
// Referrals qualify a student to enter. They are never passed to the
// evaluation and never change the score.
export async function POST(request: Request) {
  try {
    if (!allow(`submit:${clientIp(request)}`, 10, 60_000)) {
      return jsonError(429, "rate_limited", "Too many attempts. Please wait a minute and try again.");
    }
    const body = (await readJson(request)) as Record<string, unknown> | null;
    const code = cleanRef(typeof body?.code === "string" ? body.code : null);
    if (!code) return jsonError(404, "not_found", "We couldn't find your registration.");

    const registration = unwrap(
      await db().from("registrations").select("id").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
    );
    if (!registration) return jsonError(404, "not_found", "We couldn't find your registration.");

    if (!isEligible(await countReferrals(code))) {
      return jsonError(403, "locked", "Refer 1 friend to qualify for the competition. It unlocks when they register.");
    }

    const input = Input.safeParse(body);
    if (!input.success) {
      const fields: Record<string, string> = {};
      for (const issue of input.error.issues) fields[String(issue.path[0])] ??= issue.message;
      return jsonError(400, "invalid_input", "Please check the highlighted fields.", { fields });
    }
    const entry = { ...input.data, demo_url: input.data.demo_url || null };

    const blueprint = unwrap(
      await db().from("blueprints").select("title").eq("registration_id", registration.id).maybeSingle(),
    );
    const evaluation = await evaluateSubmission({ title: blueprint?.title ?? "AI project", ...entry });
    const record = { ...entry, evaluation, score: totalScore(evaluation.criteria) };

    const existing = await getSubmission(registration.id);
    if (existing) {
      unwrap(
        await db()
          .from("submissions")
          .update({ ...record, updated_at: new Date().toISOString() })
          .eq("registration_id", registration.id),
      );
    } else {
      unwrap(await db().from("submissions").insert({ registration_id: registration.id, ...record, is_demo: false }));
      try {
        await logEvent("project_submission", await getTracking(), code);
      } catch (err) {
        console.warn("[submit] could not log event:", err instanceof Error ? err.message : err);
      }
    }
    return NextResponse.json({ ok: true, updated: Boolean(existing), score: record.score });
  } catch (err) {
    return routeError(err);
  }
}
