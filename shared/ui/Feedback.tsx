import type { ReactNode } from "react";

export function Alert({
  tone = "info",
  children,
  className = "",
}: {
  tone?: "info" | "success" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-primary bg-primary-soft text-ink",
    success: "border-success bg-success/10 text-ink",
    danger: "border-danger bg-danger/10 text-ink",
  };

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-card border-l-4 px-4 py-3 text-[0.95rem] ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-line ${className}`} />;
}

/** Empty-state placeholder used by lists in both apps. */
export function EmptyState({
  title,
  message,
  action,
  className = "",
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-dashed border-line-strong px-6 py-12 text-center ${className}`}>
      <p className="font-display text-[1.15rem] font-extrabold">{title}</p>
      {message ? <p className="mx-auto mt-2 max-w-[46ch] text-[0.95rem] text-muted">{message}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
