import { useState } from "react";
import { Alert, Badge, Button, EmptyState, Spinner, TextArea } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import {
  useAiStatus,
  useQueueStats,
  useReviewSubmission,
  useSubmissions,
  useTestAi,
  type QueuedSubmission,
} from "../api/queries";

const FILTERS = [
  { value: "", label: "Everything waiting" },
  { value: "milestone", label: "Milestones" },
  { value: "low-confidence", label: "Reviewer unsure" },
  { value: "repeat-failure", label: "Stuck trainees" },
  { value: "requested", label: "Asked for a person" },
  { value: "peer-split", label: "Peers disagreed" },
  { value: "integrity", label: "Looks pasted" },
  { value: "audit", label: "Spot checks" },
];

/**
 * What is left after the ladder has done its work. Blocked trainees sort to the
 * top; spot checks — work that already passed — sort to the bottom, because
 * nobody is waiting on them.
 */
export default function ReviewQueuePage() {
  const [filter, setFilter] = useState("");
  const stats = useQueueStats();
  const submissions = useSubmissions({ queue: "1", ...(filter ? { escalation: filter } : {}) });
  const decide = useReviewSubmission();

  const rows = submissions.data ?? [];

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Only work the automatic ladder could not settle reaches here: milestones, cases the reviewer was unsure about, trainees who are stuck, and a small sample of passes kept honest."
        badge={stats.data ? `${stats.data.blocking} blocking` : undefined}
      />

      <AiPanel />

      {stats.data?.queue.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const count = option.value
              ? (stats.data.queue.find((q) => q.escalation === option.value)?.count ?? 0)
              : stats.data.queue.reduce((sum, q) => sum + q.count, 0);
            if (option.value && !count) return null;

            return (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? "solid" : "quiet"}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                <span className="font-mono text-[0.75rem] tabular-nums opacity-70">{count}</span>
              </Button>
            );
          })}
        </div>
      ) : null}

      {submissions.isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !rows.length ? (
        <EmptyState
          title="Nothing waiting on you"
          message="Every submission so far was settled by the checks, the reviewer, or a pair of peers."
        />
      ) : (
        <div className="space-y-6">
          {rows.map((row) => (
            <QueueCard
              key={row.id}
              row={row}
              saving={decide.isPending}
              onDecide={(status, note) => decide.mutate({ id: row.id, status, note })}
            />
          ))}
        </div>
      )}

      {decide.isError ? (
        <Alert tone="danger" className="mt-6">
          {(decide.error as Error).message}
        </Alert>
      ) : null}
    </>
  );
}

/** Which reviewer is running, and whether it actually answers. */
function AiPanel() {
  const { data: status } = useAiStatus();
  const test = useTestAi();

  return (
    <div className="mb-8 border border-line-strong bg-panel px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-[1.05rem] font-extrabold">
            Automatic reviewer:{" "}
            <span className={status?.configured ? "text-secondary-deep" : "text-muted"}>
              {status?.provider ?? "…"}
            </span>
          </p>
          <p className="mt-1 text-[0.88rem] text-muted">
            {status?.model ? `${status.model} · ` : ""}
            {status?.note ?? "Reviewing submissions before they reach you."}
          </p>
        </div>
        <Button variant="quiet" size="sm" onClick={() => test.mutate()} disabled={test.isPending}>
          {test.isPending ? <Spinner /> : null}
          Test it
        </Button>
      </div>

      {test.isSuccess ? (
        <Alert tone="success" className="mt-3">
          Reachable. It replied “{test.data.review.summary}”
        </Alert>
      ) : null}
      {test.isError ? (
        <Alert tone="danger" className="mt-3">
          {(test.error as Error).message}
        </Alert>
      ) : null}
    </div>
  );
}

function QueueCard({
  row,
  saving,
  onDecide,
}: {
  row: QueuedSubmission;
  saving: boolean;
  onDecide: (status: "passed" | "changes-requested" | "failed", note?: string) => void;
}) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <article className="border border-line-strong bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-[1.15rem] font-extrabold">
            {row.stepInfo?.title ?? "A step"}
          </h2>
          <p className="mt-1 font-mono text-[0.78rem] text-muted">
            {row.traineeInfo?.name ?? "A trainee"} · attempt {row.attempt} ·{" "}
            {new Date(row.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          {row.escalationLabel ? (
            <Badge tone={row.escalation === "integrity" ? "danger" : "primary"}>
              {row.escalationLabel}
            </Badge>
          ) : null}
          {row.reviewState === "timeout" ? <Badge>reviewer timed out</Badge> : null}
          {row.status === "passed" ? <Badge tone="secondary">already passed</Badge> : null}
        </div>
      </div>

      {row.review ? (
        <div className="mt-4 border-l-2 border-line-strong pl-4">
          <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
            {row.review.provider} said {row.review.verdict}
            {row.review.confidence != null
              ? ` · ${Math.round(row.review.confidence * 100)}% sure`
              : ""}
          </p>
          <p className="mt-1.5 text-[0.94rem] text-ink-2">{row.review.summary}</p>
          {row.review.issues?.map((issue, i) => (
            <p key={i} className="mt-2 text-[0.92rem]">
              <b>{issue.title}</b>
              {issue.detail ? <span className="text-ink-2"> — {issue.detail}</span> : null}
            </p>
          ))}
        </div>
      ) : null}

      {row.escalation === "integrity" && row.integrity ? (
        <div className="mt-4 border-l-2 border-danger bg-danger/5 px-4 py-3">
          <p className="font-mono text-[0.72rem] tracking-wide text-danger uppercase">
            Written under unusual conditions
          </p>
          <p className="mt-1.5 text-[0.92rem] text-ink-2">
            {[
              row.integrity.pasteAttempts
                ? `${row.integrity.pasteAttempts} paste attempt${row.integrity.pasteAttempts === 1 ? "" : "s"} (${row.integrity.pastedCharacters} characters)`
                : null,
              row.integrity.awayEvents
                ? `left the tab ${row.integrity.awayEvents} time${row.integrity.awayEvents === 1 ? "" : "s"}`
                : null,
              row.integrity.typedCharacters
                ? `${row.integrity.typedCharacters} characters typed`
                : null,
              row.integrity.durationMs
                ? `${Math.max(1, Math.round(row.integrity.durationMs / 60000))} min on the step`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1.5 text-[0.85rem] text-muted">
            Circumstantial, not proof — a trainee pasting their own code from their editor looks the
            same. Read the answer and ask them to explain it if you are unsure.
          </p>
        </div>
      ) : null}

      {row.checks?.some((c) => !c.passed) ? (
        <ul className="mt-4 space-y-1">
          {row.checks
            .filter((c) => !c.passed)
            .map((check, i) => (
              <li key={i} className="text-[0.9rem] text-danger">
                ✕ {check.message}
              </li>
            ))}
        </ul>
      ) : null}

      {row.peerReviews?.length ? (
        <div className="mt-4">
          <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">Peers</p>
          {row.peerReviews.map((peer) => (
            <p key={peer._id ?? peer.at} className="mt-1.5 text-[0.92rem] text-ink-2">
              <b>{peer.reviewerName}</b> · {peer.verdict} — {peer.note}
            </p>
          ))}
        </div>
      ) : null}

      <Button variant="quiet" size="sm" className="mt-4" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide the submission" : "Show the submission"}
      </Button>

      {open ? (
        <div className="animate-panel-open mt-3">
          {row.payload.code ? (
            <pre className="overflow-x-auto rounded-panel bg-ink px-4 py-4 text-[0.82rem] leading-relaxed text-on-dark">
              <code>{row.payload.code}</code>
            </pre>
          ) : null}
          {row.payload.notes ? (
            <p className="mt-3 text-[0.93rem] text-ink-2">{row.payload.notes}</p>
          ) : null}
          {row.payload.repoUrl ? (
            <p className="mt-3 text-[0.92rem]">
              <a
                href={row.payload.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {row.payload.repoUrl} ↗
              </a>
            </p>
          ) : null}
          {row.payload.commitUrl ? (
            <p className="mt-1 text-[0.92rem]">
              <a
                href={row.payload.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {row.payload.commitUrl} ↗
              </a>
            </p>
          ) : null}
          {row.payload.answers?.length ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[0.93rem] text-ink-2">
              {row.payload.answers.map((answer, i) => (
                <li key={i}>{answer || <span className="text-muted">left blank</span>}</li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      <TextArea
        label="Your note to the trainee"
        hint="(optional) — they see this on the step"
        rows={3}
        wrapperClassName="mt-5"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={saving}
          onClick={() => onDecide("passed", note.trim() || undefined)}
        >
          Pass
        </Button>
        <Button
          variant="ghost"
          disabled={saving}
          onClick={() => onDecide("changes-requested", note.trim() || undefined)}
        >
          Ask for changes
        </Button>
        <Button
          variant="quiet"
          disabled={saving}
          onClick={() => onDecide("failed", note.trim() || undefined)}
        >
          Not there yet
        </Button>
      </div>
    </article>
  );
}
