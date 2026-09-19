import { useEffect, useState } from "react";
import { Chevron } from "@shared/ui";
import { runtimeOf } from "@shared/duration";
import { LessonRow } from "./LessonPlaylist";
import type { Lesson, ProgramModule } from "@shared/types";

/**
 * The contents list beside a lesson, grouped under its section headings.
 *
 * A flat run of two hundred lectures tells you nothing about where you are.
 * Grouped, the rail answers "which part of the course is this" without you
 * having to go back to the course page and count.
 *
 * Only the section you are in opens by default — the rest stay shut, so the
 * whole course stays scannable in a column.
 */
export function LessonRail({
  lessons,
  modules,
  programSlug,
  programTitle,
  activeSlug,
  enrolled = false,
}: {
  lessons: Lesson[];
  modules?: ProgramModule[];
  programSlug: string;
  programTitle: string;
  activeSlug?: string;
  enrolled?: boolean;
}) {
  const position = lessons.findIndex((l) => l.slug === activeSlug);
  const activeModule = lessons[position]?.module ?? 0;
  const [open, setOpen] = useState<number>(typeof activeModule === "number" ? activeModule : 0);

  // Moving to a lesson in another section should bring that section with you.
  useEffect(() => {
    if (typeof activeModule === "number") setOpen(activeModule);
  }, [activeModule]);

  const sections = (modules ?? []).map((module, index) => ({
    module,
    index,
    own: lessons.filter((l) => l.module === index),
  }));

  // Nothing to group by: fall back to the plain run rather than one empty box.
  const grouped = sections.filter((s) => s.own.length);

  return (
    <div className="overflow-hidden rounded-panel border border-line-strong bg-panel">
      <div className="border-b border-line px-4 py-3">
        <p className="font-display text-[1rem] leading-tight font-extrabold">{programTitle}</p>
        <p className="mt-1 font-mono text-[0.74rem] tabular-nums text-muted">
          {position >= 0 ? `${position + 1} / ${lessons.length}` : lessons.length} ·{" "}
          {runtimeOf(lessons)}
        </p>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {grouped.length
          ? grouped.map(({ module, index, own }) => {
              const isOpen = open === index;
              const holdsActive = own.some((l) => l.slug === activeSlug);

              return (
                <section key={module._id ?? index} className="border-b border-line last:border-b-0">
                  <h3 className="m-0">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      className={`group grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-x-2.5 border-l-2 px-3.5 py-3 text-left transition-colors ${
                        holdsActive
                          ? "border-l-primary bg-primary-soft/50"
                          : "border-l-transparent hover:bg-paper"
                      }`}
                    >
                      <Chevron open={isOpen} className="mt-1 size-3 text-muted" />
                      <span className="min-w-0">
                        <span className="block text-[0.86rem] leading-snug font-semibold text-ink group-hover:text-primary">
                          {index + 1}. {module.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-[0.7rem] tabular-nums text-muted">
                          {own.length} lectures · {runtimeOf(own)}
                        </span>
                      </span>
                    </button>
                  </h3>

                  {isOpen ? (
                    <div className="animate-panel-open divide-y divide-line border-t border-line bg-paper/40">
                      {own.map((item) => (
                        <LessonRow
                          key={item.id}
                          lesson={item}
                          index={lessons.indexOf(item)}
                          programSlug={programSlug}
                          active={item.slug === activeSlug}
                          compact
                          enrolled={enrolled}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })
          : lessons.map((item, index) => (
              <LessonRow
                key={item.id}
                lesson={item}
                index={index}
                programSlug={programSlug}
                active={item.slug === activeSlug}
                compact
                enrolled={enrolled}
              />
            ))}
      </div>
    </div>
  );
}
