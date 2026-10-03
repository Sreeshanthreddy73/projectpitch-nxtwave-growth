import Link from "next/link";
import { DISCLAIMER, SITE_NAME } from "@/lib/config";
import { describeSetupProblem, type SetupProblem } from "@/lib/db";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
      <span aria-hidden className="grid size-6 place-items-center rounded-md bg-ink text-[11px] font-bold text-white">
        P
      </span>
      {SITE_NAME}
    </Link>
  );
}

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <Logo />
      <nav className="flex items-center gap-5 text-sm text-muted">{children}</nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{DISCLAIMER}</p>
        <nav className="flex gap-5">
          <Link href="/leaderboard" className="hover:text-ink">
            Leaderboard
          </Link>
          <Link href="/admin" className="hover:text-ink">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}

// Shown instead of a broken page when Supabase is missing, unreachable or has
// no tables yet. Tells the developer exactly what to do next.
export function SetupNotice({ problem }: { problem: SetupProblem }) {
  return (
    <div role="alert" className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-sm text-ink">
      <p className="font-semibold">Setup needed: {problem.title}</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body">
        {problem.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-3 text-muted">Full instructions are in README.md.</p>
    </div>
  );
}

// Page-level fallback for server components that failed to load data.
export function LoadFailure({ error }: { error: unknown }) {
  const problem = describeSetupProblem(error);
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16">
      {problem ? (
        <SetupNotice problem={problem} />
      ) : (
        <div role="alert" className="rounded-2xl border border-line bg-card p-6">
          <h1 className="text-lg font-semibold">We couldn&apos;t load this page</h1>
          <p className="mt-2 text-sm text-muted">Something went wrong on our side. Please refresh in a moment.</p>
        </div>
      )}
    </main>
  );
}
