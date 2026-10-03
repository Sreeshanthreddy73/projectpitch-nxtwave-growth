import Link from "next/link";
import { DISCLAIMER, SHORT_PITCH, SITE_NAME } from "@/lib/config";
import { describeSetupProblem } from "@/lib/db";
import { logSetupProblem } from "@/lib/http";
import { ArrowIcon, buttonClass } from "./ui";

export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-display text-[17px] font-bold tracking-tight ${onDark ? "text-white" : "text-ink"}`}
    >
      <span aria-hidden className="relative grid size-7 place-items-center rounded-lg bg-accent text-white">
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
          <path d="M3 2.500h6.200a4 4 0 0 1 0 8H5.500v3H3v-11Zm2.500 2.200v3.600h3.400a1.800 1.800 0 0 0 0-3.600H5.500Z" />
        </svg>
      </span>
      {SITE_NAME}
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/leaderboard", label: "Leaderboard" },
];

// Sticky navbar. The mobile menu is a native <details>, so it works without
// JavaScript and is keyboard accessible.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium text-body sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
          <Link href="/#generator" className={buttonClass("dark", "sm")}>
            Generate Project
          </Link>
        </nav>

        <details className="group relative sm:hidden">
          <summary
            aria-label="Menu"
            className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-line bg-card text-ink [&::-webkit-details-marker]:hidden"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="size-5 group-open:hidden">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="hidden size-5 group-open:block">
              <path d="M5 5l10 10M15 5 5 15" />
            </svg>
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 top-12 w-60 animate-fade rounded-2xl border border-line bg-card p-2 shadow-lift"
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-sand">
                {link.label}
              </Link>
            ))}
            <Link href="/#generator" className={buttonClass("primary", "md", "mt-1 w-full")}>
              Generate Project <ArrowIcon />
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-sand/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-body">{SHORT_PITCH}</p>
          </div>
          <nav aria-label="Footer" className="flex gap-6 text-sm font-medium text-body">
            <Link href="/#how-it-works" className="hover:text-ink">
              How it works
            </Link>
            <Link href="/leaderboard" className="hover:text-ink">
              Leaderboard
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{DISCLAIMER}</p>
          <Link href="/admin" className="hover:text-ink">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

// Page-level fallback when a server component cannot load its data.
// Students see a short, calm message. Setup instructions (missing env vars,
// missing tables) go to the server log, and are shown on the page only in
// development, collapsed.
export function LoadFailure({ error }: { error: unknown }) {
  logSetupProblem(error);
  const setup = process.env.NODE_ENV === "development" ? describeSetupProblem(error) : null;
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-24 text-center">
      <p className="eyebrow text-muted">Temporarily unavailable</p>
      <h1 className="text-h2 mt-3">We can&apos;t load this right now.</h1>
      <p className="mt-3 text-body">Please try again shortly.</p>
      <Link href="/" className={buttonClass("secondary", "md", "mt-6")}>
        Back to ProjectPitch
      </Link>
      {setup && (
        <details className="mx-auto mt-10 max-w-md rounded-xl border border-line bg-card p-4 text-left text-sm">
          <summary className="cursor-pointer font-medium text-muted">Developer details (shown in development only)</summary>
          <p className="mt-3 font-medium text-ink">{setup.title}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-body">
            {setup.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </main>
  );
}
