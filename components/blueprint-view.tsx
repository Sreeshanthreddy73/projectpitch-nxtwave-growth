import type { Blueprint, Difficulty } from "@/lib/types";
import { Eyebrow, LockIcon, cx } from "./ui";

// Presentational pieces of a blueprint, shared by the generator preview, the
// hub and the public card. They render whatever they are given: the server
// decides which fields exist (the plan only arrives after registration).

const LEVEL: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };

// Difficulty and build time, as two stat tiles.
export function BlueprintMeta({ difficulty, onDark = false }: { difficulty: Difficulty; onDark?: boolean }) {
  const tile = onDark ? "bg-white/[0.06]" : "border border-line bg-paper";
  const label = onDark ? "text-white/50" : "text-muted";
  const value = onDark ? "text-white" : "text-ink";
  return (
    <dl className="grid grid-cols-2 gap-3">
      <div className={cx("rounded-2xl p-3.5", tile)}>
        <dt className={cx("eyebrow", label)}>Difficulty</dt>
        <dd className={cx("mt-1 flex items-center gap-2 font-display text-lg font-semibold", value)}>
          {difficulty}
          <span aria-hidden className="flex gap-0.5">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cx("h-3 w-1 rounded-full", n <= LEVEL[difficulty] ? "bg-accent" : onDark ? "bg-white/15" : "bg-line")}
              />
            ))}
          </span>
        </dd>
      </div>
      <div className={cx("rounded-2xl p-3.5", tile)}>
        <dt className={cx("eyebrow", label)}>Build time</dt>
        <dd className={cx("mt-1 font-display text-lg font-semibold", value)}>60 minutes</dd>
      </div>
    </dl>
  );
}

export function StackList({ stack, onDark = false }: { stack: string[]; onDark?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {stack.map((tool) => (
        <li
          key={tool}
          className={cx(
            "rounded-lg border px-2.5 py-1 font-mono text-xs",
            onDark ? "border-white/15 text-white/85" : "border-line bg-paper text-ink",
          )}
        >
          {tool}
        </li>
      ))}
    </ul>
  );
}

// The unlocked 60-minute plan as a timeline.
export function BuildTimeline({ build_plan }: Pick<Blueprint, "build_plan">) {
  // Start minute of each step: the running total of the steps before it.
  const starts = build_plan.map((_, i) => build_plan.slice(0, i).reduce((sum, s) => sum + s.minutes, 0));
  return (
    <ol className="relative">
      <span aria-hidden className="absolute bottom-4 left-[15px] top-4 w-px bg-line" />
      {build_plan.map((step, i) => (
        <li key={i} className="relative flex animate-rise gap-4 pb-6 last:pb-0" style={{ animationDelay: `${i * 70}ms` }}>
          <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-medium text-white ring-4 ring-card">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pt-0.5">
            <p className="font-mono text-xs tabular-nums text-accent-dark">
              {starts[i]}–{starts[i] + step.minutes} min
            </p>
            <p className="mt-1 text-[16px] leading-relaxed text-ink">{step.step}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// The plan before registration: the number of steps is real, the content is
// not in the page at all (these are placeholder bars).
export function LockedPlan({ steps }: { steps: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ai/20 bg-ai-soft/60 p-5">
      <ol aria-hidden className="space-y-3.5">
        {Array.from({ length: steps }, (_, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white font-mono text-[11px] text-ai">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="h-3 rounded-full bg-ai/15 blur-[2px]" style={{ width: `${82 - ((i * 13) % 34)}%` }} />
          </li>
        ))}
      </ol>
      <div className="mt-5 flex items-start gap-2.5 border-t border-ai/15 pt-4 text-sm text-ink">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ai text-white">
          <LockIcon className="size-3" />
        </span>
        <p>
          <span className="font-semibold">Your {steps}-step build plan and resume bullet are ready.</span>{" "}
          <span className="text-body">They unlock when you register for the workshop.</span>
        </p>
      </div>
    </div>
  );
}

export function SectionLabel({ children, tag }: { children: React.ReactNode; tag?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Eyebrow>{children}</Eyebrow>
      {tag}
    </div>
  );
}
