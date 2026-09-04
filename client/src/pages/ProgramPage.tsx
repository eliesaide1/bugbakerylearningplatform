import { Link, useParams } from "react-router-dom";
import { useProgram, useSite } from "../api/queries";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { Reveal } from "../components/Reveal";
import { ButtonAnchor, Card, Container, Image, LockGlyph } from "@shared/ui";
import { Curriculum } from "../components/Curriculum";
import { LessonPlaylist } from "../components/LessonPlaylist";
import { runtimeOf } from "@shared/duration";

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <>
      <dt className="mt-4 text-[0.85rem] text-muted first:mt-0">{label}</dt>
      <dd className="m-0 mt-0.5 font-semibold">{value}</dd>
    </>
  );
}

export default function ProgramPage() {
  const { slug } = useParams();
  const site = useSite();
  const { data: program, isLoading, isError, error, refetch } = useProgram(slug);

  if (isLoading) return <PageState kind="loading" />;
  if (isError || !program) {
    return <PageState kind="error" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  return (
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      <main>
        <Container className="py-14">
          <Link to="/" className="text-[0.95rem] text-ink-2 underline underline-offset-4 hover:text-primary">
            ← All programs
          </Link>

          <Reveal className="mt-6">
            <h1 className="text-step-4">{program.title}</h1>
            {program.stack ? (
              <p className="mt-3 font-mono text-[0.9rem] text-muted">{program.stack}</p>
            ) : null}
            {program.summary ? (
              <p className="mt-5 max-w-[62ch] text-step-1 leading-[1.5] text-ink-2">{program.summary}</p>
            ) : null}

            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.8rem] tabular-nums text-muted">
              {[
                program.lessons?.length ? `${program.lessons.length} lectures` : "",
                runtimeOf(program.lessons ?? []) || program.length,
                program.level,
                program.lessons?.some((l) => l.isFree) ? "free previews" : "",
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

          {program.cover ? (
            <Reveal delay={70} className="mt-8">
              <Image media={program.cover} className="w-full border border-line-strong object-cover" eager />
            </Reveal>
          ) : null}

          <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.4fr_0.6fr]">
            <Reveal>
              <h2 className="text-step-2">Course content</h2>
              <Curriculum
                modules={program.modules}
                outcomes={program.outcomes}
                lessons={program.lessons}
                programSlug={program.slug}
                className="mt-4"
              />
              {program.lessons?.some((l) => !l.isFree) ? (
                <p className="mt-4 flex items-start gap-2 text-[0.9rem] text-muted">
                  <LockGlyph className="mt-[3px] size-3.5" />
                  <span>
                    Locked lectures open when you enrol. The preview ones are free to watch now, no
                    account needed.
                  </span>
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={70}>
              <Card>
                <dl className="m-0">
                  <Fact label="Level" value={program.level} />
                  <Fact label="Length" value={program.length} />
                  <Fact label="Prerequisite" value={program.prerequisite} />
                  <Fact label="You finish with" value={program.finishWith} />
                </dl>
                <ButtonAnchor href="/#enroll" fullWidth className="mt-6">
                  Ask about this program
                </ButtonAnchor>
              </Card>
            </Reveal>
          </div>

          {program.lessons?.length && !program.modules?.length ? (
            <div className="mt-14">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-step-2">Lessons</h2>
                <p className="font-mono text-[0.78rem] text-muted">
                  {program.lessons.length} videos
                  {runtimeOf(program.lessons) ? ` · ${runtimeOf(program.lessons)}` : ""}
                </p>
              </div>
              <div className="mt-4 rounded-[3px] border border-line bg-panel">
                <LessonPlaylist lessons={program.lessons} programSlug={program.slug} />
              </div>
            </div>
          ) : null}

        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}
