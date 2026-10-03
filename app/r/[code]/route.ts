import { NextResponse } from "next/server";
import { db, unwrap } from "@/lib/db";
import { cleanRef } from "@/lib/tracking-shared";

// Short referral link: /r/CODE → the referrer's public blueprint card, with
// ?ref=CODE so proxy.ts records the referral on that page load.
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const home = new URL("/", request.url);
  const code = cleanRef((await params).code);
  if (!code) return NextResponse.redirect(home);

  try {
    const registration = unwrap(
      await db().from("registrations").select("id").eq("ref_code", code).eq("is_demo", false).maybeSingle(),
    );
    if (!registration) return NextResponse.redirect(home);

    const blueprint = unwrap(
      await db().from("blueprints").select("id").eq("registration_id", registration.id).maybeSingle(),
    );
    const target = blueprint ? new URL(`/b/${blueprint.id}`, request.url) : home;
    target.searchParams.set("ref", code);
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(home);
  }
}
