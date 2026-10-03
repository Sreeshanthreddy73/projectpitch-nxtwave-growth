import type { Blueprint, Difficulty } from "@/lib/types";
import { Badge } from "./ui";

const TONE: Record<Difficulty, "good" | "warn" | "accent"> = {
  Beginner: "good",
  Intermediate: "warn",
  Advanced: "accent",
};

// The part of a blueprint anyone may see: used in the preview, on the public
// card and at the top of the full blueprint.
export function BlueprintSummary({
  title,
  problem,
  stack,
  difficulty,
}: Pick<Blueprint, "title" | "problem" | "stack" | "difficulty">) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TONE[difficulty]}>{difficulty}</Badge>
        <Badge>60-minute build</Badge>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h2>
      <p className="mt-3 leading-relaxed">{problem}</p>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Recommended stack</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {stack.map((tool) => (
            <li key={tool} className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-ink">
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// The part unlocked by registration.
export function BlueprintPlan({ build_plan, resume_bullet }: Pick<Blueprint, "build_plan" | "resume_bullet">) {
  // Start minute of each step: the running total of the steps before it.
  const starts = build_plan.map((_, i) => build_plan.slice(0, i).reduce((sum, s) => sum + s.minutes, 0));
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">60-minute build plan</p>
        <ol className="mt-3 space-y-3">
          {build_plan.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 w-20 shrink-0 font-mono text-xs tabular-nums text-muted">
                {starts[i]}–{starts[i] + step.minutes} min
              </span>
              <span className="leading-relaxed text-ink">{step.step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Resume bullet</p>
        <p className="mt-2 leading-relaxed text-ink">{resume_bullet}</p>
        <p className="mt-2 text-xs text-muted">
          Replace the [bracketed] values with numbers you measure yourself when you build it.
        </p>
      </div>
    </div>
  );
}
