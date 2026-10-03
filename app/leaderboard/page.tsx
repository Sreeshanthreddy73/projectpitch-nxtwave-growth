import type { Metadata } from "next";
import Link from "next/link";
import { LoadFailure, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge, Card } from "@/components/ui";
import { db, unwrap } from "@/lib/db";
import { REWARD_TIERS } from "@/lib/rewards";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

type Leaderboard = {
  referrers: { first_name: string; college: string; referrals: number }[];
  colleges: { college: string; registrations: number }[];
};

const BUILDER_AT = REWARD_TIERS[REWARD_TIERS.length - 1].referrals;

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

  return (
    <>
      <SiteHeader>
        <Link href="/#generator" className="font-medium text-ink hover:text-accent-dark">
          Get your blueprint
        </Link>
      </SiteHeader>
      <main className="mx-auto w-full max-w-4xl px-5 pb-20 pt-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leaderboard</h1>
        <p className="mt-2 text-body">Students and colleges bringing the most classmates to the workshop.</p>

        <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Top referrers</h2>
            {board.referrers.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No referrals yet. Share your blueprint card and be the first name here.
              </p>
            ) : (
              <ol className="mt-4 divide-y divide-line">
                {board.referrers.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 font-mono text-xs tabular-nums text-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                        {r.first_name}
                        {r.referrals >= BUILDER_AT && <Badge tone="accent">Campus Builder</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted">{r.college}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink">{r.referrals}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold">Colleges</h2>
            {board.colleges.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No registrations yet.</p>
            ) : (
              <ol className="mt-4 divide-y divide-line">
                {board.colleges.map((c, i) => (
                  <li key={c.college} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 font-mono text-xs tabular-nums text-muted">{i + 1}</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{c.college}</p>
                    <span className="text-sm tabular-nums text-body">
                      {c.registrations} {c.registrations === 1 ? "student" : "students"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
        <p className="mt-4 text-xs text-muted">
          Shows first names and colleges only, as agreed at registration. Badges are a feature of this prototype.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
