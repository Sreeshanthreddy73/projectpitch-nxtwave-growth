"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BRANCHES, INTERESTS, SKILL_LEVELS, YEARS } from "@/lib/options";
import type { BlueprintPreview, GeneratedBy } from "@/lib/types";
import { BlueprintSummary } from "./blueprint-view";
import { Button, Field, LockIcon, cx, inputClass } from "./ui";

// The landing-page flow in one component:
//   form → generating → preview (locked) + registration → redirect to the hub.

type ApiError = { message: string; steps?: string[]; fields?: Record<string, string> };

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

function ErrorBox({ error }: { error: ApiError }) {
  return (
    <div role="alert" className="rounded-lg border border-accent/25 bg-accent-soft px-3.5 py-3 text-sm text-ink">
      <p className="font-medium">{error.message}</p>
      {error.steps && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-body">
          {error.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function Generator({ cta }: { cta: string }) {
  const router = useRouter();
  const [inputs, setInputs] = useState({ branch: "", year: "Final year", skill_level: "", interest: "" });
  const [stage, setStage] = useState<"form" | "generating" | "preview">("form");
  const [preview, setPreview] = useState<{ preview: BlueprintPreview; generated_by: GeneratedBy } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const [details, setDetails] = useState({ name: "", email: "", college: "", consent: false });
  const [registering, setRegistering] = useState(false);

  const ready = inputs.branch && inputs.year && inputs.skill_level && inputs.interest;

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!ready) {
      setError({ message: "Choose your branch, skill level and an area of interest first." });
      return;
    }
    setError(null);
    setStage("generating");
    const result = await postJson<{ preview: BlueprintPreview; generated_by: GeneratedBy }>("/api/generate", inputs);
    if (result.ok) {
      setPreview(result.data);
      setStage("preview");
    } else {
      setError(result.error);
      setStage("form");
    }
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    if (!preview) return;
    setError(null);
    setRegistering(true);
    const result = await postJson<{ code: string }>("/api/register", { blueprint_id: preview.preview.id, ...details });
    if (result.ok) {
      router.push(`/hub/${result.data.code}`);
      return; // keep the button in its loading state while the hub loads
    }
    setError(result.error);
    setRegistering(false);
  }

  if (stage === "generating") {
    return (
      <div aria-live="polite" className="p-6 sm:p-8">
        <p className="text-sm font-medium text-ink">Designing your blueprint…</p>
        <p className="mt-1 text-sm text-muted">
          Matching {inputs.branch}, {SKILL_LEVELS.find((s) => s.id === inputs.skill_level)?.label.toLowerCase()} level.
        </p>
        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-7 w-2/3 rounded bg-line" />
          <div className="h-4 w-full rounded bg-line/70" />
          <div className="h-4 w-11/12 rounded bg-line/70" />
          <div className="h-4 w-4/5 rounded bg-line/70" />
          <div className="flex gap-2 pt-2">
            <div className="h-7 w-20 rounded bg-line/70" />
            <div className="h-7 w-24 rounded bg-line/70" />
            <div className="h-7 w-16 rounded bg-line/70" />
          </div>
        </div>
      </div>
    );
  }

  if (stage === "preview" && preview) {
    const fields = error?.fields ?? {};
    return (
      <div className="animate-rise">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">Your blueprint preview</p>
          <div className="mt-3">
            <BlueprintSummary {...preview.preview} />
          </div>

          {/* Locked content is not in the page at all: these are placeholder bars. */}
          <div className="relative mt-6 overflow-hidden rounded-xl border border-dashed border-line bg-paper p-4">
            <div aria-hidden className="space-y-2.5 opacity-60 blur-[3px]">
              {Array.from({ length: Math.min(preview.preview.locked_steps, 5) }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-3.5 w-14 rounded bg-line" />
                  <div className="h-3.5 rounded bg-line" style={{ width: `${78 - i * 9}%` }} />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center bg-paper/55 px-4 text-center">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <LockIcon />
                {preview.preview.locked_steps}-step build plan and resume bullet
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            {preview.generated_by === "ai" ? "Generated by AI for your inputs." : "Matched to your inputs from our blueprint library."}
          </p>
        </div>

        <form onSubmit={register} noValidate className="space-y-4 border-t border-line bg-paper/50 p-6 sm:p-8">
          <div>
            <h3 className="text-lg font-semibold">Unlock the full blueprint</h3>
            <p className="mt-1 text-sm text-muted">
              Register for the workshop to get the build plan, your resume bullet and a shareable card.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={fields.name}>
              <input
                id="name"
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
            <label className="flex items-start gap-2.5 text-sm text-body">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-accent"
                checked={details.consent}
                onChange={(e) => setDetails({ ...details, consent: e.target.checked })}
              />
              <span>
                I agree to my details being stored for this workshop registration. If I refer friends, my first name and
                college may appear on the leaderboard. My email is never shown publicly.
              </span>
            </label>
            {fields.consent && (
              <p role="alert" className="mt-1.5 text-sm text-accent-dark">
                {fields.consent}
              </p>
            )}
          </div>
          {error && !error.fields && <ErrorBox error={error} />}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={registering} className="px-5 py-3">
              {registering ? "Unlocking…" : "Register and unlock"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={registering}
              onClick={() => {
                setStage("form");
                setError(null);
              }}
            >
              Try different inputs
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={generate} noValidate className="space-y-5 p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Branch" htmlFor="branch">
          <select
            id="branch"
            className={inputClass}
            value={inputs.branch}
            onChange={(e) => setInputs({ ...inputs, branch: e.target.value })}
          >
            <option value="" disabled>
              Select
            </option>
            {BRANCHES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label="Year" htmlFor="year">
          <select
            id="year"
            className={inputClass}
            value={inputs.year}
            onChange={(e) => setInputs({ ...inputs, year: e.target.value })}
          >
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Skill level</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SKILL_LEVELS.map((level) => (
            <label
              key={level.id}
              className={cx(
                "cursor-pointer rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                inputs.skill_level === level.id ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-ink/30",
              )}
            >
              <input
                type="radio"
                name="skill_level"
                className="sr-only"
                checked={inputs.skill_level === level.id}
                onChange={() => setInputs({ ...inputs, skill_level: level.id })}
              />
              <span className="block text-sm font-medium text-ink">{level.label}</span>
              <span className="block text-xs text-muted">{level.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">What interests you?</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <label
              key={interest.id}
              className={cx(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                inputs.interest === interest.id
                  ? "border-accent bg-accent-soft font-medium text-ink"
                  : "border-line bg-card text-body hover:border-ink/30",
              )}
            >
              <input
                type="radio"
                name="interest"
                className="sr-only"
                checked={inputs.interest === interest.id}
                onChange={() => setInputs({ ...inputs, interest: interest.id })}
              />
              {interest.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <ErrorBox error={error} />}

      <Button type="submit" className="w-full py-3 text-[15px]">
        {cta}
      </Button>
      <p className="text-center text-xs text-muted">Takes about 30 seconds. No sign-up needed to see your preview.</p>
    </form>
  );
}
