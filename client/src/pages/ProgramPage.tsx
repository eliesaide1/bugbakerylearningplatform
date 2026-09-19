import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProgram, useSite } from "../api/queries";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { Reveal } from "../components/Reveal";
import { ButtonLink, CheckGlyph, Container, Image, LockGlyph, PlayGlyph } from "@shared/ui";
import { Curriculum } from "../components/Curriculum";
import { LessonPlaylist } from "../components/LessonPlaylist";
import { runtimeOf } from "@shared/duration";

export default function ProgramPage() {
  const { slug } = useParams();
  const site = useSite();
  const { data: program, isLoading, isError, error, refetch } = useProgram(slug);
  // Nothing to observe until the program has loaded: the first render is a
  // spinner, with no header and no sentinel in the DOM yet.
  const { condensed, headerHeight, bandHeight, hero } = useProgramChrome(Boolean(program));

  if (isLoading) return <PageState kind="loading" />;
  if (isError || !program) {
    return <PageState kind="error" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const lessons = program.lessons ?? [];
  const runtime = runtimeOf(lessons) || program.length;

  const facts = [
    lessons.length ? { icon: <PlayGlyph className="size-4" />, label: `${lessons.length} lectures` } : null,
    runtime ? { icon: <ClockGlyph />, label: `${runtime} of video` } : null,
    program.modules?.length ? { icon: <ListGlyph />, label: `${program.modules.length} sections` } : null,
    program.level ? { icon: <LevelGlyph />, label: program.level } : null,
    program.prerequisite ? { icon: <KeyGlyph />, label: program.prerequisite } : null,
    program.finishWith ? { icon: <TrophyGlyph />, label: program.finishWith } : null,
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;

  return (
    <>
      <Header settings={site.data?.settings} sections={site.data?.sections} />

      {/* Once the hero has gone past, the title follows you down in a strip
          pinned directly under the site header — so you always know which
          course the section you are reading belongs to. */}
      <div
        aria-hidden={!condensed}
        style={{ top: headerHeight }}
        className={`fixed inset-x-0 z-30 border-b border-border-dark bg-ink transition-[opacity,transform] duration-200 ${
          condensed ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <Container className="flex items-center gap-5 py-3">
          <p className="min-w-0 flex-1 truncate font-display text-[1rem] font-extrabold text-white">
            {program.title}
          </p>
          <p className="hidden font-mono text-[0.78rem] whitespace-nowrap tabular-nums text-on-dark-muted sm:block">
            {[lessons.length ? `${lessons.length} lectures` : "", runtime].filter(Boolean).join(" · ")}
          </p>
        </Container>
      </div>

      <main className="relative">
        {/* The dark band is a backdrop rather than a container. One grid spans
            the whole page, so the card starts level with the title instead of
            being pushed to the foot of the band and leaving a hole above it. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 bg-ink"
          style={{ height: bandHeight || undefined }}
        />

        <Container className="relative pb-16">
          <div className="lg:grid lg:grid-cols-[1.5fr_0.72fr] lg:items-start lg:gap-x-10">
            {/* ---- hero, over the band ---- */}
            <div ref={hero} className="min-w-0 pt-10 pb-12 lg:col-start-1 lg:row-start-1">
              <Link
                to="/#programs"
                className="font-mono text-[0.82rem] text-on-dark-muted no-underline underline-offset-4 hover:text-white hover:underline"
              >
                ← All programs
              </Link>

              <Reveal className="mt-5">
                <h1 className="text-step-4 text-white">{program.title}</h1>

                {program.summary ? (
                  <p className="mt-4 max-w-[62ch] text-step-1 leading-[1.45] text-on-dark-muted">
                    {program.summary}
                  </p>
                ) : null}

                {program.stack ? (
                  <p className="mt-4 font-mono text-[0.85rem] text-on-dark-muted">{program.stack}</p>
                ) : null}

                <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.8rem] tabular-nums text-on-dark-muted">
                  {[lessons.length ? `${lessons.length} lectures` : "", runtime, program.level]
                    .filter(Boolean)
                    .map((entry, i) => (
                      <span key={i} className="flex items-center gap-2.5">
                        {i > 0 ? (
                          <span aria-hidden="true" className="h-2.5 w-px bg-border-dark" />
                        ) : null}
                        {entry}
                      </span>
                    ))}
                </p>
              </Reveal>
            </div>

            {/* ---- the card: same row as the title, and it stays ---- */}
            {/* Spanning both rows is what keeps it from setting row 1's height:
                otherwise the card is the tallest thing in the row and pushes
                "What you'll learn" down past its own foot. */}
            <aside className="pb-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:pt-10 lg:pb-0">
              <div className="overflow-hidden rounded-panel border border-line-strong bg-panel shadow-[0_1px_2px_rgba(20,24,31,0.04),0_18px_40px_-20px_rgba(20,24,31,0.28)]">
                {program.cover && !condensed ? (
                  <Image
                    media={program.cover}
                    className="aspect-video w-full border-b border-line object-cover"
                    eager
                  />
                ) : null}

                <div className="px-5 py-6">
                  {program.price ? (
                    <p className="mb-4 flex items-baseline gap-2">
                      <span className="font-display text-[1.6rem] leading-none font-extrabold">
                        {program.price}
                      </span>
                      {program.originalPrice ? (
                        <span className="text-[0.95rem] text-muted line-through">
                          {program.originalPrice}
                        </span>
                      ) : null}
                    </p>
                  ) : null}

                  {/* Straight to the course, not to an enquiry form. */}
                  {program.enrolled ? (
                    <ButtonLink to={`/programs/${program.slug}`} fullWidth>
                      You're enrolled — open it
                    </ButtonLink>
                  ) : (
                    <ButtonLink to={`/programs/${program.slug}/enroll`} fullWidth>
                      Enroll now
                    </ButtonLink>
                  )}

                  {facts.length ? (
                    <>
                      <p className="mt-6 font-display text-[1rem] font-extrabold">
                        This program includes
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {facts.map((fact, i) => (
                          <li
                            key={i}
                            className="grid grid-cols-[auto_1fr] items-start gap-3 text-[0.92rem] text-ink-2"
                          >
                            <span className="mt-[3px] flex-none text-muted">{fact.icon}</span>
                            <span>{fact.label}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </div>
            </aside>

            {/* ---- everything else, under the title ---- */}
            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              {program.outcomes?.length ? (
                <Reveal className="mt-10 lg:mt-12">
                  <div className="rounded-panel border border-line-strong bg-panel px-6 py-7 md:px-8">
                    <h2 className="font-display text-[1.45rem] font-extrabold tracking-[-0.02em]">
                      What you'll learn
                    </h2>
                    <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                      {program.outcomes.map((outcome, i) => (
                        <li key={i} className="grid grid-cols-[auto_1fr] items-start gap-2.5">
                          <CheckGlyph className="mt-[5px] size-3.5 flex-none text-muted" />
                          <span className="text-[0.95rem] leading-snug text-ink-2">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ) : null}

              <Reveal className="mt-12">
                <h2 className="text-step-2">Course content</h2>
                <Curriculum
                  modules={program.modules}
                  lessons={lessons}
                  programSlug={program.slug}
                  enrolled={program.enrolled}
                  className="mt-4"
                />
                {!program.enrolled && lessons.some((l) => l.locked) ? (
                  <p className="mt-4 flex items-start gap-2 text-[0.9rem] text-muted">
                    <LockGlyph className="mt-[3px] size-3.5 flex-none" />
                    <span>Locked lectures open when you enrol.</span>
                  </p>
                ) : null}
              </Reveal>

              {lessons.length && !program.modules?.length ? (
                <div className="mt-14">
                  <h2 className="text-step-2">Lessons</h2>
                  <div className="mt-4 rounded-panel border border-line bg-panel">
                    <LessonPlaylist lessons={lessons} programSlug={program.slug} enrolled={program.enrolled} />
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </Container>
      </main>

      <Footer settings={site.data?.settings} />
    </>
  );
}

/**
 * Watches a sentinel at the foot of the hero. Once it has scrolled past, the
 * page is "condensed": the strip appears and the card sheds its cover.
 *
 * The header's height is measured rather than assumed — it changes with the
 * tagline, and at the breakpoint where the nav collapses.
 */
function useProgramChrome(ready: boolean) {
  const hero = useRef<HTMLDivElement | null>(null);
  const [condensed, setCondensed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bandHeight, setBandHeight] = useState(0);

  // The band is drawn behind the hero, so it has to be exactly as tall as the
  // hero is — which depends on how far the title wraps at this width.
  useEffect(() => {
    if (!ready) return undefined;
    const node = hero.current;
    if (!node) return undefined;
    const measure = () => setBandHeight(node.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [ready]);

  // Measured, not assumed: the header changes height with the brand tagline,
  // and again at the breakpoint where the nav collapses to a menu button.
  useEffect(() => {
    if (!ready) return undefined;
    const header = document.querySelector("header");
    if (!header) return undefined;
    const measure = () => setHeaderHeight(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, [ready]);

  // Once the hero has left the top of the window, the strip takes over.
  useEffect(() => {
    if (!ready) return undefined;
    const node = hero.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting), {
      rootMargin: `-${Math.round(headerHeight)}px 0px 0px 0px`,
      threshold: 0,
    });
    io.observe(node);
    return () => io.disconnect();
  }, [ready, headerHeight]);

  return { condensed, headerHeight, bandHeight, hero };
}

/* Small line icons for the includes list. Stroke-only, so they sit quietly
   beside the text rather than competing with it. */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ClockGlyph = () => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
    <circle cx="8" cy="8" r="6.2" {...stroke} />
    <path d="M8 4.6V8l2.4 1.6" {...stroke} />
  </svg>
);

const ListGlyph = () => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" {...stroke} />
  </svg>
);

const LevelGlyph = () => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
    <path d="M2.5 13V9.5M8 13V5.5M13.5 13V2.5" {...stroke} />
  </svg>
);

const KeyGlyph = () => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
    <circle cx="5.5" cy="5.5" r="3" {...stroke} />
    <path d="M7.7 7.7 13 13M11 11l-1.4 1.4M13 13l1-1" {...stroke} />
  </svg>
);

const TrophyGlyph = () => (
  <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
    <path d="M4.5 2.5h7v3a3.5 3.5 0 0 1-7 0v-3Z" {...stroke} />
    <path d="M4.5 3.5h-2v1a2 2 0 0 0 2 2M11.5 3.5h2v1a2 2 0 0 1-2 2M8 9v2.5M5.5 13.5h5" {...stroke} />
  </svg>
);
