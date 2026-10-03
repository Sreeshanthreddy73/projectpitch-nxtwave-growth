import "server-only";
import { CAMPAIGN, MIN_VISITORS_TO_RANK, PLANNING_ASSUMPTIONS } from "./config";
import { db, unwrap } from "./db";
import { abVerdict, type AbVerdict } from "./stats";

// Dashboard numbers. The counting happens in SQL (dashboard_metrics in
// supabase/schema.sql) for exactly one dataset, real or demo. This file only
// derives rates, pace and the A/B verdict from those counts.

type FunnelRow = { visitors: number; generators: number; registrations: number };

type Raw = {
  totals: {
    visitors: number;
    generators: number;
    registrations: number;
    shares: number;
    sharers: number;
    card_views: number;
    referral_registrations: number;
    eligible: number;
    submissions: number;
    avg_score: number | null;
    spend_acquisition_inr: number;
    spend_prize_inr: number;
    spend_inr: number;
    blueprints_ai: number;
    blueprints_fallback: number;
    first_event_at: string | null;
    last_event_at: string | null;
  };
  daily: { day: string; visitors: number; registrations: number }[];
  by_source: (FunnelRow & { source: string })[];
  by_campaign: (FunnelRow & { source: string; campaign: string; spend_inr: number })[];
  by_variant: (FunnelRow & { variant: "a" | "b" })[];
  top_referrers: { name: string; college: string; ref_code: string; referrals: number }[];
  colleges: { college: string; registrations: number }[];
  branches: { branch: string; registrations: number }[];
  spend: {
    id: string;
    label: string;
    utm_campaign: string | null;
    amount_inr: number;
    category: "acquisition" | "prize";
    created_at: string;
  }[];
};

const ratio = (num: number, den: number): number | null => (den > 0 ? num / den : null);

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;
const dayNumber = (isoDate: string) => Math.round(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
const isoFromDayNumber = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10);

export type Metrics = Awaited<ReturnType<typeof getMetrics>>;

export async function getMetrics(isDemo: boolean) {
  const raw = unwrap(await db().rpc("dashboard_metrics", { p_demo: isDemo })) as Raw;
  const t = raw.totals;

  // Campaign clock: day 1 is the (IST) date of the first recorded activity.
  const today = dayNumber(new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10));
  const started = raw.daily.length > 0;
  const start = started ? dayNumber(raw.daily[0].day) : today;
  const day = today - start + 1;
  const daysLeft = Math.max(CAMPAIGN.durationDays - day, 0);
  const elapsed = Math.min(day, CAMPAIGN.durationDays);
  const remaining = Math.max(CAMPAIGN.targetRegistrations - t.registrations, 0);
  const perDay = started ? t.registrations / elapsed : null;

  const byDay = new Map(raw.daily.map((d) => [dayNumber(d.day), d]));
  // Show the campaign window, extended only if activity continued past it.
  const lastActive = started ? dayNumber(raw.daily[raw.daily.length - 1].day) - start + 1 : 0;
  const span = Math.min(Math.max(CAMPAIGN.durationDays, lastActive), 21);
  let runningTotal = 0;
  const daily = Array.from({ length: span }, (_, i) => {
    const n = start + i;
    const future = n > today;
    const registrations = future ? null : (byDay.get(n)?.registrations ?? 0);
    runningTotal += registrations ?? 0;
    return {
      day: isoFromDayNumber(n),
      label: `Day ${i + 1}`,
      visitors: future ? null : (byDay.get(n)?.visitors ?? 0),
      registrations,
      cumulative: future ? null : runningTotal,
      // straight-line path to the target, for comparison
      targetCumulative: Math.round((CAMPAIGN.targetRegistrations * Math.min(i + 1, CAMPAIGN.durationDays)) / CAMPAIGN.durationDays),
    };
  });

  const variant = (id: "a" | "b") =>
    raw.by_variant.find((v) => v.variant === id) ?? { variant: id, visitors: 0, generators: 0, registrations: 0 };
  const withRates = <T extends FunnelRow>(row: T) => ({
    ...row,
    visitToGenerate: ratio(row.generators, row.visitors),
    visitToRegister: ratio(row.registrations, row.visitors),
  });
  const a = withRates(variant("a"));
  const b = withRates(variant("b"));

  return {
    dataset: isDemo ? ("demo" as const) : ("real" as const),
    totals: t,
    rates: {
      visitToGenerate: ratio(t.generators, t.visitors),
      generateToRegister: ratio(t.registrations, t.generators),
      visitToRegister: ratio(t.registrations, t.visitors),
      shareRate: ratio(t.sharers, t.registrations),
    },
    // Measured K: referred registrations per registrant.
    kFactor: ratio(t.referral_registrations, t.registrations),
    costPerRegistration: t.spend_inr > 0 ? ratio(t.spend_inr, t.registrations) : null,
    // Acquisition spend only (ads), excluding prizes.
    acquisitionCostPerRegistration: t.spend_acquisition_inr > 0 ? ratio(t.spend_acquisition_inr, t.registrations) : null,
    // Competition: share of registrants who unlocked their entry, and of those, who submitted.
    eligibleRate: ratio(t.eligible, t.registrations),
    submissionRate: ratio(t.submissions, t.eligible),
    pace: {
      started,
      day,
      daysLeft,
      remaining,
      perDay,
      requiredPerDay: daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null,
      projected: perDay === null ? null : Math.round(t.registrations + perDay * daysLeft),
    },
    daily,
    bySource: raw.by_source.map(withRates),
    byCampaign: raw.by_campaign.map((c) => ({
      ...withRates(c),
      costPerRegistration: c.spend_inr > 0 ? ratio(c.spend_inr, c.registrations) : null,
    })),
    ab: { a, b, verdict: abVerdict(a, b) as AbVerdict },
    topReferrers: raw.top_referrers,
    colleges: raw.colleges,
    branches: raw.branches,
    spend: raw.spend,
  };
}

// --- Snapshot sent to the AI -------------------------------------------------
// Built field by field from counts and rates. Names, emails, referral codes and
// spend labels are deliberately not copied across.

const round = (n: number | null, digits = 3) => (n === null ? null : Number(n.toFixed(digits)));

export type InsightSnapshot = ReturnType<typeof toSnapshot>;

export function toSnapshot(m: Metrics) {
  return {
    dataset: m.dataset,
    campaign: {
      target_registrations: CAMPAIGN.targetRegistrations,
      duration_days: CAMPAIGN.durationDays,
      budget_inr: CAMPAIGN.budgetInr,
      mechanic: "Students get a 60-minute-ready AI project idea, register, build it at the workshop, then submit it. Referring one friend who completes registration qualifies them for the competition. Submitted projects become shareable cards on Campus Builders whose Build Yours button brings in new students.",
      day: m.pace.day,
      days_left: m.pace.daysLeft,
    },
    planning_assumptions: {
      k_factor: PLANNING_ASSUMPTIONS.kFactor,
      visit_to_generate: PLANNING_ASSUMPTIONS.visitToGenerate,
      generate_to_register: PLANNING_ASSUMPTIONS.generateToRegister,
      share_rate: PLANNING_ASSUMPTIONS.shareRate,
    },
    min_visitors_to_rank: MIN_VISITORS_TO_RANK,
    totals: {
      visitors: m.totals.visitors,
      blueprint_generators: m.totals.generators,
      registrations: m.totals.registrations,
      registrants_who_shared: m.totals.sharers,
      share_clicks: m.totals.shares,
      card_views: m.totals.card_views,
      referral_registrations: m.totals.referral_registrations,
      students_with_competition_entry_unlocked: m.totals.eligible,
      project_submissions: m.totals.submissions,
      average_preliminary_project_score: m.totals.avg_score,
      spend_inr: m.totals.spend_inr,
      acquisition_spend_inr: m.totals.spend_acquisition_inr,
      prize_spend_inr: m.totals.spend_prize_inr,
    },
    rates: {
      visit_to_generate: round(m.rates.visitToGenerate),
      generate_to_register: round(m.rates.generateToRegister),
      visit_to_register: round(m.rates.visitToRegister),
      share_rate: round(m.rates.shareRate),
      measured_k_factor: round(m.kFactor),
      cost_per_registration_inr: round(m.costPerRegistration, 1),
      acquisition_cost_per_registration_inr: round(m.acquisitionCostPerRegistration, 1),
      entry_unlock_rate: round(m.eligibleRate),
      submission_rate_of_unlocked: round(m.submissionRate),
    },
    pace: {
      registrations_per_day: round(m.pace.perDay, 1),
      required_per_remaining_day: m.pace.requiredPerDay,
      registrations_remaining: m.pace.remaining,
      projected_final: m.pace.projected,
    },
    by_source: m.bySource.map((s) => ({
      source: s.source,
      visitors: s.visitors,
      registrations: s.registrations,
      visit_to_register: round(s.visitToRegister),
    })),
    by_campaign: m.byCampaign.map((c) => ({
      source: c.source,
      campaign: c.campaign,
      visitors: c.visitors,
      registrations: c.registrations,
      visit_to_register: round(c.visitToRegister),
      spend_inr: c.spend_inr,
      cost_per_registration_inr: round(c.costPerRegistration, 1),
    })),
    ab_test: {
      a_project_first: { visitors: m.ab.a.visitors, registrations: m.ab.a.registrations, visit_to_register: round(m.ab.a.visitToRegister) },
      b_competition_first: { visitors: m.ab.b.visitors, registrations: m.ab.b.registrations, visit_to_register: round(m.ab.b.visitToRegister) },
      verdict: m.ab.verdict.message,
      winner: m.ab.verdict.status === "winner" ? m.ab.verdict.winner : null,
    },
  };
}
