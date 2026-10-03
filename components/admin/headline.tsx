import { CAMPAIGN, PLANNING_ASSUMPTIONS } from "@/lib/config";
import { decimal, inr, inr2, num, pct } from "@/lib/format";
import type { Metrics } from "@/lib/metrics";
import { Card } from "../ui";

// The top of the dashboard. It answers, in order:
//   How many registered? How close are we to 500? What is the conversion rate?
// then the campaign's own mechanics: referrals, unlocked entries, submissions
// and what acquisition cost.

function Big({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <p className="font-display text-[44px] font-bold leading-none tracking-tight tabular-nums text-white sm:text-[56px]">
        {value}
      </p>
      <p className="eyebrow mt-3 text-white/55">{label}</p>
      {sub && <p className="mt-1 text-sm text-white/60">{sub}</p>}
    </div>
  );
}

function Small({ label, value, sub, note }: { label: string; value: string; sub: string; note?: string }) {
  return (
    <Card className="p-5">
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-sm text-body">{sub}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </Card>
  );
}

export function Headline({ m }: { m: Metrics }) {
  const { totals, pace, rates } = m;
  const isDemo = m.dataset === "demo";
  const word = isDemo ? "Simulated registrations" : "Registrations";
  const progress = Math.min(totals.registrations / CAMPAIGN.targetRegistrations, 1);
  const ended = pace.day > CAMPAIGN.durationDays;
  const dayLabel = ended
    ? isDemo
      ? `${CAMPAIGN.durationDays}-day simulation complete`
      : "Campaign window has ended"
    : `Day ${pace.day} of ${CAMPAIGN.durationDays}`;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          <Big value={num(totals.registrations)} label={word} sub={`${num(pace.remaining)} to go`} />
          <Big
            value={num(CAMPAIGN.targetRegistrations)}
            label="Target registrations"
            sub={`${CAMPAIGN.durationDays} days · ${inr(CAMPAIGN.budgetInr)} budget`}
          />
          <Big
            value={pct(progress)}
            label="Progress"
            sub={
              !pace.started
                ? "Not started"
                : pace.perDay === null
                  ? dayLabel
                  : `${dayLabel} · ${decimal(pace.perDay, 1)}/day${pace.requiredPerDay ? `, need ${num(pace.requiredPerDay)}/day` : ""}`
            }
          />
          <Big value={pct(rates.visitToRegister)} label="Visitor → registration" sub={`${num(totals.visitors)} visitors`} />
        </div>
        <div
          className="mt-8 h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CAMPAIGN.targetRegistrations}
          aria-valuenow={totals.registrations}
          aria-label="Registrations against target"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Small
          label="Referral-generated registrations"
          value={num(totals.referral_registrations)}
          sub={`${pct(m.kFactor)} of all registrations`}
          note={`K-factor ${decimal(m.kFactor)} · assumed ${PLANNING_ASSUMPTIONS.kFactor}`}
        />
        <Small
          label="Competition-eligible students"
          value={num(totals.eligible)}
          sub={`${pct(m.eligibleRate)} of registrants unlocked their entry`}
          note="Qualified by one verified referral"
        />
        <Small
          label="Project submissions"
          value={num(totals.submissions)}
          sub={totals.eligible > 0 ? `${pct(m.submissionRate)} of eligible students` : "No eligible students yet"}
          note={totals.avg_score !== null ? `Average preliminary score ${totals.avg_score}/100${isDemo ? " (simulated)" : ""}` : undefined}
        />
        <Small
          label="Cost per registration"
          value={inr2(m.costPerRegistration)}
          sub={
            totals.spend_inr > 0
              ? `${inr(totals.spend_inr)} ${isDemo ? "simulated" : "recorded"} spend ÷ registrations`
              : "No spend recorded"
          }
          note={`Prizes ${inr(totals.spend_prize_inr)} · paid acquisition ${inr(totals.spend_acquisition_inr)}`}
        />
      </div>
    </div>
  );
}
