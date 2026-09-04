import { useState, type ButtonHTMLAttributes } from "react";

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
}

/** A togglable pill. Pops briefly when tapped so the choice registers. */
export function Chip({ label, selected = false, onToggle, className = "", ...rest }: ChipProps) {
  const [popping, setPopping] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        setPopping(true);
        window.setTimeout(() => setPopping(false), 260);
        onToggle?.();
      }}
      className={`cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[0.8rem] transition-colors duration-100 ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-line-strong bg-panel text-ink-2 hover:border-primary hover:text-primary"
      } ${popping ? "animate-chip-pop" : ""} ${className}`}
      {...rest}
    >
      {label}
    </button>
  );
}

/** Non-interactive status pill. */
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "secondary" | "tertiary" | "danger" | "success";
  className?: string;
}) {
  const tones = {
    neutral: "border-line-strong bg-panel text-muted",
    primary: "border-primary bg-primary-soft text-primary",
    secondary: "border-secondary bg-secondary-soft text-secondary-deep",
    tertiary: "border-tertiary bg-tertiary-soft text-tertiary",
    danger: "border-danger bg-danger/10 text-danger",
    success: "border-success bg-success/10 text-success",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.72rem] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
