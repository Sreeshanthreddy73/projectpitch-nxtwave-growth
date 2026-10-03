import { AB_MIN_VISITORS_PER_VARIANT } from "./config";

// Two-proportion z-test for the A/B experiment. The verdict is computed here in
// code, never by the AI, and stays "insufficient" until both variants have
// enough visitors.

export type VariantStats = { visitors: number; registrations: number };

export type AbVerdict =
  | { status: "insufficient"; message: string }
  | { status: "no_difference"; pValue: number; message: string }
  | { status: "winner"; winner: "a" | "b"; pValue: number; message: string };

// Abramowitz–Stegun approximation of the standard normal CDF.
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function abVerdict(a: VariantStats, b: VariantStats): AbVerdict {
  const min = Math.min(a.visitors, b.visitors);
  if (min < AB_MIN_VISITORS_PER_VARIANT) {
    return {
      status: "insufficient",
      message: `Not enough data to pick a winner. Each variant needs ${AB_MIN_VISITORS_PER_VARIANT} visitors; the smaller one has ${min}.`,
    };
  }
  const pa = a.registrations / a.visitors;
  const pb = b.registrations / b.visitors;
  const pooled = (a.registrations + b.registrations) / (a.visitors + b.visitors);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / a.visitors + 1 / b.visitors));
  if (se === 0) {
    return { status: "no_difference", pValue: 1, message: "No registrations in either variant yet." };
  }
  const pValue = 2 * (1 - normalCdf(Math.abs((pa - pb) / se)));
  if (pValue >= 0.05) {
    return {
      status: "no_difference",
      pValue,
      message: `No significant difference yet (p = ${pValue.toFixed(2)}). Keep the test running.`,
    };
  }
  const winner = pa > pb ? "a" : "b";
  return {
    status: "winner",
    winner,
    pValue,
    message: `Variant ${winner.toUpperCase()} converts better, and the difference is statistically significant (p ${pValue < 0.01 ? "< 0.01" : `= ${pValue.toFixed(2)}`}).`,
  };
}
