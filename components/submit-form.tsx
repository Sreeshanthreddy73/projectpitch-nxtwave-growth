"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowIcon, Button, Field, inputClass } from "./ui";

type Existing = { project_url: string; demo_url: string | null; summary: string; ai_usage: string; result: string } | null;

// Competition entry form. Rendered only when the server has confirmed the
// student qualifies; the API checks again on submit. What the student writes
// here is what the preliminary evaluation reads and what appears on their
// public project card.
export function SubmitForm({ code, existing }: { code: string; existing: Existing }) {
  const router = useRouter();
  const [form, setForm] = useState({
    project_url: existing?.project_url ?? "",
    demo_url: existing?.demo_url ?? "",
    summary: existing?.summary ?? "",
    ai_usage: existing?.ai_usage ?? "",
    result: existing?.result ?? "",
  });
  const [editing, setEditing] = useState(!existing);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

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
        router.refresh(); // re-render the tracker, evaluation and card from the server
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
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
        Update submission
      </Button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project link" htmlFor="project_url" error={fields.project_url}>
          <input
            id="project_url"
            type="url"
            inputMode="url"
            className={inputClass}
            placeholder="https://github.com/you/your-project"
            value={form.project_url}
            onChange={set("project_url")}
          />
        </Field>
        <Field label="Demo link (optional)" htmlFor="demo_url" error={fields.demo_url}>
          <input
            id="demo_url"
            type="url"
            inputMode="url"
            className={inputClass}
            placeholder="https://your-demo.streamlit.app"
            value={form.demo_url}
            onChange={set("demo_url")}
          />
        </Field>
      </div>
      <Field label="What does it do, and for whom?" htmlFor="summary" error={fields.summary}>
        <textarea id="summary" rows={2} maxLength={280} className={inputClass} value={form.summary} onChange={set("summary")} />
      </Field>
      <Field label="How does it use AI?" htmlFor="ai_usage" error={fields.ai_usage}>
        <textarea
          id="ai_usage"
          rows={2}
          maxLength={400}
          className={inputClass}
          placeholder="Which model or API, and what it does in the project."
          value={form.ai_usage}
          onChange={set("ai_usage")}
        />
      </Field>
      <Field label="What works, and what did you leave out?" htmlFor="result" error={fields.result}>
        <textarea
          id="result"
          rows={2}
          maxLength={400}
          className={inputClass}
          placeholder="What you finished in the workshop, anything you measured, and what you cut."
          value={form.result}
          onChange={set("result")}
        />
      </Field>
      <p className="text-xs leading-relaxed text-muted">
        Your answers, links, first name and college appear on your public project card and on Campus Builders. Your
        answers are also what the preliminary evaluation reads.
      </p>
      {error && (
        <p role="alert" className="rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={saving}>
          {saving ? "Submitting…" : existing ? "Save and re-evaluate" : "Submit Project"} {!saving && <ArrowIcon />}
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
