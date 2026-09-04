import { Link } from "react-router-dom";
import { RevealOnLoad } from "../components/Reveal";
import { ButtonAnchor, Container, Image, PlayGlyph } from "@shared/ui";
import { TrackBuilder } from "./TrackBuilder";
import type { Program, SiteSettings, Technology } from "@shared/types";

interface HeroProps {
  settings?: SiteSettings;
  technologies: Technology[];
  programs?: Program[];
}

export function Hero({ settings, technologies, programs = [] }: HeroProps) {
  const primary = settings?.heroPrimaryCta;
  const secondary = settings?.heroSecondaryCta;
  const freeCount = programs.reduce((total, p) => total + (p.freeCount ?? 0), 0);

  return (
    <section className="pt-9 pb-16 md:pb-19">
      <Container>
        <div className="grid items-start gap-9 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <div>
            <RevealOnLoad as="h1" className="text-step-4">
              {settings?.heroTitle}{" "}
              {settings?.heroHighlight ? <span className="hero-mark">{settings.heroHighlight}</span> : null}
            </RevealOnLoad>

            <RevealOnLoad delay={70} className="mt-5">
              <p className="max-w-[62ch] text-step-1 leading-[1.5] text-ink-2">{settings?.heroLede}</p>
            </RevealOnLoad>

            <RevealOnLoad delay={140} className="mt-7 flex flex-wrap gap-3">
              {primary?.label ? (
                <ButtonAnchor href={primary.href || "#enroll"}>{primary.label}</ButtonAnchor>
              ) : null}
              {secondary?.label ? (
                <ButtonAnchor variant="ghost" href={secondary.href || "#programs"}>
                  {secondary.label}
                </ButtonAnchor>
              ) : null}
            </RevealOnLoad>

            {settings?.heroStats?.length ? (
              <RevealOnLoad
                delay={210}
                className="mt-8 grid grid-cols-2 justify-start gap-5 border-t border-line pt-5 text-[0.95rem] text-ink-2 sm:grid-cols-3 sm:gap-6"
              >
                {settings.heroStats.map((stat, i) => (
                  <div key={i}>
                    <b className="block font-display text-[1.5rem] font-extrabold text-ink">{stat.value}</b>
                    {stat.label}
                  </div>
                ))}
              </RevealOnLoad>
            ) : null}

            {/* The courses themselves, so the hero ends on somewhere to go
                rather than on empty space beside the taller builder. */}
            {programs.length ? (
              <RevealOnLoad delay={280} className="mt-8 border-t border-line pt-5">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[0.72rem] tracking-wide text-muted uppercase">
                    Jump into a program
                  </span>
                  {freeCount ? (
                    <a
                      href="#programs"
                      className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] text-secondary-deep no-underline hover:underline"
                    >
                      <PlayGlyph className="size-3" />
                      {freeCount} lessons free to watch
                    </a>
                  ) : null}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {programs.map((program) => (
                    <Link
                      key={program.id}
                      to={`/programs/${program.slug}`}
                      className="rounded-full border border-line-strong bg-panel px-2.5 py-1 text-[0.8rem] text-ink-2 no-underline transition-colors hover:border-primary hover:text-primary"
                    >
                      {program.title.length > 34 ? `${program.title.slice(0, 32)}…` : program.title}
                    </Link>
                  ))}
                </div>
              </RevealOnLoad>
            ) : null}

            {settings?.heroMedia ? (
              <RevealOnLoad delay={340} className="mt-8">
                <Image
                  media={settings.heroMedia}
                  className="w-full border border-line-strong object-cover"
                  eager
                />
              </RevealOnLoad>
            ) : null}
          </div>

          <RevealOnLoad delay={280}>
            <TrackBuilder technologies={technologies} settings={settings} />
          </RevealOnLoad>
        </div>
      </Container>
    </section>
  );
}
