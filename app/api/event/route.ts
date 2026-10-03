import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, jsonError, readJson, routeError } from "@/lib/http";
import { allow } from "@/lib/rate-limit";
import { getTracking, logEvent } from "@/lib/tracking";

// Events the browser may report. "generate" and "register" are logged by their
// own API routes, so they cannot be faked from here.
const Input = z.object({ type: z.enum(["visit", "share_click", "card_view"]) });

export async function POST(request: Request) {
  try {
    if (!allow(`event:${clientIp(request)}`, 60, 60_000)) {
      return jsonError(429, "rate_limited", "Too many requests.");
    }
    const input = Input.safeParse(await readJson(request));
    if (!input.success) return jsonError(400, "invalid_input", "Unknown event type.");
    await logEvent(input.data.type, await getTracking());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return routeError(err);
  }
}
