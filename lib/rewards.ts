// Prototype-only referral rewards. These demonstrate the mechanic; they are
// content inside this app, not commitments from any organisation.

export const REWARD_TIERS = [
  {
    id: "starter",
    referrals: 1,
    title: "Starter Prompt Pack",
    blurb: "8 prompts for planning, debugging and explaining your AI project.",
  },
  {
    id: "advanced",
    referrals: 3,
    title: "Advanced AI Project Pack",
    blurb: "3 portfolio-grade project briefs to build after the workshop.",
  },
  {
    id: "builder",
    referrals: 5,
    title: "Campus Builder badge",
    blurb: "A badge on your hub and a highlighted spot on the leaderboard.",
  },
] as const;

export type RewardTierId = (typeof REWARD_TIERS)[number]["id"];

export function unlockedTiers(referrals: number): RewardTierId[] {
  return REWARD_TIERS.filter((t) => referrals >= t.referrals).map((t) => t.id);
}

export function nextTier(referrals: number) {
  return REWARD_TIERS.find((t) => referrals < t.referrals) ?? null;
}
