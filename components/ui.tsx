import type { ButtonHTMLAttributes, ReactNode } from "react";

// Small shared building blocks. No UI library: just Tailwind classes.

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const BUTTON = {
  primary: "bg-accent text-white hover:bg-accent-dark shadow-sm",
  dark: "bg-ink text-white hover:bg-black",
  secondary: "border border-line bg-card text-ink hover:border-ink/30",
  ghost: "text-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON[variant],
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-card", className)}>{children}</div>;
}

const BADGE = {
  neutral: "bg-paper text-body border-line",
  accent: "bg-accent-soft text-accent-dark border-accent/20",
  good: "bg-good-soft text-good border-good/20",
  warn: "bg-warn-soft text-warn border-warn/20",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", BADGE[tone])}>
      {children}
    </span>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 " +
  "transition-colors hover:border-ink/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-accent-dark">
          {error}
        </p>
      )}
    </div>
  );
}

export function LockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M10 1.5A4.5 4.5 0 0 0 5.5 6v2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V6A4.5 4.5 0 0 0 10 1.5ZM12.5 8V6a2.5 2.5 0 0 0-5 0v2h5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
