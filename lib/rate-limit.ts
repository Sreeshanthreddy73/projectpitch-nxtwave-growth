import "server-only";

// Best-effort in-memory limiter. On serverless each instance has its own
// memory, so this slows abuse down rather than preventing it. Good enough for
// a prototype; a shared store would be the production answer.

const hits = new Map<string, number[]>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
