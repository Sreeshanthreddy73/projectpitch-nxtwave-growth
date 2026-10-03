"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { splitProblem } from "@/lib/blueprint-text";
import { BRANCHES, INTERESTS, SKILL_LEVELS, YEARS } from "@/lib/options";
import type { BlueprintPreview, GeneratedBy } from "@/lib/types";
import { BlueprintMeta, LockedPlan, SectionLabel, StackList } from "./blueprint-view";
import { ArrowIcon, Badge, Button, CheckIcon, Eyebrow, Field, SparkIcon, cx, inputClass } from "./ui";

// The landing-page product flow in one component:
//   3 questions → generating → preview (plan locked) + registration → hub.
// It talks to the same two APIs as before: POST /api/generate and
// POST /api/register. Attribution is added on the server from cookies.

type ApiError = { message: string; fields?: Record<string, string> };
type Result = { preview: BlueprintPreview; generated_by: GeneratedBy };

async function postJson<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data) return { ok: true, data };
    return { ok: false, error: data?.message ? data : { message: "Something went wrong. Please try again." } };
  } catch {
    return { ok: false, error: { message: "You appear to be offline. Check your connection and try again." } };
  }
}

const INTEREST_HINT: Record<string, string> = {
  chatbots: "Q&A bots and study helpers",
  vision: "Images, video and detection",
  prediction: "Forecasts and smart models",
  automation: "Agents that do tasks for you",
  recsys: "Find and recommend things",
  voice: "Speech and transcription",
};

const QUESTIONS = ["What are you interested in?", "What's your experience level?", "Last one: your branch and year?"];
const LOADING_MESSAGES = ["Understanding your interests…", "Finding the right project…", "Building your roadmap…"];

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="animate-fade rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
      {children}
    </div>
  );
}

// A large selectable option. aria-pressed carries the state for screen
// readers; the check mark and border carry it visually (not colour alone).
function Option({
  selected,
  onClick,
  title,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "group flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-card active:translate-y-0",
        selected ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-card hover:border-ink/30",
      )}
    >
      <span>
        <span className="block text-[16px] font-semibold text-ink">{title}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      </span>
      <span
        className={cx(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-accent bg-accent text-white" : "border-line text-transparent group-hover:border-ink/30",
        )}
      >
        <CheckIcon className="size-3.5" />
      </span>
    </button>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "rounded-full border px-4 py-2 text-[15px] transition-all duration-150 active:scale-95",
        selected ? "border-ink bg-ink font-semibold text-white" : "border-line bg-card text-body hover:border-ink/40",
      )}
    >
      {children}
    </button>
  );
}

export function Generator({ cta }: { cta: string }) {
  const router = useRouter();
  const [inputs, setInputs] = useState({ branch: "", year: "Final year", skill_level: "", interest: "" });
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<"questions" | "generating" | "preview" | "unlocked">("questions");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(0);

  const [details, setDetails] = useState({ name: "", email: "", college: "", consent: false });
  const [registering, setRegistering] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Rotate the status line while the real request is in flight. This does not
  // delay anything: the result is shown the moment the API responds.
  useEffect(() => {
    if (stage !== "generating") return;
    const timer = setInterval(() => setLoadingMessage((m) => Math.min(m + 1, LOADING_MESSAGES.length - 1)), 700);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  function goTo(next: number) {
    setError(null);
    setStep(next);
    // Move keyboard and screen-reader focus to the new question.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  // Choosing an answer on steps 1 and 2 moves on after a short beat, so the
  // selection is visible before the next question appears.
  function choose(field: "interest" | "skill_level", value: string) {
    setInputs((current) => ({ ...current, [field]: value }));
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => goTo(step + 1), 220);
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!inputs.branch) {
      setError({ message: "Pick your branch to finish." });
      return;
    }
    setError(null);
    setLoadingMessage(0);
    setStage("generating");
    const response = await postJson<Result>("/api/generate", inputs);
    if (response.ok) {
      setResult(response.data);
      setStage("preview");
    } else {
      setError(response.error);
      setStage("questions");
    }
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    if (!result) return;
    setError(null);
    setRegistering(true);
    const response = await postJson<{ code: string }>("/api/register", { blueprint_id: result.preview.id, ...details });
    if (response.ok) {
      setStage("unlocked");
      router.push(`/hub/${response.data.code}`);
      return;
    }
    setError(response.error);
    setRegistering(false);
  }

  function startOver() {
    setStage("questions");
    setStep(0);
    setError(null);
  }

  // ---------------------------------------------------------------- generating
  if (stage === "generating") {
    return (
      <div aria-live="polite" className="p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-9 animate-pulse place-items-center rounded-full bg-ai-soft text-ai">
            <SparkIcon className="size-4" />
          </span>
          <p key={loadingMessage} className="animate-fade font-display text-xl font-semibold text-ink">
            {LOADING_MESSAGES[loadingMessage]}
          </p>
        </div>
        <div aria-hidden className="mt-8 space-y-4">
          <div className="skeleton h-9 w-3/5 rounded-xl" />
          <div className="skeleton h-4 w-full rounded-full" />
          <div className="skeleton h-4 w-4/5 rounded-full" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ unlocked
  if (stage === "unlocked") {
    return (
      <div role="status" className="grid place-items-center px-6 py-20 text-center">
        <span className="grid size-14 animate-pop place-items-center rounded-full bg-good text-white">
          <CheckIcon className="size-7" />
        </span>
        <p className="mt-5 font-display text-2xl font-bold text-ink">Blueprint unlocked.</p>
        <p className="mt-1 text-body">Opening your project…</p>
      </div>
    );
  }

  // ------------------------------------------------------------------- preview
  if (stage === "preview" && result) {
    const { preview, generated_by } = result;
    const { oneLiner, why } = splitProblem(preview.problem);
    const fields = error?.fields ?? {};

    return (
      <div className="animate-rise">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow className="text-accent-dark">Your AI project</Eyebrow>
            <Badge tone="ai">
              <SparkIcon className="size-3" />
              {generated_by === "ai" ? "AI generated" : "Matched to your answers"}
            </Badge>
          </div>

          <h3 className="text-h1 mt-4">{preview.title}</h3>
          <p className="mt-3 text-lg leading-relaxed text-body">{oneLiner}</p>

          <div className="mt-6">
            <BlueprintMeta difficulty={preview.difficulty} />
          </div>

          <div className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <SectionLabel>Why this project?</SectionLabel>
              <p className="mt-3 leading-relaxed text-body">{why}</p>
            </div>
            <div>
              <SectionLabel>Tech stack</SectionLabel>
              <div className="mt-3">
                <StackList stack={preview.stack} />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-8">
            <SectionLabel tag={<Badge tone="ai">Full blueprint</Badge>}>60-minute build plan</SectionLabel>
            <div className="mt-3">
              <LockedPlan steps={preview.locked_steps} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                document.getElementById("unlock")?.scrollIntoView({ block: "start" });
                nameRef.current?.focus({ preventScroll: true });
              }}
            >
              Unlock My Full Blueprint <ArrowIcon />
            </Button>
            <Button variant="ghost" onClick={startOver}>
              Try different answers
            </Button>
          </div>
        </div>

        <form id="unlock" onSubmit={register} noValidate className="space-y-5 border-t border-line bg-sand/50 p-6 sm:p-10">
          <div>
            <h3 className="text-h2">Your project is ready.</h3>
            <p className="mt-2 max-w-xl text-body">
              Register for the workshop to unlock the complete build plan and resume-ready project bullet.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={fields.name}>
              <input
                id="name"
                ref={nameRef}
                className={inputClass}
                autoComplete="name"
                placeholder="Your full name"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={fields.email}>
              <input
                id="email"
                type="email"
                className={inputClass}
                autoComplete="email"
                placeholder="you@college.edu"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="College" htmlFor="college" error={fields.college}>
            <input
              id="college"
              className={inputClass}
              autoComplete="organization"
              placeholder="Your college name"
              value={details.college}
              onChange={(e) => setDetails({ ...details, college: e.target.value })}
            />
          </Field>
          <p className="text-sm text-muted">
            Registering as <span className="font-medium text-ink">{inputs.branch}</span>,{" "}
            <span className="font-medium text-ink">{inputs.year.toLowerCase()}</span>.
          </p>
          <div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
              <input
                type="checkbox"
                className="mt-0.5 size-[18px] shrink-0 accent-accent"
                checked={details.consent}
                onChange={(e) => setDetails({ ...details, consent: e.target.checked })}
              />
              <span>
                I agree to my details being stored for this workshop registration. If I refer friends, my first name and
                college may appear on the leaderboard. My email is never shown publicly.
              </span>
            </label>
            {fields.consent && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-accent-dark">
                {fields.consent}
              </p>
            )}
          </div>
          {error && !error.fields && <ErrorBox>{error.message}</ErrorBox>}
          <Button type="submit" size="lg" loading={registering} className="w-full sm:w-auto">
            {registering ? "Unlocking…" : "Register & Unlock"} {!registering && <ArrowIcon />}
          </Button>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------------------- questions
  return (
    <form onSubmit={generate} noValidate className="p-6 sm:p-10">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-sm tabular-nums text-ink" aria-label={`Step ${step + 1} of 3`}>
          <span className="font-semibold">0{step + 1}</span>
          <span className="text-muted"> / 03</span>
        </p>
        <div aria-hidden className="flex flex-1 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className={cx(
                  "block h-full rounded-full bg-accent transition-transform duration-500 ease-out",
                  i <= step ? "translate-x-0" : "-translate-x-full",
                )}
              />
            </span>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => goTo(step - 1)}
          className={cx("px-0", step === 0 && "invisible")}
          tabIndex={step === 0 ? -1 : 0}
        >
          Back
        </Button>
      </div>

      <div key={step} className="mt-7 animate-rise">
        <h3 ref={headingRef} tabIndex={-1} className="text-h2 outline-none">
          {QUESTIONS[step]}
        </h3>

        {step === 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {INTERESTS.map((interest) => (
              <Option
                key={interest.id}
                title={interest.label}
                hint={INTEREST_HINT[interest.id]}
                selected={inputs.interest === interest.id}
                onClick={() => choose("interest", interest.id)}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 grid gap-3">
            {SKILL_LEVELS.map((level) => (
              <Option
                key={level.id}
                title={level.label}
                hint={level.hint}
                selected={inputs.skill_level === level.id}
                onClick={() => choose("skill_level", level.id)}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="eyebrow text-muted">Branch</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {BRANCHES.map((branch) => (
                  <Chip
                    key={branch}
                    selected={inputs.branch === branch}
                    onClick={() => {
                      setError(null);
                      setInputs({ ...inputs, branch });
                    }}
                  >
                    {branch}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="eyebrow text-muted">Year</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {YEARS.map((year) => (
                  <Chip key={year} selected={inputs.year === year} onClick={() => setInputs({ ...inputs, year })}>
                    {year}
                  </Chip>
                ))}
              </div>
            </fieldset>

            {error && <ErrorBox>{error.message}</ErrorBox>}

            <Button type="submit" size="lg" className="w-full">
              {cta} <ArrowIcon />
            </Button>
          </div>
        )}
      </div>

      {step < 2 && error && (
        <div className="mt-5">
          <ErrorBox>{error.message}</ErrorBox>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted">Takes about 30 seconds. See your project before you sign up.</p>
    </form>
  );
}
