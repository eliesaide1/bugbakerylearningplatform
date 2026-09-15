import { Link } from "react-router-dom";
import { Badge, ButtonLink, Container, EmptyState, Image } from "@shared/ui";
import { useSite, useTracks, useMyEnrollments } from "../api/queries";
import { useTrainee } from "../state/TraineeContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { Reveal } from "../components/Reveal";

/** Every bootcamp track, plus the ones this trainee is already part-way through. */
export default function BootcampPage() {
  const site = useSite();
  const { trainee } = useTrainee();
  const { data: tracks = [], isLoading, isError, error, refetch } = useTracks();
  const { data: enrollments = [] } = useMyEnrollments(Boolean(trainee));

  const joined = new Map(enrollments.map((e) => [e.track, e]));

  if (isLoading) return <PageState kind="loading" />;
  if (isError) {
    return <PageState kind="error" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  return (
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-14">
          <Reveal>
            <p className="font-mono text-[0.78rem] tracking-wide text-primary uppercase">
              Bootcamp
            </p>
            <h1 className="mt-3 text-step-4">Learn it the way the job happens</h1>
            <p className="mt-5 max-w-[62ch] text-step-1 leading-[1.5] text-ink-2">
              Watch the idea, build the piece, then fix the bug someone left you and ship it. Every
              step is checked, and when the automatic review is unsure a person picks it up.
            </p>
          </Reveal>

          {!tracks.length ? (
            <EmptyState
              className="mt-12"
              title="No tracks are open yet"
              message="Check back shortly, or ask about a private cohort."
              action={<ButtonLink to="/#enroll">Get in touch</ButtonLink>}
            />
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {tracks.map((track, i) => {
                const enrollment = joined.get(track.id);
                const progress = enrollment
                  ? Math.round(
                      ((enrollment.completed?.length ?? 0) / Math.max(1, track.stepCount ?? 1)) * 100
                    )
                  : 0;

                return (
                  <Reveal key={track.id} delay={i * 60}>
                    <Link
                      to={`/bootcamp/${track.slug}`}
                      className="group flex h-full flex-col border border-line-strong border-t-[4px] border-t-primary bg-panel p-6 no-underline transition-colors hover:border-primary"
                    >
                      {track.cover ? (
                        <Image
                          media={track.cover}
                          className="mb-5 aspect-video w-full border border-line object-cover"
                        />
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2">
                        {enrollment ? <Badge tone="secondary">enrolled</Badge> : null}
                        {track.level ? <Badge>{track.level}</Badge> : null}
                      </div>

                      <h2 className="mt-3 font-display text-[1.4rem] leading-tight font-extrabold group-hover:text-primary">
                        {track.title}
                      </h2>
                      {track.stack ? (
                        <p className="mt-1.5 font-mono text-[0.82rem] text-muted">{track.stack}</p>
                      ) : null}
                      {track.summary ? (
                        <p className="mt-3 text-[0.96rem] leading-snug text-ink-2">{track.summary}</p>
                      ) : null}

                      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.78rem] tabular-nums text-muted">
                        <span>{track.stepCount} steps</span>
                        {track.weeks ? (
                          <>
                            <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
                            <span>about {track.weeks} weeks</span>
                          </>
                        ) : null}
                      </p>

                      {enrollment ? (
                        <div className="mt-auto pt-5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                            <div
                              className="h-full rounded-full bg-secondary transition-[width] duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="mt-2 font-mono text-[0.75rem] tabular-nums text-muted">
                            {progress}% done · {enrollment.points} points
                          </p>
                        </div>
                      ) : null}
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}
