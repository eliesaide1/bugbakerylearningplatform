import { useState } from "react";
import { Button } from "@shared/ui";
import type { PublicStep } from "@shared/types";
import { Protected } from "./protection";

/**
 * The bug as it is handed to the trainee: the symptom a user reported, the code
 * as it stands, and hints they have to choose to open. Hints are revealed one
 * at a time on purpose — the struggle before the hint is where the learning is,
 * and a wall of them would be read as one paragraph and skipped.
 */
export function BugPanel({ step }: { step: PublicStep }) {
  const bug = step.bug;
  const [revealed, setRevealed] = useState(0);
  if (!bug) return null;

  const hints = bug.hints ?? [];

  return (
    <Protected className="protected-surface mt-6 space-y-5">
      {bug.symptom ? (
        <div className="border-l-4 border-danger bg-danger/5 px-5 py-4">
          <p className="font-mono text-[0.72rem] tracking-wide text-danger uppercase">
            Reported symptom
          </p>
          <p className="mt-1.5 text-ink-2">{bug.symptom}</p>
        </div>
      ) : null}

      {bug.code ? (
        <div className="overflow-hidden rounded-panel border border-line-strong">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-2">
            <span className="font-mono text-[0.76rem] text-ink-2">
              {bug.filename || "the code you were given"}
            </span>
            <span className="font-mono text-[0.7rem] text-muted">{bug.language}</span>
          </div>
          <pre className="overflow-x-auto bg-ink px-4 py-4 text-[0.82rem] leading-relaxed text-on-dark">
            <code>{bug.code}</code>
          </pre>
        </div>
      ) : null}

      {bug.stackTrace ? (
        <div className="overflow-hidden rounded-panel border border-line-strong">
          <div className="border-b border-line bg-panel px-4 py-2 font-mono text-[0.76rem] text-ink-2">
            Stack trace
          </div>
          <pre className="overflow-x-auto bg-ink px-4 py-3 text-[0.78rem] text-on-dark-muted">
            <code>{bug.stackTrace}</code>
          </pre>
        </div>
      ) : null}

      {bug.acceptance?.length ? (
        <div>
          <h3 className="font-display text-[1rem] font-extrabold">A correct fix does all of this</h3>
          <ul className="mt-2 space-y-1.5">
            {bug.acceptance.map((line, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr] gap-3 text-[0.94rem] text-ink-2">
                <span aria-hidden="true" className="mt-[10px] h-px w-3 bg-line-strong" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hints.length ? (
        <div className="border border-dashed border-line-strong px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-[1rem] font-extrabold">Hints</p>
            <p className="font-mono text-[0.72rem] tabular-nums text-muted">
              {revealed} of {hints.length} opened
            </p>
          </div>
          <p className="mt-1 text-[0.88rem] text-muted">
            Try it yourself first. The time spent stuck is the part that teaches you.
          </p>

          {hints.slice(0, revealed).map((hint, i) => (
            <p
              key={i}
              className="animate-panel-open mt-3 border-l-2 border-primary pl-4 text-[0.94rem] text-ink-2"
            >
              {hint}
            </p>
          ))}

          {revealed < hints.length ? (
            <Button
              variant="quiet"
              size="sm"
              className="mt-4"
              onClick={() => setRevealed((n) => n + 1)}
            >
              {revealed === 0 ? "Open the first hint" : "Open the next hint"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Protected>
  );
}
