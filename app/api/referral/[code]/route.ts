import { NextResponse } from "next/server";
import { jsonError, routeError } from "@/lib/http";
import { countReferrals } from "@/lib/referrals";
import { unlockedTiers } from "@/lib/rewards";
import { cleanRef } from "@/lib/tracking-shared";

// Live referral count for the hub page. Returns a number and tier ids only.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = cleanRef((await params).code);
    if (!code) return jsonError(400, "invalid_code", "That referral code is not valid.");
    const referrals = await countReferrals(code);
    return NextResponse.json({ referrals, unlocked: unlockedTiers(referrals) });
  } catch (err) {
    return routeError(err);
  }
}
