import type { ScoreLine } from "@/lib/config";
import type { Scope } from "@/lib/scope";
import { CheckIcon, cx } from "./ui";

// A score out of 100 with its five criteria. Used twice with the same
// criteria: the pre-workshop readiness score and the post-workshop preliminary
// evaluation. Text carries every number, so nothing depends on colour.
export function ScoreBreakdown({ total, lines, compact = false }: { total: number; lines: ScoreLine[]; compact?: boolean }) {
  return (
    <div className={cx("grid gap-6", !compact && "sm:grid-cols-[auto_1fr] sm:items-center")}>
      <p className="flex items-baseline gap-1">
        <span className="font-display text-6xl font-bold leading-none tracking-tight tabular-nums text-ink">{total}</span>
        <span className="font-display text-xl font-semibold text-muted">/100</span>
      </p>
      <ul className="space-y-2.5">
        {lines.map((line) => (
          <li key={line.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{line.label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-body">
                {line.score}/{line.max}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-line" aria-hidden>
              <div
                className="h-full rounded-full bg-ai transition-[width] duration-700 ease-out"
                style={{ width: `${(line.score / line.max) * 100}%` }}
              />
            </div>
            {!compact && <p className="mt-1 text-xs text-muted">{line.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Scope optimizer result: what the 60-minute version is, what to leave out and
// what to keep.
export function ScopeCard({ scope }: { scope: Scope }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      {scope.original && (
        <dl className="mb-5 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="eyebrow text-muted">Your idea</dt>
            <dd className="mt-1 font-display text-lg font-semibold leading-snug text-ink">&ldquo;{scope.original}&rdquo;</dd>
          </div>
          <div>
            <dt className="eyebrow text-accent-dark">60-minute MVP</dt>
            <dd className="mt-1 font-display text-lg font-semibold leading-snug text-ink">&ldquo;{scope.mvp}&rdquo;</dd>
          </div>
        </dl>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow text-muted">Leave out for now</p>
          <ul className="mt-2 space-y-1.5 text-sm text-body">
            {scope.remove.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-muted" />
                <span className="line-through decoration-muted/60">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow text-good">Keep</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {scope.keep.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-good" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 border-t border-line pt-4 text-sm font-medium text-ink">
        {scope.optimized
          ? "Your project has been optimized for a 60-minute MVP."
          : "This project is already scoped for a 60-minute MVP."}
      </p>
    </div>
  );
}
