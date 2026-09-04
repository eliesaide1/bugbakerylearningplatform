/** Small glyphs used by both apps: curriculum rows, playlists, disclosure. */

export function PlayGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} flex-none`}>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 5.2 11 8l-4.5 2.8z" fill="currentColor" />
    </svg>
  );
}

export function LockGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} flex-none`}>
      <rect x="3.5" y="7" width="9" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Disclosure arrow. Points right when closed, down when open. */
export function Chevron({ open, className = "size-3.5" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`${className} flex-none transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckGlyph({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} flex-none`}>
      <path
        d="M3 8.5 6.2 11.5 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The Bug Bakery mark in a single colour, for placeholders where no artwork has
 * been uploaded. Takes `currentColor`, so the caller sets the tint.
 */
export function MarkGlyph({ className = "size-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
        <path d="M25.5 30C23 22 19.5 17.5 15.5 14.5" />
        <path d="M38.5 30C41 22 44.5 17.5 48.5 14.5" />
      </g>
      <circle cx="15" cy="14" r="3.5" fill="currentColor" />
      <circle cx="49" cy="14" r="3.5" fill="currentColor" />
      <path d="M10 48a22 20 0 0 1 44 0z" fill="currentColor" />
      <path d="M7 51h50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function MailGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} flex-none`}>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 4.5 8 9l6-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} flex-none`}>
      <path
        d="M14 8.2c0 2.7-2.7 4.9-6 4.9a7 7 0 0 1-1.9-.26L2.5 14l1-2.6A4.6 4.6 0 0 1 2 8.2C2 5.5 4.7 3.3 8 3.3s6 2.2 6 4.9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`${className} flex-none`}>
      <circle cx="8" cy="5.8" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.8 13.4a5.2 5.2 0 0 1 10.4 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
