"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REWARD_TIERS, nextTier } from "@/lib/rewards";
import { cx } from "./ui";

const TOP = REWARD_TIERS[REWARD_TIERS.length - 1].referrals;

// Shows the live referral count. It polls the server, and when the count
// changes it refreshes the page so newly unlocked reward content (rendered on
// the server) appears.
export function ReferralProgress({ code, initial }: { code: string; initial: number }) {
  const router = useRouter();
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let current = initial;
    async function check() {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/referral/${code}`, { cache: "no-store" });
        if (!response.ok) return;
        const { referrals } = (await response.json()) as { referrals: number };
        if (referrals !== current) {
          current = referrals;
          setCount(referrals);
          router.refresh();
        }
      } catch {
        // Offline or server error: keep showing the last known count.
      }
    }
    const timer = setInterval(check, 10_000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [code, initial, router]);

  const next = nextTier(count);

  return (
    <div>
      <p className="flex items-baseline gap-2.5">
        {/* keyed so the number pops when it changes */}
        <span key={count} className="animate-pop font-display text-5xl font-bold tabular-nums tracking-tight text-ink">
          {count}
        </span>
        <span className="text-[15px] text-body">{count === 1 ? "friend joined" : "friends joined"}</span>
      </p>

      <div className="relative mt-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOP}
          aria-valuenow={Math.min(count, TOP)}
          aria-label="Referral progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${Math.min(count / TOP, 1) * 100}%` }}
          />
        </div>
        {/* milestone markers at each reward */}
        {REWARD_TIERS.map((tier) => (
          <span
            key={tier.id}
            aria-hidden
            className={cx(
              "absolute top-1/2 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-[10px] font-semibold transition-colors duration-500",
              count >= tier.referrals ? "border-accent bg-accent text-white" : "border-line bg-card text-muted",
            )}
            style={{ left: `${(tier.referrals / TOP) * 100}%` }}
          >
            {tier.referrals}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-body">
        {next
          ? `${next.referrals - count} more to unlock ${next.title}.`
          : "You've unlocked every reward. Thank you for spreading the word."}
      </p>
    </div>
  );
}
