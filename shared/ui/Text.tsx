import { bandOf, type SectionTheme } from "../styles";

export function Eyebrow({
  children,
  theme = "paper",
  className = "",
}: {
  children: React.ReactNode;
  theme?: SectionTheme;
  className?: string;
}) {
  return (
    <span className={`block font-mono text-[0.78rem] tracking-wide ${bandOf(theme).eyebrow} ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeading({
  theme = "paper",
  eyebrow,
  title,
  lede,
  className = "",
}: {
  theme?: SectionTheme;
  eyebrow?: string;
  title?: string;
  lede?: string;
  className?: string;
}) {
  const band = bandOf(theme);
  if (!title && !lede && !eyebrow) return null;

  return (
    <div className={className}>
      {eyebrow ? (
        <Eyebrow theme={theme} className="mb-3">
          {eyebrow}
        </Eyebrow>
      ) : null}
      {title ? <h2 className={`mb-3.5 text-step-3 ${band.title}`}>{title}</h2> : null}
      {lede ? <p className={`max-w-[62ch] text-step-1 leading-[1.5] ${band.lede}`}>{lede}</p> : null}
    </div>
  );
}

/** Text from the CMS keeps its blank-line paragraph breaks. */
export function RichText({ text, className = "" }: { text?: string; className?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={`prose-body ${className}`}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{inline(para)}</p>
      ))}
    </div>
  );
}

/**
 * The two marks worth supporting in a CMS text box: **bold** and `code`.
 *
 * Not a markdown parser — a whole one would invite headings and tables into
 * fields that are laid out as paragraphs, and would mean trusting editor input
 * as markup. This only recognises two delimiters and still renders text, so
 * nothing an author types can become HTML.
 */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <b key={i} className="font-semibold text-ink">{part.slice(2, -2)}</b>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded-[3px] bg-paper px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/** Bulleted list stored one item per line in a CMS text field. */
export function BulletList({ text, className = "" }: { text?: string; className?: string }) {
  const lines = (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <ul className={`m-0 list-disc pl-5 ${className}`}>
      {lines.map((line, i) => (
        <li key={i} className="mb-1.5">
          {line}
        </li>
      ))}
    </ul>
  );
}
