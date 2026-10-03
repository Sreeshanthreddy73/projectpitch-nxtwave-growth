import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminConfigured, createSessionToken, passwordMatches } from "@/lib/auth";
import { clientIp, jsonError, readJson } from "@/lib/http";
import { allow } from "@/lib/rate-limit";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return jsonError(503, "admin_not_configured", "Set ADMIN_PASSWORD in .env.local and restart the server.");
  }
  if (!allow(`login:${clientIp(request)}`, 5, 60_000)) {
    return jsonError(429, "rate_limited", "Too many attempts. Please wait a minute.");
  }
  const body = (await readJson(request)) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || !passwordMatches(body.password)) {
    return jsonError(401, "wrong_password", "That password is not correct.");
  }
  const { value, maxAge } = createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, value, { ...cookieOptions, maxAge });
  return response;
}

// Sign out.
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
