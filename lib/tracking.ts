import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db, unwrap } from "./db";
import { COOKIE, isUuid, parseAttribution } from "./tracking-shared";

export type EventType = "visit" | "generate" | "register" | "share_click" | "card_view";

export type Tracking = {
  sessionId: string;
  hasSession: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ref_code: string | null;
  variant: "a" | "b" | null;
  ownCode: string | null;
};

// Reads the attribution cookies set by proxy.ts. Attribution always comes from
// here, never from a request body, so it survives the whole journey and cannot
// be changed by the page.
export async function getTracking(): Promise<Tracking> {
  const jar = await cookies();
  const sid = jar.get(COOKIE.session)?.value;
  const attribution = parseAttribution(jar.get(COOKIE.attribution)?.value);
  const variant = jar.get(COOKIE.variant)?.value;
  return {
    sessionId: isUuid(sid) ? sid : randomUUID(),
    hasSession: isUuid(sid),
    utm_source: attribution?.source ?? null,
    utm_medium: attribution?.medium ?? null,
    utm_campaign: attribution?.campaign ?? null,
    ref_code: attribution?.ref ?? null,
    variant: variant === "a" || variant === "b" ? variant : null,
    ownCode: jar.get(COOKIE.ownCode)?.value ?? null,
  };
}

export async function logEvent(type: EventType, t: Tracking): Promise<void> {
  unwrap(
    await db().from("events").insert({
      session_id: t.sessionId,
      type,
      utm_source: t.utm_source,
      utm_medium: t.utm_medium,
      utm_campaign: t.utm_campaign,
      ref_code: t.ref_code,
      variant: t.variant,
      is_demo: false,
    }),
  );
}
