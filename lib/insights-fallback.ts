import { MIN_VISITORS_TO_RANK } from "./config";
import type { InsightSnapshot } from "./metrics";
import type { InsightContent } from "./types";

// Rule-based growth insights. Used when no AI key is configured or the AI call
// fails. It reads the same aggregate snapshot the AI would, so the two are
// interchangeable. Every number it prints comes straight from the snapshot.

const pct = (n: number | null) => (n === null ? "n/a" : `${(n * 100).toFixed(1)}%`);
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const name = (source: string, campaign?: string) => (campaign ? `${source} / ${campaign}` : source);

export function fallbackInsights(s: InsightSnapshot): InsightContent {
  const { totals, rates, pace, planning_assumptions: plan, campaign } = s;

  if (totals.visitors === 0) {
    return {
      working: { headline: "No traffic yet", detail: "No visits have been recorded for this dataset, so nothing can be ranked." },
      leaking: { headline: "Nothing to diagnose", detail: "The funnel is empty. Insights need at least one tracked link with visitors." },
      next_actions: [
        {
          action: "Share one tracked link per channel, for example ?utm_source=whatsapp&utm_campaign=cse_group_a.",
          why: "Without tagged links, registrations cannot be attributed to a channel.",
          metric: "Visitors",
        },
      ],
    };
  }

  // --- Working: best channel by visit → registration, among those with enough traffic.
  const rankable = [
    ...s.by_campaign.map((c) => ({ ...c, label: name(c.source, c.campaign) })),
    ...s.by_source.filter((x) => !s.by_campaign.some((c) => c.source === x.source)).map((x) => ({ ...x, label: name(x.source) })),
  ].filter((x) => x.visitors >= MIN_VISITORS_TO_RANK && x.visit_to_register !== null);
  const best = [...rankable].sort((x, y) => y.visit_to_register! - x.visit_to_register!)[0];
  const worst = [...rankable].sort((x, y) => x.visit_to_register! - y.visit_to_register!)[0];

  const working = best
    ? {
        headline: `${best.label} converts best`,
        detail: `${best.label} turns ${pct(best.visit_to_register)} of visitors into registrations (${best.registrations} from ${best.visitors} visitors), against ${pct(rates.visit_to_register)} overall.`,
      }
    : {
        headline: "Not enough data to rank channels",
        detail: `No source has reached ${MIN_VISITORS_TO_RANK} visitors yet. Overall, ${totals.registrations} of ${totals.visitors} visitors registered (${pct(rates.visit_to_register)}).`,
      };

  // --- Leaking: the funnel step furthest below its planning assumption.
  const steps = [
    {
      key: "generate",
      label: "Visit → blueprint",
      actual: rates.visit_to_generate,
      assumed: plan.visit_to_generate,
      lost: totals.visitors - totals.blueprint_generators,
      what: "visitors left without generating a blueprint",
    },
    {
      key: "register",
      label: "Blueprint → registration",
      actual: rates.generate_to_register,
      assumed: plan.generate_to_register,
      lost: totals.blueprint_generators - totals.registrations,
      what: "students saw a preview but did not register",
    },
    {
      key: "share",
      label: "Registration → share",
      actual: rates.share_rate,
      assumed: plan.share_rate,
      lost: totals.registrations - totals.registrants_who_shared,
      what: "registrants never shared their blueprint",
    },
  ].filter((step) => step.actual !== null);
  const leak = [...steps].sort((x, y) => x.actual! / x.assumed - y.actual! / y.assumed)[0];

  const leaking =
    leak && leak.actual! < leak.assumed
      ? {
          headline: `${leak.label} is the weakest step`,
          detail: `${pct(leak.actual)} against a planning assumption of ${pct(leak.assumed)}: ${leak.lost} ${leak.what}.`,
        }
      : {
          headline: "No step is below its planning assumption",
          detail: `Visit → blueprint ${pct(rates.visit_to_generate)}, blueprint → registration ${pct(rates.generate_to_register)}, share rate ${pct(rates.share_rate)}. Volume, not conversion, is the constraint.`,
        };

  // --- Next 24 hours: up to three actions, most urgent first.
  const actions: InsightContent["next_actions"] = [];

  const behind =
    campaign.days_left > 0 &&
    pace.required_per_remaining_day !== null &&
    pace.registrations_per_day !== null &&
    pace.required_per_remaining_day > pace.registrations_per_day;
  if (behind && best) {
    actions.push({
      action: `Put tomorrow's seeding effort into more links like ${best.label}.`,
      why: `Pace is ${pace.registrations_per_day}/day but ${pace.required_per_remaining_day}/day is needed to reach ${campaign.target_registrations}; this is the best-converting channel at ${pct(best.visit_to_register)}.`,
      metric: "Registrations per day",
    });
  }

  if (leak && leak.actual! < leak.assumed) {
    const fix: Record<string, { action: string; metric: string }> = {
      generate: {
        action: "Move the generator form above the fold on mobile and cut the hero copy to one line.",
        metric: "Visit → blueprint rate",
      },
      register: {
        action: "Show the first build-plan step in the preview so the locked value is concrete before the form.",
        metric: "Blueprint → registration rate",
      },
      share: {
        action: "Put the share buttons directly under the unlocked blueprint and name the next reward in the button text.",
        metric: "Share rate",
      },
    };
    actions.push({
      ...fix[leak.key],
      why: `${leak.label} is at ${pct(leak.actual)} against an assumed ${pct(leak.assumed)}, the largest shortfall in the funnel.`,
    });
  }

  const paid = s.by_campaign
    .filter((c) => c.spend_inr > 0 && c.visitors >= MIN_VISITORS_TO_RANK && c.cost_per_registration_inr !== null)
    .sort((x, y) => y.cost_per_registration_inr! - x.cost_per_registration_inr!)[0];
  if (paid && best && paid.campaign !== (best as { campaign?: string }).campaign) {
    actions.push({
      action: `Pause further spend on ${name(paid.source, paid.campaign)} and move it to referral prizes.`,
      why: `It cost ${inr(paid.cost_per_registration_inr!)} per registration (${inr(paid.spend_inr)} for ${paid.registrations}) and converts ${pct(paid.visit_to_register)} of visitors, versus ${pct(best.visit_to_register)} for ${best.label}.`,
      metric: "Cost per registration",
    });
  }

  if (s.ab_test.winner) {
    const hook = s.ab_test.winner === "a" ? "resume" : "build";
    actions.push({
      action: `Send all traffic to variant ${s.ab_test.winner.toUpperCase()} (the ${hook} hook) and test a new challenger against it.`,
      why: s.ab_test.verdict,
      metric: "Visit → registration rate",
    });
  } else {
    actions.push({
      action: "Keep the A/B test running at 50/50 and do not change either headline yet.",
      why: s.ab_test.verdict,
      metric: "Visitors per variant",
    });
  }

  if (actions.length < 3 && rates.measured_k_factor !== null && rates.measured_k_factor < plan.k_factor) {
    actions.push({
      action: "Ask each new registrant to share with one specific classmate instead of posting generally.",
      why: `Measured K is ${rates.measured_k_factor.toFixed(2)} against a planning assumption of ${plan.k_factor}: ${totals.referral_registrations} referred registrations from ${totals.registrations} registrants.`,
      metric: "K-factor",
    });
  }

  if (actions.length < 2 && worst && best && worst.label !== best.label) {
    actions.push({
      action: `Rewrite the post used for ${worst.label} using the message from ${best.label}.`,
      why: `${worst.label} converts ${pct(worst.visit_to_register)} of visitors versus ${pct(best.visit_to_register)} for ${best.label}.`,
      metric: "Visit → registration rate",
    });
  }

  return { working, leaking, next_actions: actions.slice(0, 3) };
}
