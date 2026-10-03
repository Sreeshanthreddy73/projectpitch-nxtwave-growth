"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CAMPAIGN } from "@/lib/config";
import type { Metrics } from "@/lib/metrics";

const SERIES = "#2a78d6";
const INK = "#0e0e12";
const MUTED = "#6f6d68";
const GRID = "#e7e3da";

const tooltipStyle = { borderRadius: 10, border: `1px solid ${GRID}`, fontSize: 13, color: INK };
const axisTick = { fill: MUTED, fontSize: 12 };

type Daily = Metrics["daily"];

function DataTable({ daily, columns }: { daily: Daily; columns: [string, (d: Daily[number]) => number | null][] }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th className="py-1 font-medium">Day</th>
            <th className="py-1 font-medium">Date</th>
            {columns.map(([label]) => (
              <th key={label} className="py-1 text-right font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {daily.map((d) => (
            <tr key={d.day} className="border-t border-line">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-muted">{d.day}</td>
              {columns.map(([label, value]) => (
                <td key={label} className="py-1 text-right">
                  {value(d) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Running total of registrations against the straight-line path to the target.
export function CumulativeChart({ daily }: { daily: Daily }) {
  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={axisTick} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              domain={[0, CAMPAIGN.targetRegistrations]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [value, name === "cumulative" ? "Registrations so far" : "Target path"]}
              labelFormatter={(label, items) => `${label} · ${items[0]?.payload?.day ?? ""}`}
            />
            <ReferenceLine
              y={CAMPAIGN.targetRegistrations}
              stroke={MUTED}
              strokeDasharray="4 4"
              label={{ value: `Target ${CAMPAIGN.targetRegistrations}`, position: "insideTopLeft", fill: MUTED, fontSize: 12 }}
            />
            <Line dataKey="targetCumulative" stroke={MUTED} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line dataKey="cumulative" stroke={SERIES} strokeWidth={2.5} dot={{ r: 4, fill: SERIES, strokeWidth: 2, stroke: "#fff" }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-5 rounded bg-series" /> Registrations so far
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="w-5 border-t-2 border-dashed border-muted" /> Straight-line path to target
        </span>
      </p>
      <DataTable
        daily={daily}
        columns={[
          ["Cumulative", (d) => d.cumulative],
          ["Target path", (d) => d.targetCumulative],
        ]}
      />
    </div>
  );
}

// Registrations per campaign day, with the pace needed to hit the target
// (target ÷ campaign days) as a reference line.
export function DailyChart({ daily }: { daily: Daily }) {
  const targetPace = Math.round(CAMPAIGN.targetRegistrations / CAMPAIGN.durationDays);

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={daily} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={axisTick} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip
              cursor={{ fill: "rgba(14,14,18,0.04)" }}
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Registrations"]}
              labelFormatter={(label, items) => `${label} · ${items[0]?.payload?.day ?? ""}`}
            />
            <ReferenceLine
              y={targetPace}
              stroke={MUTED}
              strokeDasharray="4 4"
              label={{ value: `Target pace ${targetPace}/day`, position: "insideTopRight", fill: MUTED, fontSize: 12 }}
            />
            <Bar dataKey="registrations" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        daily={daily}
        columns={[
          ["Visitors", (d) => d.visitors],
          ["Registrations", (d) => d.registrations],
        ]}
      />
    </div>
  );
}
