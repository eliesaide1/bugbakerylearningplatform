import { useEffect, useMemo, useState } from "react";
import { Button, CheckGlyph } from "@shared/ui";
import type { LessonPractice, PracticeCheck } from "@shared/types";

/** Where each lesson's attempt is kept, so a refresh does not wipe the work. */
const draftKey = (id: string) => `bugbakery.practice.${id}`;

interface Result {
  check: PracticeCheck;
  passed: boolean;
}

/**
 * Run the rules over what was typed.
 *
 * Deliberately the same three kinds the bootcamp's server-side checks use, and
 * deliberately run here in the browser: nothing on this page is graded, so a
 * round trip would buy nothing and cost the thing that matters — the answer
 * arriving while your hands are still on the keys.
 */
function evaluate(practice: LessonPractice, code: string): Result[] {
  return (practice.checks ?? []).map((check) => {
    let passed = false;
    try {
      if (check.kind === "regex") {
        passed = new RegExp(check.value, check.caseSensitive ? "" : "i").test(code);
      } else {
        const hay = check.caseSensitive ? code : code.toLowerCase();
        const needle = check.caseSensitive ? check.value : check.value.toLowerCase();
        const found = hay.includes(needle);
        passed = check.kind === "not-contains" ? !found : found;
      }
    } catch {
      // A malformed pattern is the author's mistake, not the learner's.
      passed = true;
    }
    return { check, passed };
  });
}

export function PracticePanel({
  practice,
  lessonId,
  className = "",
}: {
  practice: LessonPractice;
  lessonId: string;
  className?: string;
}) {
  // Some lessons have nothing to build. Asking someone to type a variable just
  // to have an exercise teaches nothing; a claim to judge does.
  if (practice.questions?.length) {
    return <TrueFalse practice={practice} lessonId={lessonId} className={className} />;
  }
  return <CodeExercise practice={practice} lessonId={lessonId} className={className} />;
}

function CodeExercise({
  practice,
  lessonId,
  className = "",
}: {
  practice: LessonPractice;
  lessonId: string;
  className?: string;
}) {
  const [code, setCode] = useState(practice.starter ?? "");
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  // Restore the last attempt for this lesson.
  useEffect(() => {
    const saved = localStorage.getItem(draftKey(lessonId));
    setCode(saved ?? practice.starter ?? "");
    setChecked(false);
    setRevealed(0);
    setShowSolution(false);
  }, [lessonId, practice.starter]);

  useEffect(() => {
    const id = window.setTimeout(() => localStorage.setItem(draftKey(lessonId), code), 400);
    return () => window.clearTimeout(id);
  }, [lessonId, code]);

  const results = useMemo(() => evaluate(practice, code), [practice, code]);
  const passing = results.filter((r) => r.passed).length;
  const solved = results.length > 0 && passing === results.length;
  const hints = practice.hints ?? [];

  return (
    <section
      className={`overflow-hidden rounded-panel border border-line-strong bg-panel ${className}`}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <h2 className="font-display text-[1.05rem] font-extrabold">Try it yourself</h2>
        {results.length ? (
          <span
            className={`ml-auto font-mono text-[0.76rem] tabular-nums ${
              solved && checked ? "text-secondary-deep" : "text-muted"
            }`}
          >
            {checked ? `${passing} of ${results.length} checks pass` : `${results.length} checks`}
          </span>
        ) : null}
      </header>

      {practice.brief ? (
        <p className="px-5 pt-4 text-[0.95rem] leading-snug text-ink-2">{practice.brief}</p>
      ) : null}

      <div className="px-5 pt-4">
        <label htmlFor={`practice-${lessonId}`} className="sr-only">
          Your code
        </label>
        <textarea
          id={`practice-${lessonId}`}
          value={code}
          spellCheck={false}
          onChange={(e) => {
            setCode(e.target.value);
            // Stop shouting the moment they start fixing it.
            if (checked) setChecked(false);
          }}
          rows={Math.min(18, Math.max(6, code.split("\n").length + 2))}
          className="w-full resize-y rounded-card border border-line-strong bg-ink px-4 py-3 font-mono text-[0.82rem] leading-relaxed text-on-dark caret-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
        />
      </div>

      {practice.expect ? (
        <div className="mt-4 px-5">
          <p className="mb-1.5 font-mono text-[0.72rem] tracking-wide text-muted uppercase">
            It should produce
          </p>
          <pre className="overflow-x-auto rounded-card border border-line bg-paper px-4 py-3 font-mono text-[0.8rem] leading-relaxed whitespace-pre-wrap break-words text-ink-2">
            <code>{practice.expect}</code>
          </pre>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5 px-5 pt-3">
        <Button onClick={() => setChecked(true)} disabled={!results.length}>
          Check my answer
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            setCode(practice.starter ?? "");
            setChecked(false);
          }}
        >
          Reset
        </Button>
        {hints.length && revealed < hints.length ? (
          <Button variant="quiet" onClick={() => setRevealed((n) => n + 1)}>
            {revealed === 0 ? "Hint" : "Next hint"}
          </Button>
        ) : null}
      </div>

      {/* The verdict. Only after asking — checking as they type would flash red
          at every half-written line. */}
      {checked ? (
        <div className="px-5 pt-4">
          {solved ? (
            <p className="flex items-center gap-2 rounded-card border border-secondary bg-secondary-soft px-4 py-3 text-[0.94rem] font-semibold text-secondary-deep">
              <CheckGlyph className="size-4 flex-none" />
              That's it — every check passes.
            </p>
          ) : null}

          <ul className="mt-3 space-y-1.5">
            {results.map((r, i) => (
              <li
                key={i}
                className={`grid grid-cols-[auto_1fr] items-start gap-2.5 text-[0.92rem] ${
                  r.passed ? "text-muted" : "text-ink-2"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-[3px] font-mono text-[0.8rem] ${
                    r.passed ? "text-secondary-deep" : "text-danger"
                  }`}
                >
                  {r.passed ? "✓" : "✕"}
                </span>
                <span>{r.check.message || describe(r.check)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {revealed > 0 ? (
        <div className="mx-5 mt-4 border-l-2 border-primary pl-4">
          {hints.slice(0, revealed).map((hint, i) => (
            <p key={i} className="mt-2 text-[0.93rem] text-ink-2 first:mt-0">
              {hint}
            </p>
          ))}
        </div>
      ) : null}

      {practice.solution ? (
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => setShowSolution((v) => !v)}
            className="cursor-pointer font-mono text-[0.78rem] text-muted underline-offset-4 hover:text-primary hover:underline"
          >
            {showSolution ? "Hide the answer" : "Show the answer"}
          </button>
          {showSolution ? (
            <pre className="animate-panel-open mt-2 overflow-x-auto rounded-card bg-ink px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-on-dark">
              <code>{practice.solution}</code>
            </pre>
          ) : null}
        </div>
      ) : null}

      <div className="h-5" />
    </section>
  );
}

/** A readable line for a check the author left unlabelled. */
function describe(check: PracticeCheck) {
  if (check.kind === "not-contains") return `Should not contain "${check.value}"`;
  if (check.kind === "regex") return `Should match ${check.value}`;
  return `Should contain "${check.value}"`;
}


/* ------------------------- true or false ------------------------- */

/**
 * For lessons with nothing to build. Each statement is answered, then explained
 * — the reason is the part worth having, so it is shown either way rather than
 * only when they are wrong.
 */
function TrueFalse({
  practice,
  lessonId,
  className = "",
}: {
  practice: LessonPractice;
  lessonId: string;
  className?: string;
}) {
  const questions = practice.questions ?? [];
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => setAnswers({}), [lessonId]);

  const answered = Object.keys(answers).length;
  const right = questions.filter((q, i) => i in answers && answers[i] === q.answer).length;

  return (
    <section
      className={`overflow-hidden rounded-panel border border-line-strong bg-panel ${className}`}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <h2 className="font-display text-[1.05rem] font-extrabold">Check yourself</h2>
        <span
          className={`ml-auto font-mono text-[0.76rem] tabular-nums ${
            answered === questions.length && right === questions.length
              ? "text-secondary-deep"
              : "text-muted"
          }`}
        >
          {answered ? `${right} of ${questions.length} right` : `${questions.length} statements`}
        </span>
      </header>

      {practice.brief ? (
        <p className="px-5 pt-4 text-[0.95rem] leading-snug text-ink-2">{practice.brief}</p>
      ) : null}

      <ol className="m-0 list-none p-0">
        {questions.map((q, i) => {
          const given = answers[i];
          const done = i in answers;
          const correct = done && given === q.answer;

          return (
            <li key={i} className="border-t border-line px-5 py-4 first:border-t-0">
              <p className="text-[0.96rem] leading-snug text-ink-2">{q.statement}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[true, false].map((value) => {
                  const chosen = done && given === value;
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [i]: value }))}
                      aria-pressed={chosen}
                      className={`cursor-pointer rounded-card border px-4 py-1.5 text-[0.9rem] font-semibold transition-colors ${
                        chosen
                          ? correct
                            ? "border-secondary bg-secondary-soft text-secondary-deep"
                            : "border-danger bg-danger/5 text-danger"
                          : "border-line-strong text-ink-2 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {value ? "True" : "False"}
                    </button>
                  );
                })}

                {done ? (
                  <span
                    className={`ml-1 font-mono text-[0.78rem] ${
                      correct ? "text-secondary-deep" : "text-danger"
                    }`}
                  >
                    {correct ? "correct" : `it is ${q.answer ? "true" : "false"}`}
                  </span>
                ) : null}
              </div>

              {/* The reason is the lesson, so it appears however they answered. */}
              {done && q.because ? (
                <p className="animate-panel-open mt-3 border-l-2 border-line-strong pl-4 text-[0.9rem] leading-snug text-muted">
                  {q.because}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
