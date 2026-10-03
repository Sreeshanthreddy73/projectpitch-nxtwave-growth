import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Single-password admin gate. The session cookie is "<expiry>.<hmac>", signed
// with the admin password itself, so there is no extra secret to manage and
// changing the password signs everyone out.

export const ADMIN_COOKIE = "pp_admin";
const SESSION_HOURS = 12;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(expiry: string): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD!).update(`admin.${expiry}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(input: string): boolean {
  return adminConfigured() && safeEqual(input, process.env.ADMIN_PASSWORD!);
}

export function createSessionToken(): { value: string; maxAge: number } {
  const maxAge = SESSION_HOURS * 3600;
  const expiry = String(Date.now() + maxAge * 1000);
  return { value: `${expiry}.${sign(expiry)}`, maxAge };
}

export function tokenIsValid(token: string | undefined): boolean {
  if (!token || !adminConfigured()) return false;
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature || Number(expiry) < Date.now()) return false;
  return safeEqual(signature, sign(expiry));
}

export async function isAdmin(): Promise<boolean> {
  return tokenIsValid((await cookies()).get(ADMIN_COOKIE)?.value);
}
