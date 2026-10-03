import type { Metadata } from "next";
import Link from "next/link";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ArrowIcon, Badge, Eyebrow, buttonClass, cx } from "@/components/ui";
import { BUDGET_PLAN, COMPETITION_NOTE } from "@/lib/config";
import { db, unwrap } from "@/lib/db";
import { inr, num } from "@/lib/format";

export const metadata: Metadata = { title: "Campus Builders" };
export const dynamic = "force-dynamic";

type Board = {
  entries: {
    blueprint_id: string;
    title: string;
    stack: string[];
    ref_code: string;
    first_name: string;
    college: string;
    summary: string;
    project_url: string;
    demo_url: string | null;
    score: number | null;
    referrals: number;
  }[];
  referrers: { first_name: string; college: string; referrals: number }[];
  colleges: { college: string; registrations: number; projects: number }[];
  totals: { builders: number; projects: number; colleges: number };
};

function Rank({ n }: { n: number }) {
  return (
    <span
      className={cx(
        "grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
        n === 1 ? "bg-accent text-white" : n <= 3 ? "bg-ink text-white" : "bg-sand text-body",
      )}
    >
      {n}
    </span>
  );
}

// Campus Builders: the public showcase. Every submitted project is a card with
// a "Build Yours" button that sends a new student to the generator, credited
// to the student whose project they saw. Real data only.
export default async function CampusBuildersPage() {
  let board: Board;
  try {
    board = unwrap(await db().rpc("leaderboard")) as Board;
  } catch (error) {
    return (
      <>
        <SiteHeader />
        <LoadFailure error={error} />
        <SiteFooter />
      </>
    );
  }

  const topCollege = Math.max(...board.colleges.map((c) => c.registrations), 1);
  // People's Choice: the most verified registrations through a project's card.
  const mostShared = board.entries.reduce((best, e) => (e.referrals > (best?.referrals ?? 1) ? e : best), null as Board["entries"][number] | null);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12">
        <div className="animate-rise text-center">
          <Eyebrow>Project showcase</Eyebrow>
          <h1 className="text-display mt-3">Campus Builders</h1>
          <p className="mt-4 text-lg text-body">Real AI projects by students. See one you like, then build yours.</p>
          <dl className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["Builders", board.totals.builders],
              ["Projects built", board.totals.projects],
              ["Colleges", board.totals.colleges],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                <dd className="font-display text-3xl font-bold tabular-nums text-ink">{num(Number(value))}</dd>
                <dt className="eyebrow mt-1 text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <section aria-labelledby="entries" className="mt-14">
          <h2 id="entries" className="text-h2">
            Projects
          </h2>
          <p className="mt-1 text-sm text-muted">Ordered by preliminary evaluation score. Human judges decide the final ranking.</p>

          {board.entries.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
              <p className="font-display text-xl font-semibold text-ink">No projects submitted yet.</p>
              <p className="mt-1 text-body">Get your idea, build it at the workshop, and be the first one here.</p>
              <Link href="/#generator" className={buttonClass("primary", "lg", "mt-6")}>
                Get My Project Idea <ArrowIcon />
              </Link>
            </div>
          ) : (
            <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {board.entries.map((e, i) => (
                <li
                  key={e.blueprint_id}
                  className="flex animate-rise flex-col rounded-2xl border border-line bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Rank n={i + 1} />
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {mostShared?.blueprint_id === e.blueprint_id && <Badge tone="accent">Most shared</Badge>}
                      {e.score !== null ? <Badge tone="ai">Score {e.score}/100</Badge> : <Badge>Awaiting review</Badge>}
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold leading-snug tracking-tight">
                    <Link href={`/b/${e.blueprint_id}`} className="hover:text-accent-dark">
                      {e.title}
                    </Link>
                  </h3>
                  {e.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body">{e.summary}</p>}
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {e.stack.slice(0, 4).map((tool) => (
                      <li key={tool} className="rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-ink">
                        {tool}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-muted">
                    <span className="font-medium text-ink">{e.first_name}</span> · {e.college}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
                    <div className="mt-4 flex gap-3 text-sm font-medium">
                      {e.demo_url && (
                        <a href={e.demo_url} target="_blank" rel="noopener noreferrer nofollow" className="text-ink underline underline-offset-4 hover:text-accent-dark">
                          Demo
                        </a>
                      )}
                      <a href={e.project_url} target="_blank" rel="noopener noreferrer nofollow" className="text-ink underline underline-offset-4 hover:text-accent-dark">
                        Project
                      </a>
                    </div>
                    {/* The builder's code rides in the link: a new student who registers is credited to them. */}
                    <Link href={`/?ref=${e.ref_code}#generator`} className={buttonClass("primary", "sm", "mt-4")}>
                      Build Yours <ArrowIcon />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-2">
          <section aria-labelledby="colleges">
            <h2 id="colleges" className="text-h3">
              Colleges building
            </h2>
            <p className="mt-1 text-sm text-muted">Registered builders and submitted projects from each campus.</p>
            {board.colleges.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
                <p className="font-display text-lg font-semibold text-ink">No campuses yet.</p>
                <p className="mt-1 text-sm text-body">Yours could be the first.</p>
              </div>
            ) : (
              <ol className="mt-4 space-y-2.5">
                {board.colleges.map((c, i) => (
                  <li key={c.college} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                    <div className="flex items-center gap-4">
                      <Rank n={i + 1} />
                      <p className="min-w-0 flex-1 truncate font-semibold text-ink">{c.college}</p>
                      <p className="shrink-0 text-right text-sm tabular-nums text-body">
                        <span className="font-semibold text-ink">{c.registrations}</span> {c.registrations === 1 ? "builder" : "builders"}
                        <span className="text-muted">
                          {" "}
                          · {c.projects} {c.projects === 1 ? "project" : "projects"}
                        </span>
                      </p>
                    </div>
                    <div aria-hidden className="ml-12 mt-2 h-1.5 rounded-full bg-sand">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${(c.registrations / topCollege) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="competition" className="rounded-3xl bg-ink p-6 text-white sm:p-8">
            <p className="eyebrow text-white/50">Proposed campaign competition</p>
            <h2 id="competition" className="mt-3 font-display text-2xl font-bold tracking-tight text-white">
              How projects are recognised
            </h2>
            <ul className="mt-5 divide-y divide-white/10">
              {BUDGET_PLAN.map((prize) => (
                <li key={prize.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{prize.label}</p>
                    <p className="text-sm text-white/60">{prize.basis}</p>
                  </div>
                  <p className="font-display text-xl font-bold tabular-nums">{inr(prize.amountInr)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Referring one friend who registers qualifies you to enter. Ranking is by project quality, on proposed
              criteria: functionality 30, AI implementation 25, usefulness and originality 20, 60-minute execution 15,
              demo 10.
            </p>
            <p className="mt-3 text-xs text-white/45">{COMPETITION_NOTE} No real prizes are paid.</p>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Shows first names and colleges only, as agreed at registration and submission.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
