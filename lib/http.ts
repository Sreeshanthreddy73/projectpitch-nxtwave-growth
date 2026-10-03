import "server-only";
import { NextResponse } from "next/server";
import { describeSetupProblem } from "./db";

export function jsonError(status: number, error: string, message: string, extra?: object) {
  return NextResponse.json({ error, message, ...extra }, { status });
}

// Last-resort handler for route handlers: setup problems become a 503 with
// instructions, anything else a generic 500 (details stay in the server log).
export function routeError(err: unknown) {
  const setup = describeSetupProblem(err);
  if (setup) return jsonError(503, "setup_required", setup.title, { steps: setup.steps });
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
