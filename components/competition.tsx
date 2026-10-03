import type { TrackerStep } from "@/lib/competition";
import { CheckIcon, LockIcon, cx } from "./ui";

// The five-step progress tracker: Project created → Registration complete →
// Refer 1 friend → Competition entry → Project submission.
// Presentational only: the steps are computed on the server from real data.
export function ProgressTracker({ steps, onDark = false }: { steps: TrackerStep[]; onDark?: boolean }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => {
        const done = step.state === "done";
        const current = step.state === "current";
        return (
          <li
            key={step.id}
            className={cx(
              "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-500",
              onDark
                ? done
                  ? "border-white/10 bg-white/[0.07]"
                  : current
                    ? "border-accent/60 bg-accent/10"
                    : "border-white/10 bg-transparent"
                : done
                  ? "border-good/25 bg-good-soft"
                  : current
                    ? "border-accent/40 bg-accent-soft"
                    : "border-line bg-paper",
            )}
          >
            <span
              className={cx(
                "grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold",
                done
                  ? "animate-pop bg-good text-white"
                  : current
                    ? "bg-accent text-white"
                    : onDark
                      ? "bg-white/10 text-white/50"
                      : "bg-line text-muted",
              )}
            >
              {done ? <CheckIcon className="size-3.5" /> : current ? i + 1 : <LockIcon className="size-3" />}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cx(
                  "block text-[15px] font-semibold",
                  onDark ? (step.state === "locked" ? "text-white/50" : "text-white") : step.state === "locked" ? "text-muted" : "text-ink",
                )}
              >
                {step.label}
              </span>
              {step.note && <span className={cx("block text-xs", onDark ? "text-white/55" : "text-body")}>{step.note}</span>}
            </span>
            <span
              className={cx(
                "eyebrow shrink-0",
                done ? (onDark ? "text-[#7fe0ae]" : "text-good") : current ? "text-accent" : onDark ? "text-white/40" : "text-muted",
              )}
            >
              {done ? "Done" : current ? "Next" : "Locked"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
