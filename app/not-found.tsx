import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ArrowIcon, buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-5 py-24 text-center">
        <p className="eyebrow text-muted">404</p>
        <h1 className="text-h1 mt-3">We couldn&apos;t find that page.</h1>
        <p className="mt-3 text-body">The link may be mistyped, or the project may no longer exist.</p>
        <Link href="/#generator" className={buttonClass("primary", "lg", "mt-7")}>
          Build My Project <ArrowIcon />
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
