"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowIcon, Button, CheckIcon, Field, inputClass } from "./ui";

type Existing = { project_url: string; summary: string } | null;

// Competition entry form. Rendered only when the server has confirmed the
// student is eligible; the API checks eligibility again on submit.
export function SubmitForm({ code, existing }: { code: string; existing: Existing }) {
  const router = useRouter();
  const [form, setForm] = useState({ project_url: existing?.project_url ?? "", summary: existing?.summary ?? "" });
  const [editing, setEditing] = useState(!existing);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFields({});
    setSaving(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...form }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setEditing(false);
        router.refresh(); // re-render the tracker and status from the server
      } else if (data?.fields) {
        setFields(data.fields);
      } else {
        setError(data?.message ?? "Could not submit your project. Please try again.");
      }
    } catch {
      setError("You appear to be offline. Check your connection and try again.");
    }
    setSaving(false);
  }

  if (existing && !editing) {
    return (
      <div className="animate-rise">
        <p className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <span className="grid size-7 place-items-center rounded-full bg-good text-white">
            <CheckIcon className="size-4" />
          </span>
          Your project is submitted.
        </p>
        <dl className="mt-4 space-y-3 text-[15px]">
          <div>
            <dt className="eyebrow text-muted">Project link</dt>
            <dd className="mt-1 break-all">
              <a
                href={existing.project_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-medium text-ink underline underline-offset-4 hover:text-accent-dark"
              >
                {existing.project_url}
              </a>
            </dd>
          </div>
          {existing.summary && (
            <div>
              <dt className="eyebrow text-muted">Description</dt>
              <dd className="mt-1 text-body">{existing.summary}</dd>
            </div>
          )}
        </dl>
        <Button variant="secondary" size="sm" className="mt-5" onClick={() => setEditing(true)}>
          Update submission
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Project link" htmlFor="project_url" error={fields.project_url}>
        <input
          id="project_url"
          type="url"
          inputMode="url"
          className={inputClass}
          placeholder="https://github.com/you/your-project"
          value={form.project_url}
          onChange={(e) => setForm({ ...form, project_url: e.target.value })}
        />
      </Field>
      <Field label="One-line description (optional)" htmlFor="summary" error={fields.summary}>
        <textarea
          id="summary"
          rows={2}
          maxLength={280}
          className={inputClass}
          placeholder="What it does and what you measured."
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={saving}>
          {saving ? "Submitting…" : existing ? "Save changes" : "Submit Project"} {!saving && <ArrowIcon />}
        </Button>
        {existing && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
