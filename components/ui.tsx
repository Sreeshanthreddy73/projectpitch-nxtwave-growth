import type { ButtonHTMLAttributes, ReactNode } from "react";

// Shared building blocks of the design system. No UI library: Tailwind only.

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// Button looks, also used for links that should look like buttons.
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 " +
  "disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";
const BUTTON_VARIANT = {
  primary: "bg-accent text-white shadow-[0_8px_20px_-8px_rgba(217,64,11,0.7)] hover:bg-accent-dark hover:-translate-y-0.5",
  dark: "bg-ink text-white hover:bg-ink-soft hover:-translate-y-0.5",
  light: "bg-white text-ink hover:bg-paper hover:-translate-y-0.5",
  secondary: "border border-line bg-card text-ink hover:border-ink/40",
  ghost: "text-muted hover:text-ink",
};
const BUTTON_SIZE = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClass(
  variant: keyof typeof BUTTON_VARIANT = "primary",
  size: keyof typeof BUTTON_SIZE = "md",
  className?: string,
) {
  return cx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANT;
  size?: keyof typeof BUTTON_SIZE;
  loading?: boolean;
}) {
  return (
    <button {...props} disabled={disabled || loading} aria-busy={loading} className={buttonClass(variant, size, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("inline-block animate-spin rounded-full border-2 border-current border-t-transparent opacity-80", className)}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-card shadow-card", className)}>{children}</div>;
}

const BADGE = {
  neutral: "bg-sand text-body border-line",
  accent: "bg-accent-soft text-accent-dark border-accent/20",
  ai: "bg-ai-soft text-ai border-ai/20",
  good: "bg-good-soft text-good border-good/20",
  warn: "bg-warn-soft text-warn border-warn/25",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", BADGE[tone])}>
      {children}
    </span>
  );
}

// Small mono label above headings and inside cards.
export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cx("eyebrow text-muted", className)}>{children}</p>;
}

export const inputClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] text-ink placeholder:text-muted/70 " +
  "transition-colors hover:border-ink/30 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

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
        <p role="alert" className="mt-1.5 text-sm font-medium text-accent-dark">
          {error}
        </p>
      )}
    </div>
  );
}

// --- Icons (inline SVG, decorative) ------------------------------------------

type IconProps = { className?: string };

export function LockIcon({ className = "size-4" }: IconProps) {
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

export function CheckIcon({ className = "size-4" }: IconProps) {
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

export function ArrowIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

// Four-point sparkle: the mark for AI / generated content.
export function SparkIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M9 1.500 10.900 7.100 16.500 9l-5.600 1.900L9 16.500l-1.900-5.600L1.500 9l5.600-1.900L9 1.500Z" />
      <path d="m15.500 12.500.9 2.600 2.600.9-2.600.9-.9 2.600-.9-2.600-2.600-.9 2.600-.9.9-2.600Z" />
    </svg>
  );
}
