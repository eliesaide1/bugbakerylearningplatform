import { Link } from "react-router-dom";
import { bandOf } from "@shared/styles";
import { MarkGlyph, PlayGlyph, RichText } from "@shared/ui";
import { mediaUrl } from "../api/client";
import { Reveal } from "../components/Reveal";
import type { Program, Section } from "@shared/types";

/**
 * Programs with no cover uploaded still have to look deliberate, so the mark
 * stands in — tinted differently down the row, so six cards do not read as one
 * repeated block.
 */
const TINTS = [
  "bg-primary-soft text-primary",
  "bg-secondary-soft text-secondary-deep",
  "bg-tertiary-soft text-tertiary",
];

function Cover({ program, index }: { program: Program; index: number }) {
  const src = mediaUrl(program.cover);

  return (
    <span className="relative block aspect-video w-full overflow-hidden rounded-panel border border-line-strong">
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <span className={`grid size-full place-items-center ${TINTS[index % TINTS.length]}`}>
          <MarkGlyph className="size-[38%] opacity-30 transition-transform duration-500 group-hover:scale-110" />
        </span>
      )}

      {program.freeCount ? (
        <span className="absolute top-2 left-2 flex items-center gap-1 border border-secondary bg-secondary-soft px-1.5 py-0.5 font-mono text-[0.64rem] tracking-wide text-secondary-deep uppercase">
          <PlayGlyph className="size-3" />
          {program.freeCount} free
        </span>
      ) : null}
    </span>
  );
}

/** One fact, in its own outline — the shape a course card reads best in. */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 border border-line-strong px-1.5 py-0.5 font-mono text-[0.68rem] tabular-nums text-muted">
      {children}
    </span>
  );
}

function ProgramCard({ program, index }: { program: Program; index: number }) {
  // Run time is only known once lectures carry durations; until then the
  // program's own length is the honest thing to show in its place.
  const hours = program.runtime || program.length;

  return (
    <Link
      to={`/programs/${program.slug}`}
      className="group flex h-full flex-col gap-2.5 rounded-panel border border-line-strong bg-panel p-2.5 no-underline transition-colors hover:border-primary"
    >
      <Cover program={program} index={index} />

      <span className="flex flex-1 flex-col px-0.5 pb-0.5">
        <span className="line-clamp-2 block font-display text-[1rem] leading-tight font-extrabold tracking-[-0.02em] text-ink group-hover:text-primary">
          {program.title}
        </span>

        {program.instructor ? (
          <span className="mt-1 line-clamp-1 block text-[0.78rem] text-muted">
            {program.instructor}
          </span>
        ) : null}

        {program.summary ? (
          <span className="mt-1.5 line-clamp-2 block text-[0.85rem] leading-snug text-ink-2">
            {program.summary}
          </span>
        ) : null}

        {/* Pushed down so the facts and price line up across the row. */}
        <span className="mt-auto block pt-2.5">
          <span className="flex flex-wrap items-center gap-1">
            {program.badge ? (
              <span className="inline-flex items-center bg-tertiary-soft px-1.5 py-0.5 text-[0.68rem] font-semibold text-tertiary">
                {program.badge}
              </span>
            ) : null}
            {program.freeCount ? (
              <Pill>
                <PlayGlyph className="size-3 text-secondary-deep" />
                {program.freeCount} free
              </Pill>
            ) : null}
            {hours ? <Pill>{hours}</Pill> : null}
            {program.lessonCount ? <Pill>{program.lessonCount} lectures</Pill> : null}
            {program.level ? <Pill>{program.level}</Pill> : null}
          </span>

          {program.price ? (
            <span className="mt-2.5 flex items-baseline gap-2">
              <span className="font-display text-[1.05rem] font-extrabold text-ink">
                {program.price}
              </span>
              {program.originalPrice ? (
                <span className="text-[0.84rem] text-muted line-through">{program.originalPrice}</span>
              ) : null}
            </span>
          ) : (
            <span className="mt-2.5 flex items-center gap-1.5 text-[0.84rem] font-semibold text-primary">
              See the curriculum
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function ProgramsSection({ section, programs }: { section: Section; programs: Program[] }) {
  const band = bandOf(section.theme);

  return (
    <>
      <div className="mt-8 grid items-stretch gap-3 md:grid-cols-3">
        {programs.map((program, index) => (
          <Reveal key={program.id} delay={Math.min(index * 70, 350)} className="h-full">
            <ProgramCard program={program} index={index} />
          </Reveal>
        ))}
      </div>

      {section.body ? (
        <Reveal>
          <RichText
            text={section.body}
            className={`mt-7 max-w-[62ch] text-step-1 leading-[1.5] ${band.lede}`}
          />
        </Reveal>
      ) : null}
    </>
  );
}
