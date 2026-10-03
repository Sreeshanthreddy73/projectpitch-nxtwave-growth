import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-5 py-20 text-center">
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-body">The link may be mistyped, or the blueprint may no longer exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Generate a blueprint
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
