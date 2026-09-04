import type { ReactNode } from "react";

export type Tone = "light" | "dark";

export const LABEL_TONE: Record<Tone, string> = {
  light: "text-ink-2",
  dark: "text-on-dark-muted",
};

export const HINT_TONE: Record<Tone, string> = {
  light: "text-muted",
  dark: "text-muted",
};

/** Shared control shell: label, optional hint, the control, then its error. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  tone = "light",
  className = "",
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label ? (
        <label htmlFor={id} className={`mb-1.5 block text-[0.9rem] ${LABEL_TONE[tone]}`}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
          {hint ? <span className={`ml-1.5 font-normal ${HINT_TONE[tone]}`}>{hint}</span> : null}
        </label>
      ) : null}
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[0.85rem] text-danger">
      {message}
    </p>
  );
}

/** Every text control shares this look so the two apps stay consistent. */
export const controlClasses = (tone: Tone, invalid: boolean, className = "") =>
  [
    "w-full rounded-card border px-3.5 py-3 text-base transition-colors outline-none",
    tone === "dark"
      ? "border-field-border bg-field text-white placeholder:text-muted focus:border-primary"
      : "border-line-strong bg-panel text-ink placeholder:text-muted focus:border-primary",
    invalid ? "border-danger" : "",
    "disabled:cursor-not-allowed disabled:opacity-60",
    className,
  ]
    .filter(Boolean)
    .join(" ");
