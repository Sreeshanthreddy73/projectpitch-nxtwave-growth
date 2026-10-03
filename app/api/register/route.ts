import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, DbError, unwrap } from "@/lib/db";
import { clientIp, jsonError, readJson, routeError } from "@/lib/http";
import { allow } from "@/lib/rate-limit";
import { getTracking, logEvent } from "@/lib/tracking";
import { COOKIE, COOKIE_MAX_AGE } from "@/lib/tracking-shared";

const Input = z.object({
  blueprint_id: z.uuid(),
  name: z.string().trim().min(2, "Please enter your name.").max(80, "That name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160, "That email is too long.")
    .pipe(z.email("Please enter a valid email address.")),
  college: z.string().trim().min(2, "Please enter your college.").max(120, "That college name is too long."),
  consent: z.literal(true, "Please tick the box to continue."),
});

// No 0/O or 1/I, so codes are easy to read aloud and type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newRefCode(): string {
  const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return code.startsWith("DEMO") ? newRefCode() : code; // DEMO prefix is reserved for simulated rows
}

export async function POST(request: Request) {
  try {
    if (!allow(`register:${clientIp(request)}`, 10, 60_000)) {
      return jsonError(429, "rate_limited", "Too many attempts. Please wait a minute and try again.");
    }
    const input = Input.safeParse(await readJson(request));
    if (!input.success) {
      const fields: Record<string, string> = {};
      for (const issue of input.error.issues) fields[String(issue.path[0])] ??= issue.message;
      return jsonError(400, "invalid_input", "Please check the highlighted fields.", { fields });
    }
    const { blueprint_id, name, email, college } = input.data;
    const tracking = await getTracking();

    // The blueprint must belong to this browser session and be unclaimed.
    // Public card URLs expose blueprint ids, so the id alone must not unlock anything.
    const blueprint = unwrap(
      await db()
        .from("blueprints")
        .select("id, session_id, registration_id, branch, year")
        .eq("id", blueprint_id)
        .eq("is_demo", false)
        .maybeSingle(),
    );
    if (!blueprint || !tracking.hasSession || blueprint.session_id !== tracking.sessionId || blueprint.registration_id) {
      return jsonError(409, "blueprint_unavailable", "This blueprint has expired. Please generate a new one.");
    }

    // Credit the referrer only if the code is real and is not the visitor's own.
    let referredBy: string | null = null;
    if (tracking.ref_code && tracking.ref_code !== tracking.ownCode) {
      const referrer = unwrap(
        await db().from("registrations").select("ref_code").eq("ref_code", tracking.ref_code).eq("is_demo", false).maybeSingle(),
      );
      referredBy = referrer?.ref_code ?? null;
    }

    let code = "";
    for (let attempt = 0; ; attempt++) {
      code = newRefCode();
      const result = await db()
        .from("registrations")
        .insert({
          name,
          email,
          college,
          branch: blueprint.branch,
          year: blueprint.year,
          ref_code: code,
          referred_by: referredBy,
          utm_source: tracking.utm_source,
          utm_medium: tracking.utm_medium,
          utm_campaign: tracking.utm_campaign,
          variant: tracking.variant,
          consent_at: new Date().toISOString(),
          is_demo: false,
        })
        .select("id")
        .single();

      if (!result.error) {
        unwrap(await db().from("blueprints").update({ registration_id: result.data.id }).eq("id", blueprint.id));
        break;
      }
      // 23505 = unique violation: either the email is taken or (rarely) the code collided.
      if (result.error.code === "23505" && result.error.message.includes("email")) {
        return jsonError(409, "already_registered", "This email is already registered.", {
          fields: { email: "This email is already registered." },
        });
      }
      if (result.error.code === "23505" && attempt < 3) continue;
      throw new DbError(result.error.code ?? "unknown", result.error.message);
    }

    await logEvent("register", tracking);

    const response = NextResponse.json({ code });
    response.cookies.set(COOKIE.ownCode, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    return routeError(err);
  }
}
