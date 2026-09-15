import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Spinner,
  TextArea,
} from "@shared/ui";
import { usePeerQueue, useSubmitPeerReview } from "../api/queries";
import { KIND_LABEL } from "./kinds";

/**
 * Rung four of the review ladder, and a skill in its own right: reading broken
 * code that is not yours. You only see steps you have already passed, and you
 * never see whose work it is.
 */
export function PeerReviewPanel() {
  const queue = usePeerQueue(true);
  const review = useSubmitPeerReview();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string[]>([]);

  const items = (queue.data ?? []).filter((item) => !done.includes(item.id));

  const send = (id: string, verdict: "pass" | "revise") => {
    const note = (notes[id] ?? "").trim();
    review.mutate(
      { id, verdict, note },
      { onSuccess: () => setDone((current) => [...current, id]) },
    );
  };

  return (
    <section>
      <h2 className="text-step-3">Review someone else's work</h2>
      <p className="mt-3 max-w-[62ch] text-ink-2">
        These are attempts at steps you have already passed. Say what is wrong,
        or confirm what is right — and say why. Two reviews that agree settle a
        submission; if you disagree with each other, a mentor takes it.
      </p>

      {queue.isLoading ? <p className="mt-8 text-muted">Loading…</p> : null}

      {!items.length && !queue.isLoading ? (
        <EmptyState
          className="mt-10"
          title="Nothing waiting for you"
          message="Pass a few more steps and other people's attempts at them will show up here."
        />
      ) : null}

      <div className="mt-10 space-y-8">
        {items.map((item) => (
          <article
            key={item.id}
            className="border border-line-strong bg-panel p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-[1.2rem] font-extrabold">
                {item.stepInfo?.title ?? "A step"}
              </h3>
              {item.stepInfo ? (
                <Badge>{KIND_LABEL[item.stepInfo.kind]}</Badge>
              ) : null}
              <span className="font-mono text-[0.74rem] text-muted">
                attempt {item.attempt}
              </span>
            </div>

            {item.payload.code ? (
              <pre className="mt-4 overflow-x-auto rounded-panel bg-ink px-4 py-4 text-[0.82rem] leading-relaxed text-on-dark">
                <code>{item.payload.code}</code>
              </pre>
            ) : null}

            {item.payload.notes ? (
              <div className="mt-4">
                <p className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
                  Their explanation
                </p>
                <p className="mt-1.5 text-[0.95rem] text-ink-2">
                  {item.payload.notes}
                </p>
              </div>
            ) : null}

            {item.payload.repoUrl ? (
              <p className="mt-4 text-[0.92rem]">
                <a
                  href={item.payload.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  Their repository ↗
                </a>
              </p>
            ) : null}

            <TextArea
              label="Your review"
              hint="be specific — 'looks good' helps nobody"
              rows={4}
              wrapperClassName="mt-5"
              value={notes[item.id] ?? ""}
              onChange={(e) =>
                setNotes((current) => ({
                  ...current,
                  [item.id]: e.target.value,
                }))
              }
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={
                  review.isPending || (notes[item.id] ?? "").trim().length < 20
                }
                onClick={() => send(item.id, "pass")}
              >
                {review.isPending ? <Spinner /> : null}
                This looks right
              </Button>
              <Button
                variant="ghost"
                disabled={
                  review.isPending || (notes[item.id] ?? "").trim().length < 20
                }
                onClick={() => send(item.id, "revise")}
              >
                Needs another go
              </Button>
            </div>
          </article>
        ))}
      </div>

      {review.isError ? (
        <Alert tone="danger" className="mt-6">
          {(review.error as Error).message}
        </Alert>
      ) : null}
    </section>
  );
}
