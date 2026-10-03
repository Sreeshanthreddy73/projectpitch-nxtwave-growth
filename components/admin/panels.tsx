"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BUDGET_PLAN, CAMPAIGN, COMPETITION_NOTE, CRITERIA, PLANNING_ASSUMPTIONS, SOURCE_LABELS } from "@/lib/config";
import { decimal, inr, inr2, num, pct } from "@/lib/format";
import type { Metrics } from "@/lib/metrics";
import { VARIANTS } from "@/lib/variants";
import { Badge, Button, Card, cx, inputClass } from "../ui";

// Presentational pieces of the dashboard. Each takes the metrics for ONE
// dataset; none of them fetch or combine data.

export function Panel({
  title,
  hint,
  action,
  className,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cx("min-w-0 p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h3">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Funnel({ m }: { m: Metrics }) {
  const { totals, rates } = m;
  const steps = [
    { label: "Visitors", value: totals.visitors, rate: null as number | null, rateLabel: "" },
    { label: "Blueprints generated", value: totals.generators, rate: rates.visitToGenerate, rateLabel: "of visitors" },
    { label: "Registrations", value: totals.registrations, rate: rates.generateToRegister, rateLabel: "of generators" },
    { label: "Registrants who shared", value: totals.sharers, rate: rates.shareRate, rateLabel: "of registrants" },
    { label: "Qualified for competition (verified referral)", value: totals.eligible, rate: m.eligibleRate, rateLabel: "of registrants" },
    { label: "Projects submitted and showcased", value: totals.submissions, rate: m.submissionRate, rateLabel: "of qualified" },
  ];
  const max = Math.max(totals.visitors, 1);

  return (
    <Panel title="Funnel" hint="From first visit to a showcased project. Qualification needs a referred friend to register; the build itself happens at the workshop.">
      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">{step.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-ink">{num(step.value)}</span>
                {step.rate !== null && (
                  <span className="text-muted">
                    {" "}
                    · {pct(step.rate)} {step.rateLabel}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-paper">
              <div
                className="h-full rounded-full bg-series"
                style={{ width: `${Math.min(Math.max((step.value / max) * 100, step.value > 0 ? 1.5 : 0), 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
        {[
          ["Visit → registration", pct(rates.visitToRegister)],
          ["Share clicks", num(totals.shares)],
          ["Card views", num(totals.card_views)],
          ["Referral registrations", num(totals.referral_registrations)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

const th = "px-3 py-2 text-xs font-medium text-muted first:pl-0 last:pr-0";
const td = "px-3 py-2.5 first:pl-0 last:pr-0";

function Table({ head, children }: { head: [string, "left" | "right"][]; children: ReactNode }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map(([label, align]) => (
              <th key={label} className={cx(th, align === "right" ? "text-right" : "text-left")}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line tabular-nums">{children}</tbody>
      </table>
    </div>
  );
}

export function SourceTable({ m }: { m: Metrics }) {
  return (
    <Panel title="Where are registrations coming from?" hint="First-touch utm_source. Referral = arrived through a shared blueprint card.">
      {m.bySource.length === 0 ? (
        <Empty>No traffic yet. Open the landing page with ?utm_source=whatsapp to see a source appear.</Empty>
      ) : (
        <Table
          head={[
            ["Source", "left"],
            ["Visitors", "right"],
            ["Blueprints", "right"],
            ["Registrations", "right"],
            ["Visit → reg.", "right"],
          ]}
        >
          {m.bySource.map((s) => (
            <tr key={s.source}>
              <td className={cx(td, "font-medium text-ink")}>
                {SOURCE_LABELS[s.source] ?? s.source}
                {SOURCE_LABELS[s.source] && <span className="ml-2 font-mono text-xs font-normal text-muted">{s.source}</span>}
              </td>
              <td className={cx(td, "text-right")}>{num(s.visitors)}</td>
              <td className={cx(td, "text-right")}>{num(s.generators)}</td>
              <td className={cx(td, "text-right font-semibold text-ink")}>{num(s.registrations)}</td>
              <td className={cx(td, "text-right")}>{pct(s.visitToRegister)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function CampaignTable({ m }: { m: Metrics }) {
  return (
    <Panel title="Campaign performance" hint="One row per utm_campaign link, with any spend recorded against it.">
      {m.byCampaign.length === 0 ? (
        <Empty>No campaign links used yet. Add &utm_campaign=cse_group_a to a link to track it here.</Empty>
      ) : (
        <Table
          head={[
            ["Campaign", "left"],
            ["Source", "left"],
            ["Visitors", "right"],
            ["Registrations", "right"],
            ["Visit → reg.", "right"],
            ["Spend", "right"],
            ["Cost / reg.", "right"],
          ]}
        >
          {m.byCampaign.map((c) => (
            <tr key={`${c.source}/${c.campaign}`}>
              <td className={cx(td, "font-mono text-xs text-ink")}>{c.campaign}</td>
              <td className={td}>{c.source}</td>
              <td className={cx(td, "text-right")}>{num(c.visitors)}</td>
              <td className={cx(td, "text-right font-semibold text-ink")}>{num(c.registrations)}</td>
              <td className={cx(td, "text-right")}>{pct(c.visitToRegister)}</td>
              <td className={cx(td, "text-right")}>{c.spend_inr > 0 ? inr(c.spend_inr) : "—"}</td>
              <td className={cx(td, "text-right")}>{inr(c.costPerRegistration)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function AbPanel({ m }: { m: Metrics }) {
  const { a, b, verdict } = m.ab;
  const tone = verdict.status === "winner" ? "good" : "warn";
  return (
    <Panel
      title="A/B test: project-first vs competition-first"
      hint={
        m.dataset === "demo"
          ? "SIMULATED split. These are not real experiment results."
          : "Visitors are split 50/50 and keep their variant."
      }
    >
      <Table
        head={[
          ["Variant", "left"],
          ["Visitors", "right"],
          ["Blueprints", "right"],
          ["Registrations", "right"],
          ["Visit → reg.", "right"],
        ]}
      >
        {([a, b] as const).map((v) => (
          <tr key={v.variant}>
            <td className={td}>
              <span className="font-medium text-ink">
                {v.variant.toUpperCase()} · {VARIANTS[v.variant].name}
              </span>
              {verdict.status === "winner" && verdict.winner === v.variant && (
                <span className="ml-2">
                  <Badge tone="good">Winner</Badge>
                </span>
              )}
            </td>
            <td className={cx(td, "text-right")}>{num(v.visitors)}</td>
            <td className={cx(td, "text-right")}>{num(v.generators)}</td>
            <td className={cx(td, "text-right font-semibold text-ink")}>{num(v.registrations)}</td>
            <td className={cx(td, "text-right")}>{pct(v.visitToRegister)}</td>
          </tr>
        ))}
      </Table>
      <div
        className={cx(
          "mt-4 rounded-lg border px-3.5 py-3 text-sm",
          tone === "good" ? "border-good/25 bg-good-soft text-ink" : "border-warn/25 bg-warn-soft text-ink",
        )}
      >
        <span className="font-semibold">
          {verdict.status === "winner" ? "Result: " : verdict.status === "insufficient" ? "No result yet: " : "No winner: "}
        </span>
        {verdict.message}
      </div>
      <p className="mt-2 text-xs text-muted">Two-proportion z-test on visit → registration, 95% confidence.</p>
    </Panel>
  );
}

export function TopReferrers({ m }: { m: Metrics }) {
  return (
    <Panel title="Are referrals working?" hint="Registrations credited to each student's blueprint card.">
      {m.topReferrers.length === 0 ? (
        <Empty>No referred registrations yet.</Empty>
      ) : (
        <ol className="divide-y divide-line">
          {m.topReferrers.map((r, i) => (
            <li key={r.ref_code} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-5 font-mono text-xs tabular-nums text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{r.name}</p>
                <p className="truncate text-xs text-muted">
                  {r.college} · <span className="font-mono">{r.ref_code}</span>
                </p>
              </div>
              <span className="font-semibold tabular-nums text-ink">{r.referrals}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink">{row.label}</span>
            <span className="font-semibold tabular-nums text-ink">{num(row.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-paper">
            <div className="h-full rounded-full bg-series" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Distribution({ m }: { m: Metrics }) {
  return (
    <Panel title="Who is registering" hint="Registrations by college (top 10) and branch.">
      {m.colleges.length === 0 ? (
        <Empty>No registrations yet.</Empty>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">College</p>
            <BarList rows={m.colleges.map((c) => ({ label: c.college, value: c.registrations }))} />
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Branch</p>
            <BarList rows={m.branches.map((b) => ({ label: b.branch, value: b.registrations }))} />
          </div>
        </div>
      )}
    </Panel>
  );
}

export function Assumptions({ m }: { m: Metrics }) {
  const rows: [string, number, number | null, (n: number | null) => string][] = [
    ["Visit → blueprint", PLANNING_ASSUMPTIONS.visitToGenerate, m.rates.visitToGenerate, pct],
    ["Blueprint → registration", PLANNING_ASSUMPTIONS.generateToRegister, m.rates.generateToRegister, pct],
    ["Share rate", PLANNING_ASSUMPTIONS.shareRate, m.rates.shareRate, pct],
    ["K-factor", PLANNING_ASSUMPTIONS.kFactor, m.kFactor, decimal],
  ];
  return (
    <Panel title="Planning assumptions vs measured" hint={PLANNING_ASSUMPTIONS.label}>
      <Table
        head={[
          ["Metric", "left"],
          ["Assumed", "right"],
          ["Measured", "right"],
        ]}
      >
        {rows.map(([label, assumed, measured, format]) => (
          <tr key={label}>
            <td className={cx(td, "text-ink")}>{label}</td>
            <td className={cx(td, "text-right text-muted")}>{format(assumed)}</td>
            <td
              className={cx(
                td,
                "text-right font-semibold",
                measured === null ? "text-muted" : measured >= assumed ? "text-good" : "text-accent-dark",
              )}
            >
              {format(measured)}
              {measured !== null && <span className="sr-only">{measured >= assumed ? " (at or above assumption)" : " (below assumption)"}</span>}
            </td>
          </tr>
        ))}
      </Table>
      <p className="mt-3 text-xs text-muted">
        {num(CAMPAIGN.targetRegistrations)} registrations is the campaign target, not a forecast. The assumed values were
        set before launch; the measured column is what this dataset shows.
      </p>
    </Panel>
  );
}

export function SpendPanel({ m, onChange }: { m: Metrics; onChange: () => void }) {
  const editable = m.dataset === "real";
  const [form, setForm] = useState({ label: "", amount: "", campaign: "", category: "acquisition" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          amount_inr: Number(form.amount),
          utm_campaign: form.campaign || undefined,
          category: form.category,
        }),
      });
      if (response.ok) {
        setForm({ label: "", amount: "", campaign: "", category: "acquisition" });
        onChange();
      } else {
        setError((await response.json().catch(() => null))?.message ?? "Could not save the entry.");
      }
    } catch {
      setError("Could not reach the server.");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    const response = await fetch(`/api/admin/spend?id=${id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) onChange();
    else setError("Could not delete the entry.");
  }

  return (
    <Panel
      title={editable ? "Measured real spend" : "Simulated spend"}
      hint={
        editable
          ? `${inr(m.totals.spend_inr)} actually recorded of the ${inr(CAMPAIGN.budgetInr)} budget.`
          : `${inr(m.totals.spend_inr)} of simulated spend, following the campaign allocation.`
      }
    >
      {m.spend.length === 0 ? (
        <Empty>No spend recorded. Cost per registration appears once an entry is added.</Empty>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {m.spend.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-ink">{s.label}</p>
                <p className="text-xs text-muted">
                  {s.category === "prize" ? "Prize" : "Acquisition"}
                  {s.utm_campaign && <span className="font-mono"> · {s.utm_campaign}</span>}
                </p>
              </div>
              <span className="font-semibold tabular-nums text-ink">{inr(s.amount_inr)}</span>
              {editable && (
                <button onClick={() => remove(s.id)} className="text-xs text-muted hover:text-accent-dark" aria-label={`Delete ${s.label}`}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable ? (
        <form onSubmit={add} className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
          <input
            aria-label="What the money was spent on"
            placeholder="What was it spent on?"
            required
            className={inputClass}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <input
            aria-label="Amount in rupees"
            placeholder="₹ amount"
            type="number"
            min={1}
            step={1}
            required
            className={inputClass}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            aria-label="utm_campaign (optional)"
            placeholder="utm_campaign (optional)"
            className={inputClass}
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
          />
          <select
            aria-label="Spend category"
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="acquisition">Acquisition (ads)</option>
            <option value="prize">Prize</option>
          </select>
          <Button type="submit" variant="secondary" loading={saving} className="sm:col-span-2">
            Add spend entry
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Simulated: no money was spent and no paid registrations were bought. Switch to Real data to record actual
          spend.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-accent-dark">
          {error}
        </p>
      )}
    </Panel>
  );
}

// The ₹2,000 allocation from the campaign plan. This is a plan, shown in both
// datasets and labelled as such; recorded spend lives in the Spend panel.
export function BudgetPanel({ m }: { m: Metrics }) {
  const isDemo = m.dataset === "demo";
  const swatch = (i: number) => (i === 0 ? "bg-ink" : i === 1 ? "bg-ink/60" : "bg-series");
  return (
    <Panel
      title="Budget allocation"
      hint={`Simulated campaign allocation of the ${inr(CAMPAIGN.budgetInr)} budget: all prize money, no paid ads. A plan, not recorded spend.`}
    >
      <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
        {BUDGET_PLAN.map((item, i) => (
          <span
            key={item.id}
            className={cx("h-full border-r-2 border-card last:border-r-0", swatch(i))}
            style={{ width: `${(item.amountInr / CAMPAIGN.budgetInr) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line text-sm">
        {BUDGET_PLAN.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <span aria-hidden className={cx("size-2.5 rounded-full", swatch(i))} />
            <span className="flex-1 text-ink">{item.label}</span>
            <span className="text-muted">{pct(item.amountInr / CAMPAIGN.budgetInr, 0)}</span>
            <span className="w-16 text-right font-semibold tabular-nums text-ink">{inr(item.amountInr)}</span>
          </li>
        ))}
        <li className="flex items-center gap-3 py-2.5 font-semibold text-ink">
          <span className="flex-1 pl-[22px]">Total budget</span>
          <span className="w-16 text-right tabular-nums">{inr(CAMPAIGN.budgetInr)}</span>
        </li>
      </ul>
      <dl className="mt-3 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-muted">Paid acquisition cost per registration</dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-ink">
            {m.totals.spend_acquisition_inr > 0 ? inr2(m.acquisitionCostPerRegistration) : "₹0"}
          </dd>
          <dd className="text-xs text-muted">
            {m.totals.spend_acquisition_inr > 0 ? (isDemo ? "Simulated" : "Recorded") + " ad spend ÷ registrations" : "No paid acquisition in this dataset"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Total cost per registration</dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-ink">{inr2(m.costPerRegistration)}</dd>
          <dd className="text-xs text-muted">{isDemo ? "Simulated spend" : "Recorded spend"} incl. prizes ÷ registrations</dd>
        </div>
      </dl>
    </Panel>
  );
}

// The proposed judging criteria, documented for the campaign owner.
export function CriteriaPanel({ m }: { m: Metrics }) {
  const isDemo = m.dataset === "demo";
  return (
    <Panel title="Proposed judging criteria" hint="Used for the readiness score before the workshop and the preliminary evaluation after it.">
      <ul className="divide-y divide-line text-sm">
        {CRITERIA.map((criterion) => (
          <li key={criterion.id} className="flex items-center gap-3 py-2.5">
            <span className="flex-1 text-ink">{criterion.label}</span>
            <span className="w-24">
              <span className="block h-1.5 rounded-full bg-paper" aria-hidden>
                <span className="block h-full rounded-full bg-series" style={{ width: `${(criterion.max / 30) * 100}%` }} />
              </span>
            </span>
            <span className="w-10 text-right font-semibold tabular-nums text-ink">{criterion.max}%</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-muted">Projects evaluated</dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-ink">{num(m.totals.submissions)}</dd>
        </div>
        <div>
          <dt className="text-muted">Average preliminary score</dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-ink">
            {m.totals.avg_score === null ? "—" : `${m.totals.avg_score}/100`}
          </dd>
          {isDemo && <dd className="text-xs text-muted">Simulated scores</dd>}
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        These are proposed campaign judging criteria, not official NxtWave criteria. The automated score is a first
        pass over what the student wrote; it does not verify the project or the 60-minute build, and human judges
        decide. Referrals qualify a student to enter and are not part of the score. {COMPETITION_NOTE}
      </p>
    </Panel>
  );
}
