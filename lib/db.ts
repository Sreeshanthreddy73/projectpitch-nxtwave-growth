import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The only place the service-role key is read. "server-only" makes the build
// fail if this file is ever imported from a client component.

const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export class SetupError extends Error {
  constructor(public missing: string[]) {
    super(`Missing environment variables: ${missing.join(", ")}`);
  }
}

export class DbError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function missingDbEnv(): string[] {
  return REQUIRED.filter((name) => !process.env[name]);
}

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  const missing = missingDbEnv();
  if (missing.length > 0) throw new SetupError(missing);
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// supabase-js returns errors instead of throwing; this turns them into exceptions
// so route handlers can use one try/catch.
export function unwrap<T>(result: { data: T; error: { code?: string; message: string } | null }): T {
  if (result.error) throw new DbError(result.error.code ?? "unknown", result.error.message);
  return result.data;
}

export type SetupProblem = { kind: "env" | "schema" | "unreachable"; title: string; steps: string[] };

// Translates a failure into instructions a person can act on. Returns null for
// errors that are not setup problems.
export function describeSetupProblem(err: unknown): SetupProblem | null {
  if (err instanceof SetupError) {
    return {
      kind: "env",
      title: "The database is not configured yet",
      steps: [
        "Create a free project at supabase.com.",
        "Copy .env.example to .env.local.",
        `Fill in ${err.missing.join(" and ")} from Supabase → Project Settings → API.`,
        "Run supabase/schema.sql in the Supabase SQL editor.",
        "Restart the dev server (npm run dev).",
      ],
    };
  }
  if (err instanceof DbError && ["PGRST205", "PGRST202", "42P01", "42883"].includes(err.code)) {
    return {
      kind: "schema",
      title: "The database tables have not been created yet",
      steps: [
        "Open your Supabase project → SQL Editor → New query.",
        "Paste the full contents of supabase/schema.sql and click Run.",
        "Reload this page.",
      ],
    };
  }
  const message = err instanceof Error ? err.message : "";
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|Invalid API key|JWT|Invalid URL/i.test(message)) {
    return {
      kind: "unreachable",
      title: "Could not connect to Supabase",
      steps: [
        "Check NEXT_PUBLIC_SUPABASE_URL is your project URL (https://xxxx.supabase.co).",
        "Check SUPABASE_SERVICE_ROLE_KEY is the service_role key, not the anon key.",
        "Check the Supabase project is not paused, then restart the dev server.",
      ],
    };
  }
  return null;
}
