import type { ReactNode } from "react";

/**
 * Lesson body text: paragraphs, code blocks, and lists, from one CMS field.
 *
 * Not a markdown parser. A full one would invite headings, tables and raw HTML
 * into a field laid out as prose, and would mean trusting editor input as
 * markup. This recognises four things — a fenced block, a bullet line, **bold**
 * `code`, *emphasis* and **bold** — and everything it emits is text, so nothing
 * an author types can become an element.
 */
export function Prose({ text, className = "" }: { text?: string; className?: string }) {
  if (!text?.trim()) return null;

  return (
    <div className={className}>
      {blocks(text).map((block, i) =>
        block.kind === "code" ? (
          <CodeBlock key={i} code={block.body} language={block.language} />
        ) : block.kind === "heading" ? (
          <h3
            key={i}
            className="mt-9 mb-3 font-display text-[1.2rem] font-extrabold tracking-[-0.015em] text-ink"
          >
            {block.body}
          </h3>
        ) : block.kind === "list" ? (
          <ul key={i} className="my-4 list-none space-y-2 pl-0">
            {block.items.map((item, j) => (
              <li key={j} className="grid grid-cols-[auto_1fr] gap-3">
                <span aria-hidden="true" className="mt-[11px] h-px w-3 flex-none bg-line-strong" />
                <span className="text-[1rem] leading-relaxed text-ink-2">{inline(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="my-4 text-[1rem] leading-relaxed text-ink-2">
            {inline(block.body)}
          </p>
        )
      )}
    </div>
  );
}

type Block =
  | { kind: "text"; body: string }
  | { kind: "heading"; body: string }
  | { kind: "code"; body: string; language?: string }
  | { kind: "list"; items: string[] };

const FENCE = /```(\w+)?\n([\s\S]*?)```/g;

/** Split the field into fenced blocks, headings, bullet runs, and paragraphs. */
function blocks(text: string): Block[] {
  const out: Block[] = [];
  let cursor = 0;

  // Walk the fences and treat everything between them as prose. Splitting on
  // the fence markers themselves tears each block in half at its closing line.
  for (const match of text.matchAll(FENCE)) {
    const index = match.index ?? 0;
    if (index > cursor) out.push(...prose(text.slice(cursor, index)));
    out.push({ kind: "code", language: match[1], body: match[2].replace(/\n$/, "") });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) out.push(...prose(text.slice(cursor)));

  return out;
}

function prose(text: string): Block[] {
  const out: Block[] = [];
  for (const para of text.split(/\n{2,}/)) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      out.push({ kind: "heading", body: trimmed.slice(3).trim() });
      continue;
    }
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      out.push({ kind: "list", items: lines.map((l) => l.trim().slice(2)) });
    } else {
      out.push({ kind: "text", body: trimmed });
    }
  }
  return out;
}

// Bold is matched before emphasis so ** never reads as two single stars, and
// lazily so a bold run may contain a literal * inside a code span — "`*` is
// for development" is one sentence. Both forms open on a non-space and stay on
// one line, which keeps a stray asterisk from swallowing the rest of the text.
const INLINE = /(\*\*(?!\s)[^\n]+?\*\*|\*[^\s*][^*\n]*\*|`[^`]+`)/g;

function inline(text: string): ReactNode {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      // A bold run can hold code — "Forget `next()` and it hangs" is one
      // sentence, and splitting it in two to satisfy the parser would be
      // writing around the tool.
      return (
        <b key={i} className="font-semibold text-ink">
          {codeSpans(part.slice(2, -2))}
        </b>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{codeSpans(part.slice(1, -1))}</em>;
    }
    return <span key={i}>{codeSpans(part)}</span>;
  });
}

function codeSpans(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code
        key={i}
        className="rounded-[3px] bg-paper px-1.5 py-0.5 font-mono text-[0.88em] font-normal text-ink"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

/* ------------------------------ code ------------------------------ */

const KEYWORDS =
  /\b(const|let|var|function|return|if|else|await|async|new|require|import|from|export|default|class|extends|try|catch|throw|for|while|of|in|typeof)\b/;

/** Enough highlighting to read by. Not a parser — a reading aid. */
function tokenise(line: string): ReactNode {
  const parts = line.split(/(\/\/.*$|'[^']*'|"[^"]*"|`[^`]*`|\b\d+\b)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("//")) return <span key={i} className="text-muted italic">{part}</span>;
    if (/^['"`]/.test(part)) return <span key={i} className="text-secondary">{part}</span>;
    if (/^\d+$/.test(part)) return <span key={i} className="text-tertiary">{part}</span>;

    return part.split(/(\b\w+\b)/g).map((word, j) => {
      if (KEYWORDS.test(word)) return <span key={j} className="text-primary-soft">{word}</span>;
      return word;
    });
  });
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <figure className="my-5 overflow-hidden rounded-panel border border-border-dark bg-ink">
      {language ? (
        <figcaption className="border-b border-border-dark px-4 py-2 font-mono text-[0.72rem] tracking-wide text-muted uppercase">
          {language}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.82rem] leading-relaxed text-on-dark">
        <code>
          {code.split("\n").map((line, i) => (
            <span key={i} className="block">
              {tokenise(line)}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
