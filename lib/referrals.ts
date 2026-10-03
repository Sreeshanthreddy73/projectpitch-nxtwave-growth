import "server-only";
import { db, unwrap } from "./db";

// Number of real registrations credited to a referral code.
export async function countReferrals(code: string): Promise<number> {
  const rows = unwrap(await db().from("registrations").select("id").eq("referred_by", code).eq("is_demo", false));
  return rows?.length ?? 0;
}
