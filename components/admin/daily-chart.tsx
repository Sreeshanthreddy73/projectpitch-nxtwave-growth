"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CAMPAIGN } from "@/lib/config";
import type { Metrics } from "@/lib/metrics";

const SERIES = "#2a78d6";
const INK = "#111114";
const MUTED = "#6b6a66";
const GRID = "#e3e1da";

// Registrations per campaign day, with the pace needed to hit the target
// (target ÷ campaign days) as a reference line.
export function DailyChart({ daily }: { daily: Metrics["daily"] }) {
  const targetPace = Math.round(CAMPAIGN.targetRegistrations / CAMPAIGN.durationDays);

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={daily} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: MUTED, fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "rgba(17,17,20,0.04)" }}
              contentStyle={{ borderRadius: 10, border: `1px solid ${GRID}`, fontSize: 13, color: INK }}
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
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 text-right font-medium">Visitors</th>
              <th className="py-1 text-right font-medium">Registrations</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {daily.map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-muted">{d.day}</td>
                <td className="py-1 text-right">{d.visitors ?? "—"}</td>
                <td className="py-1 text-right">{d.registrations ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
