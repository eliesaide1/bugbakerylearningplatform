import { useEffect, useState } from "react";
import { Button, type ButtonVariant } from "@shared/ui";

interface ConfirmButtonProps {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

/**
 * Two-step delete. The second click within a few seconds does it — no modal,
 * but no accidental deletions either.
 */
export function ConfirmButton({
  label,
  confirmLabel = "Click again to confirm",
  onConfirm,
  variant = "quiet",
  size = "sm",
  disabled,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      variant={armed ? "danger" : variant}
      size={size}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}
