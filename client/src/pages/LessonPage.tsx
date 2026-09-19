import { Link, useParams } from "react-router-dom";
import { useLesson, useProgram, useSite } from "../api/queries";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { VideoPlayer } from "../components/VideoPlayer";
import { Reveal } from "../components/Reveal";
import { LessonRail } from "../components/LessonRail";
import { PracticePanel } from "../components/PracticePanel";
import { ButtonAnchor, ButtonLink, Container, Eyebrow, Prose } from "@shared/ui";
import { useTrainee } from "../state/TraineeContext";
import type { Section, SiteSettings } from "@shared/types";
import { hasVideo } from "@shared/media";

export default function LessonPage() {
  const { programSlug, lessonSlug } = useParams();
  const site = useSite();
  const { trainee, ready } = useTrainee();
  const { data: lesson, isLoading, isError, error, refetch } = useLesson(programSlug, lessonSlug);
  // Loaded for the playlist beside the player, so the rest of the course stays
  // one click away while you watch.
  const { data: program } = useProgram(programSlug);

  // Watching needs an account. The lesson is still named and described below,
  // so the link is worth following even before anyone has signed up.
  if (!ready) return <PageState kind="loading" />;
  if (!trainee) {
    return (
      <WatchGate
        settings={site.data?.settings}
        sections={site.data?.sections}
        programSlug={programSlug}
        lessonSlug={lessonSlug}
        title={lesson?.title}
      />
    );
  }

  if (isLoading) return <PageState kind="loading" />;
  if (isError || !lesson) {
    return <PageState kind="error" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const lessons = program?.lessons ?? [];
  const position = lessons.findIndex((l) => l.slug === lesson.slug);
  const next = lessons.slice(position + 1).find((l) => l.isFree);

  return (
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-10 md:py-14">
          <Link
            to={`/programs/${lesson.program.slug}`}
            className="text-[0.95rem] text-ink-2 underline underline-offset-4 hover:text-primary"
          >
            ← {lesson.program.title}
          </Link>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.55fr_0.85fr] lg:gap-10">
            <div className="min-w-0">
              {/* A written lesson should not open with an empty video frame
                  apologising for itself. The player appears only when there is
                  something to play. */}
              {hasVideo(lesson) ? (
                <Reveal>
                  <VideoPlayer lesson={lesson} />
                </Reveal>
              ) : null}

              <Reveal delay={70} className="mt-6">
                <Eyebrow theme="primary">
                  Free lesson{position >= 0 ? ` · ${position + 1} of ${lessons.length}` : ""}
                </Eyebrow>
                <h1 className="mt-2 text-step-3">{lesson.title}</h1>
                {lesson.duration ? (
                  <p className="mt-2 font-mono text-[0.82rem] tabular-nums text-muted">{lesson.duration}</p>
                ) : null}
                {/* The picture before the prose: a diagram is the fastest way
                    into a structural idea, and the text then fills it in. */}
                {lesson.diagram ? (
                  <img
                    src={lesson.diagram}
                    alt=""
                    className="mt-6 w-full rounded-panel border border-line-strong"
                    loading="lazy"
                  />
                ) : null}

                {/* Written up rather than only spoken: a lesson should still
                    be worth something to someone who reads faster than they
                    watch, or who comes back for the detail. */}
                <Prose text={lesson.description} className="mt-5 max-w-[70ch]" />
              </Reveal>

              {next ? (
                <Reveal delay={110} className="mt-7">
                  <Link
                    to={`/watch/${lesson.program.slug}/${next.slug}`}
                    className="group flex flex-wrap items-center gap-3 border border-line-strong bg-panel px-4 py-3 no-underline transition-colors hover:border-primary"
                  >
                    <span className="font-mono text-[0.75rem] text-muted">Up next</span>
                    <span className="font-semibold group-hover:text-primary">{next.title}</span>
                    <span className="ml-auto font-mono text-[0.78rem] tabular-nums text-muted">
                      {next.duration}
                    </span>
                  </Link>
                </Reveal>
              ) : null}

              {lesson.practice?.checks?.length || lesson.practice?.questions?.length ? (
                <Reveal delay={120} className="mt-8">
                  <PracticePanel practice={lesson.practice} lessonId={lesson.id} />
                </Reveal>
              ) : null}

              {/* Someone who has already paid should not be sold to on every lesson. */}
              {program?.enrolled ? null : (
                <Reveal
                  delay={140}
                  className="mt-8 max-w-[70ch] border-l-4 border-secondary bg-secondary-soft px-6 py-5"
                >
                  <b className="font-display text-[1.1rem]">Want the rest of this program?</b>
                  <p className="mt-1.5 text-ink-2">
                    The full curriculum, weekly live sessions and 1:1 hours come with enrolment.
                  </p>
                  <ButtonAnchor href="/#enroll" className="mt-4">
                    Ask about enrolling
                  </ButtonAnchor>
                </Reveal>
              )}
            </div>

            {lessons.length ? (
              <Reveal delay={70} className="lg:sticky lg:top-24">
                <LessonRail
                  lessons={lessons}
                  modules={program?.modules}
                  programSlug={lesson.program.slug}
                  programTitle={lesson.program.title}
                  activeSlug={lesson.slug}
                  enrolled={program?.enrolled}
                />
              </Reveal>
            ) : null}
          </div>
        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}

/**
 * The sign-in wall in front of a lesson. It says what is behind it and offers
 * both doors, and it carries the lesson in `next` so signing in drops the
 * visitor on the video rather than the home page.
 */
function WatchGate({
  settings,
  sections,
  programSlug,
  lessonSlug,
  title,
}: {
  settings?: SiteSettings;
  sections?: Section[];
  programSlug?: string;
  lessonSlug?: string;
  title?: string;
}) {
  const next = encodeURIComponent(`/watch/${programSlug}/${lessonSlug}`);

  return (
    <>
      <Header settings={settings} sections={sections} />

      <main>
        <Container className="py-20">
          <div className="mx-auto max-w-[34rem] text-center">
            <Eyebrow theme="primary">Free lesson</Eyebrow>
            <h1 className="mt-3 text-step-3">{title || "Sign in to watch this lesson"}</h1>
            <p className="mx-auto mt-4 max-w-[46ch] text-ink-2">
              Lessons play for anyone with an account. Creating one takes a moment and keeps your
              place, your progress and your feedback together.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to={`/join?next=${next}`}>Sign up to watch</ButtonLink>
              <ButtonLink to={`/signin?next=${next}`} variant="ghost">
                I already have an account
              </ButtonLink>
            </div>

            {programSlug ? (
              <p className="mt-8 text-[0.92rem]">
                <Link
                  to={`/programs/${programSlug}`}
                  className="text-ink-2 underline underline-offset-4 hover:text-primary"
                >
                  Back to the course
                </Link>
              </p>
            ) : null}
          </div>
        </Container>
      </main>

      <Footer settings={settings} />
    </>
  );
}
