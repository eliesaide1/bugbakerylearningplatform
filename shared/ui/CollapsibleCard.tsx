import { useId, type ReactNode } from "react";
import { Chevron } from "./Icons";

interface CollapsibleCardProps {
  open: boolean;
  onToggle: () => void;
  title: ReactNode;
  /** Small mono label left of the title, usually a position like "01". */
  eyebrow?: ReactNode;
  /** Second line, always shown. */
  subtitle?: ReactNode;
  /** Second line shown only while the card is closed. */
  collapsedSubtitle?: ReactNode;
  /** Controls beside the header — buttons, badges. Kept out of the toggle. */
  actions?: ReactNode;
  /** Dims the title, for hidden or unpublished rows. */
  muted?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A card that folds away: header is the toggle, everything else sits beside it.
 * Used by every list in the CMS so they behave identically, and by the course
 * contents on the public site.
 */
export function CollapsibleCard({
  open,
  onToggle,
  title,
  eyebrow,
  subtitle,
  collapsedSubtitle,
  actions,
  muted = false,
  className = "",
  children,
}: CollapsibleCardProps) {
  const panelId = `card-${useId()}`;

  return (
    <div
      className={`border bg-panel transition-colors ${
        open ? "border-primary" : "border-line-strong"
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`group grid min-w-0 flex-1 cursor-pointer items-center gap-x-3 px-4 py-3 text-left ${
            eyebrow === undefined ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_auto_1fr]"
          }`}
        >
          <Chevron open={open} className="size-3.5 text-primary" />

          {eyebrow === undefined ? null : (
            <span className="font-mono text-[0.76rem] tabular-nums text-muted">{eyebrow}</span>
          )}

          <span className="min-w-0">
            <span
              className={`block truncate font-display text-[1rem] font-extrabold group-hover:text-primary ${
                muted ? "text-muted" : ""
              }`}
            >
              {title}
            </span>
            {subtitle ? (
              <span className="mt-0.5 block truncate text-[0.8rem] text-muted">{subtitle}</span>
            ) : null}
            {!open && collapsedSubtitle ? (
              <span className="mt-0.5 block truncate text-[0.8rem] text-muted">
                {collapsedSubtitle}
              </span>
            ) : null}
          </span>
        </button>

        {actions ? <div className="flex flex-none items-center gap-1.5 pr-3">{actions}</div> : null}
      </div>

      {open ? (
        <div id={panelId} className="animate-panel-open border-t border-line px-4 pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
