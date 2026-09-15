import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Alert, ButtonLink, Container } from "@shared/ui";
import {
  useCompleteStep,
  usePeerQueue,
  useSite,
  useSubmitStep,
  useWorkspace,
  type SubmitInput,
} from "../api/queries";
import { useTrainee } from "../state/TraineeContext";
import { Header } from "../components/Header";
import { PageState } from "../components/PageState";
import { StepRail } from "../bootcamp/StepRail";
import { StepPanel } from "../bootcamp/StepPanel";
import { PeerReviewPanel } from "../bootcamp/PeerReviewPanel";
import { ProtectionProvider } from "../bootcamp/protection";

/**
 * Where the work happens. The rail on the left is the road; the panel on the
 * right is wherever you are standing on it.
 */
export default function WorkspacePage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const site = useSite();
  const { trainee, ready } = useTrainee();

  const workspace = useWorkspace(slug, ready && Boolean(trainee));
  const peerQueue = usePeerQueue(ready && Boolean(trainee));
  const submit = useSubmitStep(slug);
  const complete = useCompleteStep(slug);

  // Reviewing other people's work happens here, in the same place as your own
  // — a second tab rather than a second link to remember.
  const reviewing = params.get("view") === "review";

  const steps = useMemo(() => workspace.data?.steps ?? [], [workspace.data]);
  const completed = useMemo(
    () => workspace.data?.enrollment?.completed ?? [],
    [workspace.data],
  );
  const unlocked = workspace.data?.unlocked ?? [];

  const requested = params.get("step");
  // Default to the furthest step that is open — where they left off.
  const fallback = unlocked[unlocked.length - 1] ?? steps[0]?.id ?? "";
  const activeId =
    requested && unlocked.includes(requested) ? requested : fallback;
  const active = steps.find((s) => s.id === activeId);
  const activeIndex = steps.findIndex((s) => s.id === activeId);

  // A fresh step means the previous step's error is no longer about anything.
  useEffect(() => {
    submit.reset();
    complete.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const [justPassed, setJustPassed] = useState(false);
  useEffect(() => {
    if (!justPassed) return undefined;
    const timer = window.setTimeout(() => setJustPassed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [justPassed]);

  if (!ready) return <PageState kind="loading" />;

  if (!trainee) {
    return (
      <>
        <Header settings={site.data?.settings} sections={site.data?.sections} />
        <Container className="py-24">
          <h1 className="text-step-3">Sign in to pick up where you left off</h1>
          <p className="mt-3 max-w-[54ch] text-ink-2">
            Your progress, submissions and feedback live with your account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to={`/signin?next=/learn/${slug}`}>Sign in</ButtonLink>
            <ButtonLink to={`/join?next=/learn/${slug}`} variant="ghost">
              Create an account
            </ButtonLink>
          </div>
        </Container>
      </>
    );
  }

  if (workspace.isLoading) return <PageState kind="loading" />;
  if (workspace.isError) {
    return (
      <>
        <Header settings={site.data?.settings} sections={site.data?.sections} />
        <PageState
          kind="error"
          message={(workspace.error as Error)?.message}
          onRetry={() => workspace.refetch()}
        />
      </>
    );
  }

  const data = workspace.data;
  if (!data || !active)
    return <PageState kind="empty" message="This track has no steps yet." />;

  if (!data.enrollment) {
    return (
      <>
        <Header settings={site.data?.settings} sections={site.data?.sections} />
        <Container className="py-24">
          <h1 className="text-step-3">You have not joined this track yet</h1>
          <ButtonLink to={`/bootcamp/${slug}`} className="mt-6">
            See what it covers
          </ButtonLink>
        </Container>
      </>
    );
  }

  const progress = Math.round(
    (completed.length / Math.max(1, steps.length)) * 100,
  );

  const onSubmit = (input: Omit<SubmitInput, "stepId">) =>
    submit.mutate(
      { stepId: active.id, ...input },
      {
        onSuccess: (res) => {
          if (res.submission.status === "passed") setJustPassed(true);
        },
      },
    );

  return (
    <ProtectionProvider protect={data.track.protect}>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-8 md:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to={`/bootcamp/${slug}`}
                className="font-mono text-[0.78rem] text-muted underline underline-offset-4 hover:text-primary"
              >
                {data.track.title}
              </Link>
              <p className="mt-1 font-mono text-[0.78rem] tabular-nums text-muted">
                {completed.length} of {steps.length} done ·{" "}
                {data.enrollment.points} points
              </p>
            </div>
            <div className="flex overflow-hidden rounded-card border border-line-strong">
              <button
                type="button"
                onClick={() => setParams(activeId ? { step: activeId } : {})}
                className={`cursor-pointer px-4 py-2 text-[0.9rem] font-semibold transition-colors ${
                  reviewing
                    ? "bg-transparent text-ink-2 hover:text-ink"
                    : "bg-primary text-white"
                }`}
              >
                My work
              </button>
              <button
                type="button"
                onClick={() => setParams({ view: "review" })}
                className={`flex cursor-pointer items-center gap-2 border-l border-line-strong px-4 py-2 text-[0.9rem] font-semibold transition-colors ${
                  reviewing
                    ? "bg-primary text-white"
                    : "bg-transparent text-ink-2 hover:text-ink"
                }`}
              >
                Review others
                {peerQueue.data?.length ? (
                  <span
                    className={`rounded-full px-1.5 font-mono text-[0.7rem] tabular-nums ${
                      reviewing ? "bg-white/20" : "bg-primary-soft text-primary"
                    }`}
                  >
                    {peerQueue.data.length}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-secondary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {justPassed ? (
            <Alert tone="success" className="mt-5">
              Passed. The next step is open.
            </Alert>
          ) : null}

          {reviewing ? (
            <div className="mt-8">
              <PeerReviewPanel />
            </div>
          ) : (
            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[19rem_1fr] lg:gap-10">
              <div className="overflow-hidden rounded-panel border border-line-strong bg-panel lg:sticky lg:top-24">
                <div className="border-b border-line px-4 py-3">
                  <p className="font-display text-[1rem] font-extrabold">
                    Steps
                  </p>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  <StepRail
                    steps={steps}
                    activeId={activeId}
                    unlocked={unlocked}
                    completed={completed}
                    submissions={data.submissions}
                    onSelect={(id) => setParams({ step: id })}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <StepPanel
                  step={active}
                  index={activeIndex}
                  total={steps.length}
                  submission={data.submissions[active.id]}
                  done={completed.includes(active.id)}
                  submitting={submit.isPending}
                  completing={complete.isPending}
                  submitError={submit.error}
                  onSubmit={onSubmit}
                  onComplete={() => complete.mutate(active.id)}
                />
              </div>
            </div>
          )}
        </Container>
      </main>
    </ProtectionProvider>
  );
}
