import { NextResponse } from "next/server";
import { z } from "zod";
import { getSubmission, isEligible } from "@/lib/competition";
import { db, unwrap } from "@/lib/db";
import { clientIp, jsonError, readJson, routeError } from "@/lib/http";
import { allow } from "@/lib/rate-limit";
import { countReferrals } from "@/lib/referrals";
import { getTracking, logEvent } from "@/lib/tracking";
import { cleanRef } from "@/lib/tracking-shared";

const Input = z.object({
  code: z.string(),
  project_url: z
    .string()
    .trim()
    .max(300, "That link is too long.")
    .pipe(z.url({ protocol: /^https$/, error: "Enter a link starting with https://" })),
  summary: z.string().trim().max(280, "Keep the description under 280 characters.").default(""),
});

// Submit (or update) a competition entry.
// The student's hub code identifies them, the same way the hub page does.
// Eligibility is checked here on the server: without at least one verified
// referral the request is refused, whatever the page shows.
export async function POST(request: Request) {
  try {
    if (!allow(`submit:${clientIp(request)}`, 10, 60_000)) {
      return jsonError(429, "rate_limited", "Too many attempts. Please wait a minute and try again.");
    }
    const input = Input.safeParse(await readJson(request));
    if (!input.success) {
      const fields: Record<string, string> = {};
      for (const issue of input.error.issues) fields[String(issue.path[0])] ??= issue.message;
      return jsonError(400, "invalid_input", "Please check the highlighted fields.", { fields });
    }
    const code = cleanRef(input.data.code);
    if (!code) return jsonError(404, "not_found", "We couldn't find your registration.");

    const registration = unwrap(
      await db().from("registrations").select("id").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
    );
    if (!registration) return jsonError(404, "not_found", "We couldn't find your registration.");

    if (!isEligible(await countReferrals(code))) {
      return jsonError(403, "locked", "Refer 1 friend to unlock your competition entry. It unlocks when they register.");
    }

    const { project_url, summary } = input.data;
    const existing = await getSubmission(registration.id);
    if (existing) {
      unwrap(
        await db()
          .from("submissions")
          .update({ project_url, summary, updated_at: new Date().toISOString() })
          .eq("registration_id", registration.id),
      );
    } else {
      unwrap(
        await db().from("submissions").insert({ registration_id: registration.id, project_url, summary, is_demo: false }),
      );
      try {
        await logEvent("project_submission", await getTracking(), code);
      } catch (err) {
        console.warn("[submit] could not log event:", err instanceof Error ? err.message : err);
      }
    }
    return NextResponse.json({ ok: true, updated: Boolean(existing) });
  } catch (err) {
    return routeError(err);
  }
}
