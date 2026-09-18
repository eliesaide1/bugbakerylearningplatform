import { LockGlyph, PlayGlyph } from "@shared/ui";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { hasVideo } from "@shared/media";
import type { Lesson } from "@shared/types";

/**
 * A playlist row: index, thumbnail with its run time burned into the corner,
 * then the title. Locked lessons render the same way but do not link anywhere —
 * the shape of the course stays visible whether or not you have paid for it.
 */
export function LessonRow({
  lesson,
  index,
  programSlug,
  active = false,
  compact = false,
}: {
  lesson: Lesson;
  index: number;
  programSlug: string;
  active?: boolean;
  /** Syllabus listing: one line per lecture, no artwork. */
  compact?: boolean;
}) {
  const free = lesson.isFree && !lesson.locked;
  const watchable = free && hasVideo(lesson);

  if (compact) {
    return (
      <CompactRow
        lesson={lesson}
        index={index}
        programSlug={programSlug}
        active={active}
        watchable={watchable}
      />
    );
  }

  const body = (
    <>
      <span
        className={`pt-1 text-right font-mono text-[0.78rem] tabular-nums ${
          active ? "text-primary" : "text-muted"
        }`}
      >
        {active ? "▶" : String(index + 1).padStart(2, "0")}
      </span>

      <Thumbnail lesson={lesson} watchable={watchable} locked={!free} />

      <span className="min-w-0">
        <span
          className={`block text-[0.95rem] leading-snug font-semibold ${
            active ? "text-primary" : "text-ink group-hover:text-primary"
          }`}
        >
          {lesson.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.78rem] text-muted">
          {watchable ? (
            <span className="font-mono text-secondary-deep">preview</span>
          ) : free ? (
            <span className="font-mono">preview soon</span>
          ) : (
            <span className="flex items-center gap-1 font-mono">
              <LockGlyph className="size-3" />
              locked
            </span>
          )}
          {lesson.duration ? (
            <>
              <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
              <span className="font-mono tabular-nums">{lesson.duration}</span>
            </>
          ) : null}
        </span>
      </span>
    </>
  );

  const shell = `group grid w-full grid-cols-[1.6rem_104px_1fr] items-start gap-x-3 border-l-2 py-2.5 pr-3 pl-2 text-left transition-colors sm:grid-cols-[1.9rem_132px_1fr] sm:gap-x-4 ${
    active
      ? "border-l-primary bg-primary-soft"
      : "border-l-transparent hover:border-l-line-strong hover:bg-paper"
  }`;

  if (watchable) {
    return (
      <Link to={`/watch/${programSlug}/${lesson.slug}`} className={`${shell} no-underline`}>
        {body}
      </Link>
    );
  }

  return <div className={`${shell} cursor-default`}>{body}</div>;
}

/**
 * One lecture on a single line: what it is, what it is called, how long it
 * runs. A course this size is read as a list rather than browsed as artwork,
 * so the run times line up in their own column and the eye can scan them.
 */
function CompactRow({
  lesson,
  index,
  programSlug,
  active,
  watchable,
}: {
  lesson: Lesson;
  index: number;
  programSlug: string;
  active: boolean;
  watchable: boolean;
}) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className={`mt-px grid size-6 flex-none place-items-center rounded-[5px] border transition-colors ${
          active
            ? "border-primary bg-primary text-white"
            : watchable
              ? "border-secondary bg-secondary-soft text-secondary-deep"
              : "border-line-strong bg-paper text-muted group-hover:border-primary group-hover:text-primary"
        }`}
      >
        {/* The glyph says what the row is — a video. Whether it is watchable
            yet is carried by the colour and the preview chip, because a column
            of padlocks reads as a wall rather than a syllabus. */}
        <PlayGlyph className="size-3" />
      </span>

      <span className="hidden font-mono text-[0.72rem] tabular-nums text-muted sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="min-w-0">
        <span
          className={`block truncate text-[0.93rem] leading-snug ${
            active ? "font-semibold text-primary" : "text-ink-2 group-hover:text-primary"
          }`}
          title={lesson.title}
        >
          {lesson.title}
        </span>
      </span>

      {watchable ? (
        <span className="hidden rounded-full bg-secondary-soft px-2 py-0.5 font-mono text-[0.66rem] tracking-wide text-secondary-deep uppercase sm:block">
          preview
        </span>
      ) : null}

      <span
        className={`text-right font-mono text-[0.78rem] tabular-nums ${
          active ? "text-primary" : "text-muted"
        }`}
      >
        {lesson.duration}
      </span>
    </>
  );

  const shell = `group grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 border-l-2 py-2 pr-4 pl-3 text-left transition-colors sm:grid-cols-[auto_auto_1fr_auto_auto] sm:gap-x-3.5 ${
    active
      ? "border-l-primary bg-primary-soft"
      : "border-l-transparent hover:border-l-primary hover:bg-paper"
  }`;

  if (watchable) {
    return (
      <Link to={`/watch/${programSlug}/${lesson.slug}`} className={`${shell} no-underline`}>
        {body}
      </Link>
    );
  }

  return <div className={`${shell} cursor-default`}>{body}</div>;
}

/** Real thumbnail when the CMS has one, a branded placeholder when it does not. */
function Thumbnail({ lesson, watchable, locked }: { lesson: Lesson; watchable: boolean; locked: boolean }) {
  const src = mediaUrl(lesson.thumbnail);

  return (
    <span className="relative block aspect-video w-full overflow-hidden rounded-card border border-line-strong bg-ink">
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          {/* Stand-in artwork: the shell silhouette from the logo, ghosted. */}
          <svg viewBox="0 0 64 40" className="size-full opacity-[0.22]">
            <path d="M10 34a22 18 0 0 1 44 0z" fill="#F4F5F3" />
            <path d="M32 17V33" stroke="#14181F" strokeWidth="3" strokeLinecap="round" />
            <path d="M7 37h50" stroke="#E9A13B" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      )}

      {watchable ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary/95">
            <span className="ml-[3px] border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
          </span>
        </span>
      ) : locked ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center bg-ink/45 text-white"
          title="Included with enrolment"
        >
          <LockGlyph className="size-4" />
        </span>
      ) : null}

      {lesson.duration ? (
        <span className="absolute right-1 bottom-1 rounded-[2px] bg-ink/85 px-1.5 py-0.5 font-mono text-[0.68rem] tabular-nums text-white">
          {lesson.duration}
        </span>
      ) : null}
    </span>
  );
}

/** A bare list of rows, used where there are no modules to group them under. */
export function LessonPlaylist({
  lessons,
  programSlug,
  activeSlug,
  className = "",
}: {
  lessons: Lesson[];
  programSlug: string;
  activeSlug?: string;
  className?: string;
}) {
  if (!lessons.length) return null;

  return (
    <div className={`divide-y divide-line ${className}`}>
      {lessons.map((lesson, index) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          index={index}
          programSlug={programSlug}
          active={lesson.slug === activeSlug}
        />
      ))}
    </div>
  );
}
