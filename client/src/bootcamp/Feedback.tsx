import { Badge, Spinner } from "@shared/ui";
import type { Submission } from "@shared/types";
import { STATUS_LABEL, STATUS_TONE } from "./kinds";

const SEVERITY_TONE = {
  blocker: "border-danger",
  major: "border-primary",
  minor: "border-line-strong",
} as const;

/**
 * Everything that has been said about one attempt: the automatic checks, the
 * reviewer's read, any peers who looked at it, and the last word from a person.
 * Shown in that order because that is the order it arrives in.
 */
export function Feedback({ submission }: { submission: Submission }) {
  const { review, checks, peerReviews, mentor, status } = submission;
  const failed = checks.filter((c) => !c.passed);
  const reviewing = submission.reviewState === "reviewing";

  return (
    <section className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-[1.15rem] font-extrabold">
          Attempt {submission.attempt}
        </h3>
        {reviewing ? (
          <Badge>reviewing…</Badge>
        ) : (
          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
        )}
        {!reviewing && submission.needsHuman && status === "pending" ? (
          <span className="font-mono text-[0.74rem] text-muted">
            waiting on a person — you will get an email when it lands
          </span>
        ) : null}
      </div>

      {checks.length ? (
        <div className="mt-4">
          <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
            Automatic checks
          </p>
          <ul className="mt-2 space-y-1.5">
            {checks.map((check, i) => (
              <li
                key={i}
                className={`grid grid-cols-[auto_1fr] items-start gap-2.5 text-[0.92rem] ${
                  check.passed ? "text-muted" : "text-ink-2"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-[3px] font-mono text-[0.8rem] ${
                    check.passed ? "text-secondary-deep" : "text-danger"
                  }`}
                >
                  {check.passed ? "✓" : "✕"}
                </span>
                <span>{check.message}</span>
              </li>
            ))}
          </ul>
          {failed.length ? (
            <p className="mt-2 text-[0.88rem] text-muted">
              These run before anything else, so fixing them is always the fastest way forward.
            </p>
          ) : null}
        </div>
      ) : null}

      {reviewing ? (
        <div className="mt-5 flex items-start gap-3 border border-dashed border-line-strong px-4 py-4">
          <Spinner className="mt-1 text-primary" />
          <div>
            <p className="font-semibold">Reading your answer</p>
            <p className="mt-0.5 text-[0.9rem] text-muted">
              This takes under a minute. If it runs longer than that, a person picks it up instead —
              either way you will not be left waiting.
            </p>
          </div>
        </div>
      ) : null}

      {review && !reviewing ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">Review</p>
            {review.error ? null : (
              <span className="font-mono text-[0.72rem] tabular-nums text-muted">
                {review.score != null ? `${Math.round(review.score)} / 100` : ""}
              </span>
            )}
          </div>

          <p className="mt-2 max-w-[68ch] text-[0.98rem] leading-relaxed text-ink-2">
            {review.summary}
          </p>

          {review.issues?.length ? (
            <ul className="mt-4 space-y-3">
              {review.issues.map((issue, i) => (
                <li
                  key={i}
                  className={`border-l-2 pl-4 ${SEVERITY_TONE[issue.severity ?? "major"]}`}
                >
                  <p className="font-semibold">{issue.title}</p>
                  {issue.detail ? (
                    <p className="mt-1 text-[0.93rem] text-ink-2">{issue.detail}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {review.hints?.length ? (
            <div className="mt-4 border border-dashed border-line-strong px-4 py-3">
              <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
                Where to look
              </p>
              <ul className="mt-2 space-y-1.5">
                {review.hints.map((hint, i) => (
                  <li key={i} className="text-[0.93rem] text-ink-2">
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {peerReviews?.length ? (
        <div className="mt-6">
          <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
            From other trainees
          </p>
          {peerReviews.map((peer) => (
            <div key={peer._id ?? peer.at} className="mt-3 border-l-2 border-tertiary pl-4">
              <p className="font-mono text-[0.74rem] text-muted">
                {peer.reviewerName ?? "A peer"} · {peer.verdict === "pass" ? "looks right" : "needs another go"}
              </p>
              <p className="mt-1 text-[0.93rem] text-ink-2">{peer.note}</p>
            </div>
          ))}
        </div>
      ) : null}

      {mentor?.note ? (
        <div className="mt-6 border-l-4 border-secondary bg-secondary-soft px-5 py-4">
          <p className="font-mono text-[0.72rem] tracking-wide text-secondary-deep uppercase">
            From {mentor.name || "your mentor"}
          </p>
          <p className="mt-1.5 text-ink-2">{mentor.note}</p>
        </div>
      ) : null}
    </section>
  );
}
