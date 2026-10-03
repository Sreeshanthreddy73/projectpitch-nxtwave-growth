// Display formatting shared by the dashboard components.

export const num = (n: number) => n.toLocaleString("en-IN");
export const pct = (n: number | null, digits = 1) => (n === null ? "—" : `${(n * 100).toFixed(digits)}%`);
export const inr = (n: number | null) => (n === null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`);
export const decimal = (n: number | null, digits = 2) => (n === null ? "—" : n.toFixed(digits));

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
