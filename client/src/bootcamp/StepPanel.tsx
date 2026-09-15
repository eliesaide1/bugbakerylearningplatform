import { Badge, Button, RichText, Spinner } from "@shared/ui";
import type { PublicStep, Submission } from "@shared/types";
import { asMedia } from "../api/client";
import { VideoPlayer } from "../components/VideoPlayer";
import { BugPanel } from "./BugPanel";
import { SubmitForm } from "./SubmitForm";
import { Feedback } from "./Feedback";
import { KIND_LABEL, minutes } from "./kinds";
import { Protected } from "./protection";
import type { SubmitInput } from "../api/queries";

interface StepPanelProps {
  step: PublicStep;
  index: number;
  total: number;
  submission?: Submission;
  done: boolean;
  submitting: boolean;
  completing: boolean;
  submitError?: unknown;
  onSubmit: (input: Omit<SubmitInput, "stepId">) => void;
  onComplete: () => void;
}

export function StepPanel({
  step,
  index,
  total,
  submission,
  done,
  submitting,
  completing,
  submitError,
  onSubmit,
  onComplete,
}: StepPanelProps) {
  const lesson = typeof step.lesson === "object" ? step.lesson : null;

  return (
    <article>
      <header>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.74rem] tracking-wide text-muted uppercase">
          <span>Week {step.week ?? 1}</span>
          <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
          <span>
            Step {index + 1} of {total}
          </span>
          <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
          <span className="text-primary">{KIND_LABEL[step.kind]}</span>
          {step.estimateMinutes ? <span>{minutes(step.estimateMinutes)}</span> : null}
          {step.points ? <span>{step.points} points</span> : null}
        </p>

        <h1 className="mt-2 text-step-3">{step.title}</h1>

        <div className="mt-3 flex flex-wrap gap-2">
          {done ? <Badge tone="secondary">passed</Badge> : null}
          {step.milestone ? <Badge tone="primary">a person reviews this one</Badge> : null}
        </div>

        {step.summary ? (
          <p className="mt-4 max-w-[64ch] text-step-1 leading-[1.5] text-ink-2">{step.summary}</p>
        ) : null}
      </header>

      {step.kind === "watch" && (lesson || step.videoUrl) ? (
        <div className="mt-6">
          <VideoPlayer
            lesson={
              lesson ?? {
                id: step.id,
                program: "",
                title: step.title,
                slug: step.slug,
                source: "url",
                videoUrl: step.videoUrl,
                isFree: true,
                order: 0,
                visible: true,
                media: null,
                thumbnail: null,
              }
            }
            poster={asMedia(lesson?.thumbnail)}
          />
        </div>
      ) : null}

      {step.brief ? (
        <Protected className="protected-surface">
          <RichText text={step.brief} className="mt-6 max-w-[68ch]" />
        </Protected>
      ) : null}

      {step.deliverables?.length ? (
        <Protected className="protected-surface mt-6">
          <h3 className="font-display text-[1.05rem] font-extrabold">What to hand in</h3>
          <ul className="mt-2 space-y-1.5">
            {step.deliverables.map((item, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr] gap-3 text-[0.95rem] text-ink-2">
                <span aria-hidden="true" className="mt-[10px] h-px w-3 bg-line-strong" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Protected>
      ) : null}

      {step.starterRepo ? (
        <p className="mt-4 text-[0.93rem]">
          <a
            href={step.starterRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
          >
            Starter repository ↗
          </a>
        </p>
      ) : null}

      {step.kind === "bug" ? <BugPanel step={step} /> : null}

      {step.kind === "push" && step.push ? (
        <div className="mt-6 border border-line-strong bg-panel px-5 py-4">
          <h3 className="font-display text-[1.05rem] font-extrabold">Before you push</h3>
          <dl className="mt-2 grid gap-y-1 text-[0.93rem] text-ink-2 sm:grid-cols-[10rem_1fr]">
            {step.push.branch ? (
              <>
                <dt className="text-muted">Branch</dt>
                <dd className="m-0 font-mono">{step.push.branch}</dd>
              </>
            ) : null}
            {step.push.commitMessage ? (
              <>
                <dt className="text-muted">Commit message</dt>
                <dd className="m-0">{step.push.commitMessage}</dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}

      {step.requiresSubmission ? (
        <SubmitForm step={step} submitting={submitting} error={submitError} onSubmit={onSubmit} />
      ) : (
        <div className="mt-8 border-t border-line pt-6">
          {done ? (
            <p className="text-[0.95rem] text-muted">Done — pick the next step from the list.</p>
          ) : (
            <Button onClick={onComplete} disabled={completing}>
              {completing ? <Spinner /> : null}
              {step.kind === "watch" ? "I have watched this" : "I have read this"}
            </Button>
          )}
        </div>
      )}

      {submission ? <Feedback submission={submission} /> : null}
    </article>
  );
}
