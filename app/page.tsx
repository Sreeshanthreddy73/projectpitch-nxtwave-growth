import { headers } from "next/headers";
import Link from "next/link";
import { Generator } from "@/components/generator";
import { HeroCard } from "@/components/landing/hero-card";
import { FinalCta, GrowthLoop, HowItWorks, PrizeStrip, ValueSection } from "@/components/landing/sections";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Track } from "@/components/track";
import { ArrowIcon, Eyebrow, buttonClass } from "@/components/ui";
import { HERO_CTA, HERO_HEADLINE, VARIANTS, type Variant } from "@/lib/variants";

export default async function LandingPage() {
  // proxy.ts assigns the A/B variant and passes it in a request header.
  const assigned = (await headers()).get("x-pp-variant");
  const variant: Variant = assigned === "b" ? "b" : "a";
  const copy = VARIANTS[variant];

  return (
    <>
      <Track type="visit" />
      <SiteHeader />

      <main>
        {/* Hero: what it is, why it matters, what to do next. */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-24 lg:pt-16">
            <div className="animate-rise">
              <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-ink">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                {copy.eyebrow}
              </p>
              <h1 className="text-display mt-6">
                {HERO_HEADLINE.map((word, i) => (
                  <span key={word} className={i === HERO_HEADLINE.length - 1 ? "block text-accent" : "block"}>
                    {word}
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-body sm:text-xl">{copy.sub}</p>
              <div className="mt-7">
                <PrizeStrip />
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href="#generator" className={buttonClass("primary", "lg")}>
                  {HERO_CTA} <ArrowIcon />
                </Link>
                <p className="text-[15px] text-muted">No experience? Start anyway.</p>
              </div>
            </div>
            <HeroCard />
          </div>
        </section>

        {/* The generator: the product itself. */}
        <section id="generator" tabIndex={-1} className="border-y border-line bg-sand/60 outline-none">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-20">
            <div className="text-center">
              <Eyebrow>Step 1 · Build</Eyebrow>
              <h2 className="text-h1 mt-3">Three questions. One project made for you.</h2>
            </div>
            <div className="mt-9 overflow-hidden rounded-3xl border border-line bg-card shadow-lift">
              <Generator cta={HERO_CTA} />
            </div>
          </div>
        </section>

        <HowItWorks />
        <ValueSection />
        <GrowthLoop />
        <FinalCta cta={HERO_CTA} />
      </main>
      <SiteFooter />
    </>
  );
}
