import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Container, Image, Spinner } from "@shared/ui";
import { useJoinTrack, useMyEnrollments, useSite, useTrack } from "../api/queries";
import { useTrainee } from "../state/TraineeContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { Reveal } from "../components/Reveal";
import { KIND_GLYPH, KIND_LABEL, minutes } from "../bootcamp/kinds";

/** The shop window for one track: what you will do, and the button to start. */
export default function TrackPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const site = useSite();
  const { trainee } = useTrainee();
  const { data: track, isLoading, isError, error, refetch } = useTrack(slug);
  const { data: enrollments = [] } = useMyEnrollments(Boolean(trainee));
  const join = useJoinTrack(slug);

  if (isLoading) return <PageState kind="loading" />;
  if (isError || !track) {
    return <PageState kind="error" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const enrolled = enrollments.some((e) => e.track === track.id);
  const steps = track.steps ?? [];
  const hours = Math.round(((track.totalMinutes ?? 0) / 60) * 10) / 10;

  const start = () => {
    if (!trainee) return navigate(`/join?next=/learn/${slug}`);
    if (enrolled) return navigate(`/learn/${slug}`);
    join.mutate(undefined, { onSuccess: () => navigate(`/learn/${slug}`) });
  };

  return (
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-14">
          <Link
            to="/bootcamp"
            className="text-[0.95rem] text-ink-2 underline underline-offset-4 hover:text-primary"
          >
            ← All tracks
          </Link>

          <Reveal className="mt-6">
            <h1 className="text-step-4">{track.title}</h1>
            {track.stack ? (
              <p className="mt-3 font-mono text-[0.9rem] text-muted">{track.stack}</p>
            ) : null}
            {track.summary ? (
              <p className="mt-5 max-w-[62ch] text-step-1 leading-[1.5] text-ink-2">
                {track.summary}
              </p>
            ) : null}

            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.8rem] tabular-nums text-muted">
              {[
                `${steps.length} steps`,
                hours ? `about ${hours} hours of work` : "",
                track.weeks ? `${track.weeks} weeks` : "",
                track.level,
              ]
                .filter(Boolean)
                .map((entry, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 ? <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" /> : null}
                    {entry}
                  </span>
                ))}
            </p>
          </Reveal>

          {track.cover ? (
            <Reveal delay={70} className="mt-8">
              <Image
                media={track.cover}
                className="w-full border border-line-strong object-cover"
                eager
              />
            </Reveal>
          ) : null}

          <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.4fr_0.6fr]">
            <Reveal>
              <h2 className="text-step-2">What you will do</h2>
              <ol className="mt-4 divide-y divide-line overflow-hidden rounded-panel border border-line-strong bg-panel">
                {steps.map((step, index) => (
                  <li
                    key={step.id}
                    className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 px-4 py-3"
                  >
                    <span className="grid size-7 place-items-center rounded-full border border-line-strong font-mono text-[0.72rem] text-ink-2">
                      {KIND_GLYPH[step.kind]}
                    </span>
                    <span className="font-mono text-[0.74rem] tabular-nums text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{step.title}</span>
                      <span className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
                        {KIND_LABEL[step.kind]}
                      </span>
                    </span>
                    <span className="font-mono text-[0.74rem] whitespace-nowrap tabular-nums text-muted">
                      {minutes(step.estimateMinutes)}
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={70} className="lg:sticky lg:top-24">
              <Card>
                {track.outcomes?.length ? (
                  <>
                    <h3 className="font-display text-[1.1rem] font-extrabold">You finish able to</h3>
                    <ul className="mt-3 space-y-2">
                      {track.outcomes.map((item, i) => (
                        <li
                          key={i}
                          className="grid grid-cols-[auto_1fr] gap-3 text-[0.93rem] text-ink-2"
                        >
                          <span aria-hidden="true" className="mt-[10px] h-px w-3 bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {track.technologies?.length ? (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {track.technologies.map((name) => (
                      <Badge key={name}>{name}</Badge>
                    ))}
                  </div>
                ) : null}

                {join.isError ? (
                  <Alert tone="danger" className="mt-5">
                    {(join.error as Error).message}
                  </Alert>
                ) : null}

                <Button fullWidth className="mt-6" onClick={start} disabled={join.isPending}>
                  {join.isPending ? <Spinner /> : null}
                  {enrolled ? "Continue" : trainee ? "Start this track" : "Join and start"}
                </Button>

                {!trainee ? (
                  <p className="mt-3 text-center text-[0.85rem] text-muted">
                    Already have an account?{" "}
                    <Link
                      to={`/signin?next=/learn/${slug}`}
                      className="text-primary underline underline-offset-4"
                    >
                      Sign in
                    </Link>
                  </p>
                ) : null}
              </Card>
            </Reveal>
          </div>
        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}
