import { Link } from "react-router-dom";
import { Badge, ButtonLink } from "@shared/ui";
import { Reveal } from "../components/Reveal";
import { useTracks } from "../api/queries";
import type { Section } from "@shared/types";

/**
 * The bootcamp, on the home page. Distinct from the programs band above it:
 * a program is a course you watch, a track is twelve weeks of work with your
 * code being read at the end of each one. Saying that plainly is most of the
 * marketing this needs.
 */
export function BootcampSection({ section }: { section: Section }) {
  const { data: tracks = [] } = useTracks();
  if (!tracks.length) return null;

  return (
    <div className="mt-8">
      <div className="grid gap-6 md:grid-cols-2">
        {tracks.map((track, i) => (
          <Reveal key={track.id} delay={i * 70}>
            <Link
              to={`/bootcamp/${track.slug}`}
              className="group flex h-full flex-col border border-line-strong border-t-[4px] border-t-primary bg-panel p-6 no-underline transition-colors hover:border-primary"
            >
              <div className="flex flex-wrap items-center gap-2">
                {track.weeks ? (
                  <Badge tone="primary">
                    {track.weeks} weeks · {Math.round(track.weeks / 4)} months
                  </Badge>
                ) : null}
                {track.level ? <Badge>{track.level}</Badge> : null}
              </div>

              <h3 className="mt-3 font-display text-[1.4rem] leading-tight font-extrabold group-hover:text-primary">
                {track.title}
              </h3>
              {track.stack ? (
                <p className="mt-1.5 font-mono text-[0.82rem] text-muted">{track.stack}</p>
              ) : null}
              {track.summary ? (
                <p className="mt-3 text-[0.96rem] leading-snug text-ink-2">{track.summary}</p>
              ) : null}

              {track.outcomes?.length ? (
                <ul className="mt-4 space-y-1.5">
                  {track.outcomes.slice(0, 3).map((outcome, j) => (
                    <li
                      key={j}
                      className="grid grid-cols-[auto_1fr] gap-3 text-[0.92rem] text-ink-2"
                    >
                      <span aria-hidden="true" className="mt-[10px] h-px w-3 bg-primary" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-auto pt-5 font-mono text-[0.78rem] tabular-nums text-muted">
                {track.stepCount} steps · watch, build, fix a real bug, ship it
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal delay={140} className="mt-8 flex flex-wrap items-center gap-4">
        <ButtonLink to="/bootcamp">{section.ctaLabel || "See how it works"}</ButtonLink>
        <p className="text-[0.92rem] text-muted">
          Every step is checked the moment you hand it in.
        </p>
      </Reveal>
    </div>
  );
}
