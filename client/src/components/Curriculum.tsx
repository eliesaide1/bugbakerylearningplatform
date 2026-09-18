import { Chevron } from "@shared/ui";
import { useMemo, useState } from "react";
import { runtimeOf } from "@shared/duration";
import { LessonRow } from "./LessonPlaylist";
import type { Lesson, ProgramModule } from "@shared/types";

interface CurriculumProps {
  modules?: ProgramModule[];
  outcomes?: string[];
  /** When given, the lectures belonging to each section are listed inside it. */
  lessons?: Lesson[];
  programSlug?: string;
  activeSlug?: string;
  /** Totals for the listing view, where the lessons themselves are not loaded. */
  lessonCount?: number;
  runtime?: string;
  className?: string;
}

/**
 * Course contents: collapsible sections, each reporting how many lectures it
 * holds and how long they run, with the lectures themselves shown as playlist
 * rows. Free lectures link to the player; everything else stays visible but
 * locked, so the shape of the course reads before anyone has paid for it.
 */
export function Curriculum({
  modules,
  outcomes,
  lessons,
  programSlug,
  activeSlug,
  lessonCount,
  runtime,
  className = "",
}: CurriculumProps) {
  const assigned = useMemo(() => lessons ?? [], [lessons]);

  /** Lectures are numbered across the whole course, the way a playlist is. */
  const position = useMemo(
    () => new Map(assigned.map((lesson, index) => [lesson.id, index])),
    [assigned]
  );

  // The section holding the lecture being watched should start open.
  const activeSection = assigned.find((l) => l.slug === activeSlug)?.module;
  const [open, setOpen] = useState<Set<number>>(
    () => new Set([typeof activeSection === "number" ? activeSection : 0])
  );

  if (!modules?.length) return <OutcomeList outcomes={outcomes} className={className} />;

  const grouped = modules.map((module, index) => ({
    module,
    index,
    own: assigned.filter((lesson) => lesson.module === index),
  }));

  const loose = assigned.filter(
    (lesson) => lesson.module == null || lesson.module < 0 || lesson.module >= modules.length
  );

  const totalLectures = lessonCount ?? assigned.length;
  const totalRuntime = runtime || runtimeOf(assigned);
  const allOpen = open.size >= modules.length;

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-[0.78rem] text-muted">
          <b className="font-medium tabular-nums text-ink">{modules.length}</b> sections
          {totalLectures ? (
            <>
              {" · "}
              <b className="font-medium tabular-nums text-ink">{totalLectures}</b> lectures
            </>
          ) : null}
          {totalRuntime ? <span className="tabular-nums"> · {totalRuntime} total length</span> : null}
        </p>

        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(modules.map((_, i) => i)))}
          className="cursor-pointer font-mono text-[0.78rem] text-primary underline-offset-4 hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all sections"}
        </button>
      </div>

      <div className="mt-3 divide-y divide-line overflow-hidden rounded-panel border border-line-strong bg-panel">
        {grouped.map(({ module, index, own }) => {
          const isOpen = open.has(index);
          const panelId = `section-${programSlug ?? "p"}-${index}`;

          return (
            <section key={module._id ?? index}>
              <h4 className="m-0">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={`group grid w-full cursor-pointer grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 border-l-2 px-4 py-3.5 text-left transition-colors ${
                    isOpen ? "border-l-primary bg-paper" : "border-l-transparent hover:bg-paper"
                  }`}
                >
                  <Chevron open={isOpen} className="size-3.5 text-primary" />

                  <span className="font-mono text-[0.76rem] tabular-nums text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0">
                    <span className="block font-display text-[1.02rem] leading-tight font-extrabold tracking-[-0.015em] group-hover:text-primary">
                      {module.title}
                    </span>
                  </span>

                  {/* Deliberately no bar here. Anything part-filled beside a
                      lecture count reads as "how much you have watched", which
                      is a promise this page cannot keep — nobody has started. */}
                  <span className="font-mono text-[0.74rem] whitespace-nowrap tabular-nums text-muted">
                    {[
                      own.length
                        ? `${own.length} lectures`
                        : module.topics?.length
                          ? `${module.topics.length} topics`
                          : "",
                      runtimeOf(own) || module.duration,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </h4>

              {isOpen ? (
                <div id={panelId} className="animate-panel-open border-t border-line">
                  {module.summary ? (
                    <p className="px-4 pt-3 text-[0.9rem] text-muted">{module.summary}</p>
                  ) : null}

                  {own.length ? (
                    <div className="divide-y divide-line py-1">
                      {own.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          index={position.get(lesson.id) ?? 0}
                          programSlug={programSlug ?? ""}
                          active={lesson.slug === activeSlug}
                          compact
                        />
                      ))}
                    </div>
                  ) : module.topics?.length ? (
                    <TopicRows topics={module.topics} />
                  ) : (
                    // Nothing filed here yet. Saying so beats an empty box.
                    <p className="px-4 py-4 text-[0.9rem] text-muted">
                      Lectures for this section are being recorded.
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {loose.length && programSlug ? (
        <div className="mt-5">
          <p className="mb-2 font-mono text-[0.76rem] text-muted">Also included</p>
          <div className="divide-y divide-line border border-line-strong bg-panel py-1">
            {loose.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={position.get(lesson.id) ?? 0}
                programSlug={programSlug}
                active={lesson.slug === activeSlug}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Sections with no lectures recorded yet still show what they cover. */
function TopicRows({ topics }: { topics?: string[] }) {
  if (!topics?.length) return null;

  return (
    <div className="pb-1">
      {topics.map((topic, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr] items-start gap-x-3 px-4 py-2">
          <span aria-hidden="true" className="mt-[11px] h-px w-3 flex-none bg-line-strong" />
          <span className="text-[0.93rem] leading-snug text-ink-2">{topic}</span>
        </div>
      ))}
    </div>
  );
}

/** Programs without sections still get more than a disc bullet. */
function OutcomeList({ outcomes, className = "" }: { outcomes?: string[]; className?: string }) {
  if (!outcomes?.length) return null;

  return (
    <ol className={`m-0 list-none border-t border-line p-0 ${className}`}>
      {outcomes.map((item, i) => (
        <li
          key={i}
          className="grid grid-cols-[auto_1fr] items-baseline gap-4 border-b border-line py-2.5 text-[0.96rem] text-ink-2"
        >
          <span className="font-mono text-[0.76rem] tabular-nums text-muted">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
