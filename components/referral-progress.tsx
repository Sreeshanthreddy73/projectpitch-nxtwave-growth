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
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-ink">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{count}</span>{" "}
          <span className="text-sm text-muted">{count === 1 ? "friend has" : "friends have"} registered through your card</span>
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={TOP}
        aria-valuenow={Math.min(count, TOP)}
        aria-label="Referral progress"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.min(count / TOP, 1) * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted">
        {[0, ...REWARD_TIERS.map((t) => t.referrals)].map((n) => (
          <span key={n} className={cx("tabular-nums", count >= n && n > 0 && "font-semibold text-ink")}>
            {n}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-body">
        {next
          ? `${next.referrals - count} more to unlock: ${next.title}.`
          : "You've unlocked every reward. Thank you for spreading the word."}
      </p>
    </div>
  );
}
