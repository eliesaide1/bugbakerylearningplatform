import { useState, type ReactNode } from "react";

interface AccordionProps {
  /** Rendered inside the trigger, left of the toggle icon. */
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

/** One expandable row. Used by both the programs list and the FAQ. */
export function Accordion({
  header,
  children,
  defaultOpen = false,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `accordion-${useStableId()}`;

  return (
    <div className={`border-b border-line-strong ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`group flex w-full cursor-pointer items-center gap-5 py-5 text-left ${headerClassName}`}
      >
        <span className="min-w-0 flex-1">{header}</span>
        <ToggleIcon open={open} />
      </button>

      {open ? (
        <div id={panelId} className={`animate-panel-open pb-7 ${bodyClassName}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ToggleIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-[26px] flex-none place-items-center rounded-full border text-[1.1rem] transition-transform duration-200 group-hover:scale-110 ${
        open ? "border-primary bg-primary text-white" : "border-line-strong text-primary"
      }`}
    >
      {open ? "−" : "+"}
    </span>
  );
}

let counter = 0;
function useStableId() {
  const [id] = useState(() => {
    counter += 1;
    return counter;
  });
  return id;
}
