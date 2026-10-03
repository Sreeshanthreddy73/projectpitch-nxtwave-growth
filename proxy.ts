import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE,
  COOKIE_MAX_AGE,
  cleanParam,
  cleanRef,
  isUuid,
  parseAttribution,
  type Attribution,
} from "@/lib/tracking-shared";

// Runs before every page request. It gives each visitor:
//   1. an anonymous session id,
//   2. a sticky A/B variant (?v=a or ?v=b forces one, for demos),
//   3. first-touch attribution from utm_* and ref parameters.
// Everything is stored in httpOnly cookies and read on the server, so the
// browser never has to send attribution itself.

export function proxy(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cookies = request.cookies;

  const existingSid = cookies.get(COOKIE.session)?.value;
  const sessionId = isUuid(existingSid) ? existingSid : crypto.randomUUID();

  const forced = params.get("v");
  const stored = cookies.get(COOKIE.variant)?.value;
  const variant =
    forced === "a" || forced === "b"
      ? forced
      : stored === "a" || stored === "b"
        ? stored
        : Math.random() < 0.5
          ? "a"
          : "b";

  // A visitor cannot be referred by their own code.
  const ownCode = cookies.get(COOKIE.ownCode)?.value;
  const ref = cleanRef(params.get("ref"));
  const validRef = ref && ref !== ownCode ? ref : null;

  let attribution: Attribution | null = parseAttribution(cookies.get(COOKIE.attribution)?.value);
  if (!attribution) {
    // First touch: remember where this visitor came from.
    attribution = {
      source: cleanParam(params.get("utm_source")) ?? (validRef ? "referral" : null),
      medium: cleanParam(params.get("utm_medium")),
      campaign: cleanParam(params.get("utm_campaign")),
      ref: validRef,
    };
  } else if (!attribution.ref && validRef) {
    // Source stays first-touch, but a later referral link still credits the referrer.
    attribution = { ...attribution, ref: validRef };
  }

  // Pass the variant to the page being rendered right now (the cookie only
  // becomes readable on the next request).
  const headers = new Headers(request.headers);
  headers.set("x-pp-variant", variant);
  const response = NextResponse.next({ request: { headers } });

  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
  response.cookies.set(COOKIE.session, sessionId, options);
  response.cookies.set(COOKIE.variant, variant, options);
  response.cookies.set(COOKIE.attribution, JSON.stringify(attribution), options);
  return response;
}

export const config = {
  // Pages only: skip API routes, Next internals and static files. The /r/CODE
  // short link is skipped too: it redirects to a page URL carrying ?ref=CODE,
  // and first-touch attribution must be recorded there, with the code present.
  matcher: ["/((?!api|r/|_next/static|_next/image|.*\\..*).*)"],
};
