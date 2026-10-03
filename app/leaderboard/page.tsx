import type { Metadata } from "next";
import Link from "next/link";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ArrowIcon, Badge, Eyebrow, buttonClass, cx } from "@/components/ui";
import { db, unwrap } from "@/lib/db";
import { REWARD_TIERS } from "@/lib/rewards";

export const metadata: Metadata = { title: "Campus Builders" };
export const dynamic = "force-dynamic";

type Leaderboard = {
  entries: { first_name: string; college: string; title: string; referrals: number }[];
  referrers: { first_name: string; college: string; referrals: number }[];
  colleges: { college: string; registrations: number }[];
};

const BUILDER_AT = REWARD_TIERS[REWARD_TIERS.length - 1].referrals;

function Rank({ n }: { n: number }) {
  return (
    <span
      className={cx(
        "grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
        n === 1 ? "bg-accent text-white" : n <= 3 ? "bg-ink text-white" : "bg-sand text-body",
      )}
    >
      {n}
    </span>
  );
}

export default async function LeaderboardPage() {
  let board: Leaderboard;
  try {
    // Real registrations only. Simulated data never appears on public pages.
    board = unwrap(await db().rpc("leaderboard")) as Leaderboard;
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-12">
        <div className="animate-rise text-center">
          <Eyebrow>Build. Refer. Compete.</Eyebrow>
          <h1 className="text-display mt-3">Campus Builders</h1>
          <p className="mt-4 text-lg text-body">Students turning ideas into projects, and entering them to compete.</p>
        </div>

        <section aria-labelledby="entries" className="mt-12">
          <h2 id="entries" className="text-h3">
            Competition entries
          </h2>
          <p className="mt-1 text-sm text-muted">
            Projects submitted by students who unlocked their entry with a verified referral. Listed by verified
            referrals; judging is outside this prototype.
          </p>
          {board.entries.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
              <p className="font-display text-lg font-semibold text-ink">No projects submitted yet.</p>
              <p className="mt-1 text-sm text-body">Refer one friend to unlock your entry and be the first.</p>
            </div>
          ) : (
            <ol className="mt-4 grid gap-2.5 md:grid-cols-2">
              {board.entries.map((e, i) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-card">
                  <Rank n={i + 1} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{e.title}</p>
                    <p className="truncate text-sm text-muted">
                      {e.first_name} · {e.college}
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="block font-display text-xl font-bold tabular-nums text-ink">{e.referrals}</span>
                    <span className="block text-xs text-muted">{e.referrals === 1 ? "referral" : "referrals"}</span>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-2">
          <section aria-labelledby="builders">
            <h2 id="builders" className="text-h3">
              Top builders
            </h2>
            <p className="mt-1 text-sm text-muted">Ranked by friends who joined through their project card.</p>
            {board.referrers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
                <p className="font-display text-lg font-semibold text-ink">No one is on the board yet.</p>
                <p className="mt-1 text-sm text-body">Share your project card and be the first name here.</p>
              </div>
            ) : (
              <ol className="mt-4 space-y-2.5">
                {board.referrers.map((r, i) => (
                  <li
                    key={i}
                    className="flex animate-rise items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-card"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Rank n={i + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        {r.first_name}
                        {r.referrals >= BUILDER_AT && <Badge tone="accent">Campus Builder</Badge>}
                      </p>
                      <p className="truncate text-sm text-muted">{r.college}</p>
                    </div>
                    <p className="text-right">
                      <span className="block font-display text-xl font-bold tabular-nums text-ink">{r.referrals}</span>
                      <span className="block text-xs text-muted">{r.referrals === 1 ? "friend" : "friends"}</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="colleges">
            <h2 id="colleges" className="text-h3">
              Colleges building
            </h2>
            <p className="mt-1 text-sm text-muted">Students registered from each campus.</p>
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
                      <p className="text-sm tabular-nums text-body">
                        {c.registrations} {c.registrations === 1 ? "student" : "students"}
                      </p>
                    </div>
                    <div aria-hidden className="ml-[52px] mt-2 h-1.5 rounded-full bg-sand">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${(c.registrations / topCollege) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="mt-14 rounded-3xl bg-ink p-8 text-center text-white sm:p-10">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Add your name to the board.</h2>
          <p className="mt-2 text-white/70">Build your project, refer one friend, and submit your entry.</p>
          <Link href="/#generator" className={buttonClass("primary", "lg", "mt-6")}>
            Build My Project <ArrowIcon />
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Shows first names and colleges only, as agreed at registration. Badges are a feature of this prototype.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
