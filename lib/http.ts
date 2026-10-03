import "server-only";
import { NextResponse } from "next/server";
import { describeSetupProblem } from "./db";

export function jsonError(status: number, error: string, message: string, extra?: object) {
  return NextResponse.json({ error, message, ...extra }, { status });
}

export const UNAVAILABLE_MESSAGE = "Project generator temporarily unavailable. Please try again shortly.";

// Writes setup instructions to the server log, where the developer will see them.
export function logSetupProblem(err: unknown): boolean {
  const setup = describeSetupProblem(err);
  if (!setup) return false;
  const steps = setup.steps.map((step, i) => `  ${i + 1}. ${step}`);
  console.warn([`[setup] ${setup.title}`, ...steps].join("\n"));
  return true;
}

// Last-resort handler for route handlers.
//
// Setup problems (missing env vars, missing tables, unreachable database) are
// developer diagnostics, so who sees them depends on the audience:
//   "public" – students get a short, friendly message; the exact steps go to
//              the server log.
//   "admin"  – the signed-in dashboard gets the steps in the response.
// Anything else is a generic 500 with details kept in the server log.
export function routeError(err: unknown, audience: "public" | "admin" = "public") {
  const setup = describeSetupProblem(err);
  if (setup) {
    if (audience === "admin") return jsonError(503, "setup_required", setup.title, { steps: setup.steps });
    logSetupProblem(err);
    return jsonError(503, "unavailable", UNAVAILABLE_MESSAGE);
  }
  console.error("[api] unexpected error:", err instanceof Error ? err.message : err);
  return jsonError(500, "server_error", "Something went wrong on our side. Please try again.");
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
