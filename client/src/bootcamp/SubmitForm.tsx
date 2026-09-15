import { useEffect, useState } from "react";
import { Alert, Button, Spinner, TextArea, TextBox } from "@shared/ui";
import type { PublicStep } from "@shared/types";
import type { SubmitInput } from "../api/queries";
import {
  useAnswerGuards,
  useNativeInsertGuard,
  useProtection,
} from "./protection";

interface SubmitFormProps {
  step: PublicStep;
  submitting: boolean;
  error?: unknown;
  onSubmit: (input: Omit<SubmitInput, "stepId">) => void;
}

/** What each kind of step asks you to hand in. */
export function SubmitForm({
  step,
  submitting,
  error,
  onSubmit,
}: SubmitFormProps) {
  const guards = useAnswerGuards();
  const { snapshot, restart } = useProtection();
  // Covers every insertion path the paste and drop handlers miss.
  const formRef = useNativeInsertGuard<HTMLFormElement>();
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [commitUrl, setCommitUrl] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [requestHuman, setRequestHuman] = useState(false);

  // Moving to another step must not carry the last one's answer with it.
  useEffect(() => {
    setCode("");
    setNotes("");
    setRepoUrl("");
    setCommitUrl("");
    setAnswers(step.quiz?.map(() => "") ?? []);
    setRequestHuman(false);
    restart(step.id);
  }, [step.id, step.quiz, restart]);

  const wantsCode = step.kind === "task" || step.kind === "bug";
  const wantsUrls = step.kind === "push";
  const wantsAnswers = step.kind === "quiz";

  const ready =
    (wantsCode && (code.trim() || notes.trim())) ||
    (wantsUrls && repoUrl.trim()) ||
    (wantsAnswers && answers.some((a) => a.trim())) ||
    (!wantsCode && !wantsUrls && !wantsAnswers && notes.trim());

  const submit = () => {
    if (!ready || submitting) return;
    onSubmit({
      code: code.trim() || undefined,
      notes: notes.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
      commitUrl: commitUrl.trim() || undefined,
      answers: wantsAnswers ? answers : undefined,
      requestHuman,
      integrity: snapshot(),
    });
  };

  return (
    <form
      ref={formRef}
      className="mt-8 border-t border-line pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h3 className="font-display text-[1.15rem] font-extrabold">Hand it in</h3>

      {guards.blocked ? (
        <p className="mt-1 mb-4 text-[0.88rem] text-muted">
          Pasting is turned off for this track — type your answer. Writing it
          out is most of why it sticks.
        </p>
      ) : null}

      {wantsCode ? (
        <TextArea
          label={step.kind === "bug" ? "Your fixed code" : "Your code"}
          hint={
            step.kind === "bug"
              ? "just the part you changed is fine"
              : undefined
          }
          rows={14}
          className="font-mono text-[0.85rem]"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          {...guards.props}
          placeholder={
            step.kind === "bug" ? "// the corrected handler" : "// your code"
          }
        />
      ) : null}

      {/* The url fields are deliberately left pasteable. Nobody should retype a
          40-character commit hash by hand, and a url is not the answer to
          anything — the code and the explanation are what the block is for. */}
      {wantsUrls ? (
        <div className="grid gap-x-4 md:grid-cols-2">
          <TextBox
            label="Repository url"
            placeholder="https://github.com/you/project"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <TextBox
            label="Commit url"
            hint={step.push?.requireCommitUrl ? undefined : "(optional)"}
            placeholder="https://github.com/you/project/commit/…"
            value={commitUrl}
            onChange={(e) => setCommitUrl(e.target.value)}
          />
        </div>
      ) : null}

      {wantsAnswers
        ? step.quiz.map((question, i) => (
            <TextArea
              key={question._id ?? i}
              label={`${i + 1}. ${question.prompt}`}
              rows={3}
              {...guards.props}
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((current) =>
                  current.map((a, j) => (j === i ? e.target.value : a)),
                )
              }
            />
          ))
        : null}

      <TextArea
        label={
          step.kind === "bug"
            ? "What was actually wrong?"
            : "Notes for your reviewer"
        }
        hint={
          step.kind === "bug"
            ? "this counts as much as the fix — say what caused it, not what you changed"
            : "anything you want the reviewer to know"
        }
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        {...guards.props}
      />

      <label className="mb-4 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={requestHuman}
          onChange={(e) => setRequestHuman(e.target.checked)}
          className="mt-1 size-4 accent-[var(--color-primary)]"
        />
        <span className="text-[0.93rem] text-ink-2">
          I would like a person to look at this
          <span className="block text-[0.85rem] text-muted">
            Always available, whatever the automatic review says.
          </span>
        </span>
      </label>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {(error as Error).message}
        </Alert>
      ) : null}

      <Button type="submit" disabled={!ready || submitting}>
        {submitting ? <Spinner /> : null}
        {submitting ? "Sending…" : "Submit for review"}
      </Button>
    </form>
  );
}
