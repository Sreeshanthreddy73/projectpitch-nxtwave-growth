"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BUILD_MS, formatClock, phaseIndexAt, type BuildPhase } from "@/lib/build-mode";
import { ArrowIcon, Button, CheckIcon, buttonClass, cx } from "./ui";

// 60-Minute Build Mode: the workshop challenge timer.
//
// A real countdown from 60:00 that highlights the current phase of the
// student's own blueprint. Everything here stays in this browser:
//   - the timer state is kept in localStorage so a reload does not lose it;
//   - nothing is sent to the server, so the timer cannot unlock the
//     competition, mark a project as built, or change an evaluation score.

type Saved = { elapsedMs: number; runningSince: number | null };
const IDLE: Saved = { elapsedMs: 0, runningSince: null };

const storageKey = (code: string) => `pp:build:${code}`;

function load(code: string): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(code)) ?? "null");
    if (raw && typeof raw.elapsedMs === "number") {
      return { elapsedMs: Math.max(0, raw.elapsedMs), runningSince: typeof raw.runningSince === "number" ? raw.runningSince : null };
    }
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return IDLE;
}

function save(code: string, state: Saved) {
  try {
    localStorage.setItem(storageKey(code), JSON.stringify(state));
  } catch {
    // Storage unavailable: the timer still works until the page is closed.
  }
}

export function BuildMode({
  code,
  title,
  phases,
  eligible,
  submitted,
}: {
  code: string;
  title: string;
  phases: BuildPhase[];
  eligible: boolean;
  submitted: boolean;
}) {
  const [saved, setSaved] = useState<Saved>(IDLE);
  const [now, setNow] = useState(0);

  // Restore a session in progress (after the first render, so the server and
  // browser markup match).
  useEffect(() => {
    const restore = setTimeout(() => {
      setSaved(load(code));
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(restore);
  }, [code]);

  const running = saved.runningSince !== null;
  const elapsedMs = Math.min(saved.elapsedMs + (running ? Math.max(0, now - saved.runningSince!) : 0), BUILD_MS);
  const remainingMs = BUILD_MS - elapsedMs;
  const finished = remainingMs <= 0;
  const started = elapsedMs > 0 || running;

  // Tick while running. Time is always derived from the clock, so a throttled
  // or sleeping tab catches up instead of drifting.
  useEffect(() => {
    if (!running || finished) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [running, finished]);

  const update = useCallback(
    (next: Saved) => {
      save(code, next);
      setSaved(next);
      setNow(Date.now());
    },
    [code],
  );

  // Stop the clock once it reaches zero, so the stored state is final.
  useEffect(() => {
    if (finished && running) {
      const stop = setTimeout(() => update({ elapsedMs: BUILD_MS, runningSince: null }), 0);
      return () => clearTimeout(stop);
    }
  }, [finished, running, update]);

  const start = () => update({ elapsedMs: saved.elapsedMs, runningSince: Date.now() });
  const pause = () => update({ elapsedMs, runningSince: null });
  const reset = () => update(IDLE);

  const current = phaseIndexAt(phases, elapsedMs);
  const hubHref = `/hub/${code}`;
  // Submission lives on the hub and is only open to students who have qualified.
  const submitHref = submitted || eligible ? `${hubHref}#submit` : `${hubHref}#share`;
  const submitLink = (
    <Link href={submitHref} className={buttonClass("primary", "lg")}>
      {submitted ? "View Submission" : "Submit Project"} <ArrowIcon />
    </Link>
  );
  const qualifyNote = !eligible && !submitted && (
    <p className="mt-3 text-sm text-white/60">Refer 1 friend to qualify before you can submit. The timer does not change that.</p>
  );

  if (finished) {
    return (
      <div role="status" className="animate-rise rounded-3xl bg-ink p-8 text-center text-white shadow-lift sm:p-12">
        <p className="eyebrow text-accent">Time&apos;s up</p>
        <p className="mt-4 font-mono text-6xl font-semibold tabular-nums tracking-tight text-white/40 sm:text-7xl">00:00</p>
        <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Time&apos;s up — submit what you built.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/70">
          Your 60-minute build session is complete. Submit what you built and see your project on Campus Builders.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {submitLink}
          <Button variant="ghost" onClick={reset} className="text-white/60 hover:text-white">
            Restart timer
          </Button>
        </div>
        {qualifyNote}
        <p className="mx-auto mt-8 max-w-md border-t border-white/10 pt-5 text-xs leading-relaxed text-white/45">
          The timer ending does not submit anything, mark your project as complete, or add to your score.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow text-white/50">60-minute workshop</p>
        <p className="eyebrow inline-flex items-center gap-2 text-white/70">
          <span aria-hidden className={cx("size-2 rounded-full", running ? "animate-pulse bg-accent" : "bg-white/30")} />
          {running ? "Building" : started ? "Paused" : "Ready"}
        </p>
      </div>

      <p className="mt-2 text-sm text-white/60">{title}</p>

      <p
        role="timer"
        aria-label={`${formatClock(remainingMs)} remaining`}
        className={cx(
          "mt-6 text-center font-mono text-7xl font-semibold tabular-nums tracking-tight sm:text-[112px] sm:leading-none",
          running ? "text-white" : "text-white/70",
        )}
      >
        {formatClock(remainingMs)}
      </p>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${(elapsedMs / BUILD_MS) * 100}%` }} />
      </div>

      {/* announced to screen readers when the phase changes, not every second */}
      <p aria-live="polite" className="sr-only">
        {started ? `Current phase: ${phases[current].name}` : ""}
      </p>

      <ol className="mt-8 space-y-2">
        {phases.map((phase, i) => {
          const done = started && i < current;
          const active = started && i === current;
          return (
            <li
              key={i}
              aria-current={active ? "step" : undefined}
              className={cx(
                "flex gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors duration-500",
                active ? "border-accent/70 bg-accent/10" : "border-white/10",
              )}
            >
              <span
                className={cx(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                  done ? "bg-good text-white" : active ? "bg-accent" : "border border-white/30",
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : active ? <span className="size-2 rounded-full bg-white" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className={cx("text-[16px] font-semibold", done ? "text-white/60" : active ? "text-white" : "text-white/75")}>
                    {phase.name}
                    <span className="sr-only">{done ? " (done)" : active ? " (current)" : " (upcoming)"}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-white/50">
                    {phase.startMin}–{phase.endMin} min
                  </span>
                </p>
                {(active || !started) && <p className="mt-1 text-sm leading-relaxed text-white/70">{phase.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {running ? (
          <Button variant="light" size="lg" onClick={pause}>
            Pause
          </Button>
        ) : (
          <Button variant="light" size="lg" onClick={start}>
            {started ? "Resume" : "Start 60-Minute Build"}
          </Button>
        )}
        {started && submitLink}
        {started && !running && (
          <Button variant="ghost" onClick={reset} className="text-white/60 hover:text-white">
            Reset
          </Button>
        )}
      </div>
      {started && qualifyNote}
    </div>
  );
}
