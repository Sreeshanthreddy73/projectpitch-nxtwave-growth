import type { TrackerStep } from "@/lib/competition";
import { CheckIcon, LockIcon, cx } from "./ui";

const STATE_LABEL = { done: "Done", current: "Next", locked: "Locked", info: "At workshop" };

// The journey tracker: idea → registered → refer 1 friend → build at the
// workshop → submit → evaluated and showcased.
// Presentational only: the steps are computed on the server from real data.
// The workshop step is never shown as done, because ProjectPitch does not host
// or verify the build.
export function ProgressTracker({ steps, onDark = false }: { steps: TrackerStep[]; onDark?: boolean }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => {
        const { state } = step;
        const row = onDark
          ? { done: "border-white/10 bg-white/[0.07]", current: "border-accent/60 bg-accent/10", locked: "border-white/10", info: "border-dashed border-white/20" }
          : { done: "border-good/25 bg-good-soft", current: "border-accent/40 bg-accent-soft", locked: "border-line bg-paper", info: "border-dashed border-ink/20 bg-card" };
        const dot = onDark
          ? { done: "animate-pop bg-good text-white", current: "bg-accent text-white", locked: "bg-white/10 text-white/50", info: "border border-white/30 text-white/70" }
          : { done: "animate-pop bg-good text-white", current: "bg-accent text-white", locked: "bg-line text-muted", info: "border border-ink/30 text-body" };
        const tag = onDark
          ? { done: "text-[#7fe0ae]", current: "text-accent", locked: "text-white/40", info: "text-white/60" }
          : { done: "text-good", current: "text-accent-dark", locked: "text-muted", info: "text-body" };
        return (
          <li key={step.id} className={cx("flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-500", row[state])}>
            <span className={cx("grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold", dot[state])}>
              {state === "done" ? <CheckIcon className="size-3.5" /> : state === "locked" ? <LockIcon className="size-3" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cx(
                  "block text-[15px] font-semibold",
                  onDark ? (state === "locked" ? "text-white/50" : "text-white") : state === "locked" ? "text-muted" : "text-ink",
                )}
              >
                {step.label}
              </span>
              {step.note && <span className={cx("block text-xs", onDark ? "text-white/55" : "text-body")}>{step.note}</span>}
            </span>
            <span className={cx("eyebrow shrink-0", tag[state])}>{STATE_LABEL[state]}</span>
          </li>
        );
      })}
    </ol>
  );
}
