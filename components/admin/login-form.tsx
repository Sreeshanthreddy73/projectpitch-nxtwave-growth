"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, inputClass } from "../ui";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => null);
      setError(data?.message ?? "Sign-in failed. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Admin password" htmlFor="password" error={error ?? undefined}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" variant="dark" loading={loading} className="w-full py-3">
        Sign in
      </Button>
    </form>
  );
}
