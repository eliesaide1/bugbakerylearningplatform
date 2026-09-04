import { bandOf } from "@shared/styles";
import { Reveal } from "../components/Reveal";
import { FRAME, vimeoEmbed, youtubeEmbed } from "../components/VideoPlayer";
import { mediaUrl } from "../api/client";
import { ButtonAnchor, Image, RichText } from "@shared/ui";
import type { Section, SiteSettings } from "@shared/types";

export interface BlockProps {
  section: Section;
  settings?: SiteSettings;
}

export function RichBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);
  return (
    <Reveal>
      <RichText text={section.body} className={`mt-6 max-w-[70ch] ${band.lede}`} />
    </Reveal>
  );
}

/** The Sun–Sat strip plus the columns describing the week. */
export function WeekBlock({ section, settings }: BlockProps) {
  const band = bandOf(section.theme);
  const week = settings?.week ?? [];

  return (
    <>
      {week.length ? (
        <div className="mt-7 flex gap-1.5 overflow-x-auto" aria-hidden="true">
          {week.map((day, i) => (
            <Reveal
              key={i}
              delay={i * 70}
              className={`min-w-[74px] flex-1 border px-1 py-3.5 text-center text-[0.85rem] ${
                day.highlight
                  ? "animate-monday-pulse border-secondary bg-secondary font-semibold text-ink"
                  : "border-border-dark bg-surface-dark text-on-dark-muted"
              }`}
            >
              <b className="block font-display text-[0.95rem]">{day.day}</b>
              {day.label}
            </Reveal>
          ))}
        </div>
      ) : null}

      {section.items?.length ? (
        <div className="mt-11 grid gap-10 md:grid-cols-3">
          {section.items.map((item, i) => (
            <Reveal key={item._id ?? i} delay={i * 70}>
              {item.meta ? (
                <span
                  className={`mb-3 inline-block font-mono text-[0.78rem] ${
                    i === 1 ? "text-secondary" : band.eyebrow
                  }`}
                >
                  {item.meta}
                </span>
              ) : null}
              <h3 className={`mb-2.5 text-step-1 ${band.title}`}>{item.title}</h3>
              <p className={`text-[0.99rem] ${band.lede}`}>{item.text}</p>
            </Reveal>
          ))}
        </div>
      ) : null}
    </>
  );
}

/**
 * Comparison cards. One item can be `featured`, which lifts it with an accent
 * bar, a tint and a badge — the pattern a visitor already knows from every
 * pricing table they have ever read.
 */
export function CardsBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);
  const cols = section.items.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2";

  return (
    <>
      <div className={`mt-9 grid items-stretch gap-4 ${cols}`}>
        {section.items.map((item, i) => {
          const featured = item.featured || item.href === "featured";
          const linked = item.href && item.href !== "featured" ? item.href : null;

          return (
            <Reveal key={item._id ?? i} delay={i * 70} className="h-full">
              <article
                className={`relative flex h-full flex-col rounded-panel border p-6 md:p-7 ${
                  featured
                    ? "border-primary border-t-[3px] bg-primary-soft"
                    : `${band.border} border-t-[3px] border-t-line-strong bg-panel`
                }`}
              >
                <Image media={item.media} alt="" className="mb-4 size-10 object-contain" />

                {item.badge ? (
                  <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center rounded-card bg-secondary px-2.5 py-1 font-mono text-[0.68rem] tracking-wide whitespace-nowrap text-ink uppercase">
                    {item.badge}
                  </span>
                ) : null}

                <h3 className="text-[1.3rem]">{item.title}</h3>
                {item.text ? <p className="mt-2 text-[0.99rem] text-ink-2">{item.text}</p> : null}

                <CheckList text={item.meta} className="mt-5" />

                {item.price ? (
                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-[1.6rem] leading-none font-extrabold text-ink">
                      {item.price}
                    </span>
                    {item.priceNote ? (
                      <span className="text-[0.9rem] text-muted">{item.priceNote}</span>
                    ) : null}
                  </p>
                ) : null}

                {item.ctaLabel ? (
                  <ButtonAnchor
                    href={linked ?? "#enroll"}
                    variant={featured ? "solid" : "ghost"}
                    fullWidth
                    className={item.price ? "mt-4" : "mt-6"}
                  >
                    {item.ctaLabel}
                  </ButtonAnchor>
                ) : null}
              </article>
            </Reveal>
          );
        })}
      </div>

      {section.body ? (
        <Reveal>
          <p className={`mt-5 text-[0.95rem] ${band.note}`}>{section.body}</p>
        </Reveal>
      ) : null}
    </>
  );
}

/** Bullet lines rendered as ticks. The last item is pushed apart from the CTA. */
function CheckList({ text, className = "" }: { text?: string; className?: string }) {
  const lines = (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <ul className={`m-0 grid list-none gap-2.5 p-0 ${className} mb-auto`}>
      {lines.map((line, i) => (
        <li key={i} className="grid grid-cols-[auto_1fr] items-start gap-2.5 text-[0.96rem] text-ink-2">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-[5px] size-3.5 flex-none text-primary">
            <path
              d="M3 8.5 6.2 11.5 13 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps in a divided row. */
export function StepsBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);

  return (
    <>
      <div className="mt-9 grid border-t-2 border-ink md:grid-cols-2 lg:grid-cols-4">
        {section.items.map((item, i) => (
          <Reveal
            key={item._id ?? i}
            delay={i * 70}
            className={`border-b py-6 lg:border-r lg:border-b-0 lg:last:border-r-0 lg:pr-6 lg:last:pr-0 ${
              i > 0 ? "lg:pl-6" : ""
            } ${band.border}`}
          >
            {item.meta ? (
              <span className="mb-2.5 block font-mono text-[0.82rem] text-primary">{item.meta}</span>
            ) : null}
            <h3 className="mb-2 text-[1.15rem]">{item.title}</h3>
            <p className="text-[0.96rem] text-ink-2">{item.text}</p>
          </Reveal>
        ))}
      </div>
      {section.body ? (
        <Reveal>
          <p className={`mt-7 text-[0.95rem] ${band.note}`}>{section.body}</p>
        </Reveal>
      ) : null}
    </>
  );
}

/** Facts panel beside a body of text — the instructor block. */
export function SplitBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);

  return (
    <div className="grid items-start gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
      <Reveal className={`border p-6 ${band.panel}`}>
        <Image media={section.media} alt={section.title} className="mb-5 w-full object-cover" />
        <dl className="m-0">
          {section.items.map((item, i) => (
            <div key={item._id ?? i}>
              <dt className={`text-[0.85rem] ${band.note} ${i === 0 ? "" : "mt-4"}`}>{item.meta}</dt>
              <dd className="m-0 mt-0.5 font-semibold">{item.title}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal delay={70}>
        <h2 className={`mb-3.5 text-step-3 ${band.title}`}>{section.title}</h2>
        {section.lede ? (
          <p className={`max-w-[62ch] text-step-1 leading-[1.5] ${band.lede}`}>{section.lede}</p>
        ) : null}
        <RichText text={section.body} className={`mt-4 max-w-[62ch] ${band.lede}`} />
      </Reveal>
    </div>
  );
}

/** Highlighted note with an accent rule, like the free-lesson callout. */
export function CalloutBlock({ section }: BlockProps) {
  return (
    <Reveal className="max-w-[74ch] border-l-4 border-secondary bg-secondary-soft px-6 py-5">
      <b className="font-display text-[1.1rem]">{section.title}</b>
      <RichText text={section.body} className="mt-1.5 text-ink-2" />
      {section.ctaLabel ? (
        <ButtonAnchor href={section.ctaHref || "#enroll"} className="mt-4">
          {section.ctaLabel}
        </ButtonAnchor>
      ) : null}
    </Reveal>
  );
}

export function QuoteBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);
  const attribution = section.items[0];

  return (
    <Reveal as="blockquote" className="m-0 max-w-[70ch]">
      <p className={`font-display text-step-2 leading-[1.25] font-extrabold ${band.title}`}>
        “{section.body}”
      </p>
      {attribution?.title ? (
        <footer className={`mt-4 text-[0.95rem] ${band.note}`}>
          {attribution.title}
          {attribution.meta ? ` · ${attribution.meta}` : ""}
        </footer>
      ) : null}
    </Reveal>
  );
}

export function CtaBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);

  return (
    <Reveal className="flex flex-wrap items-center justify-between gap-6">
      <div>
        <h2 className={`text-step-3 ${band.title}`}>{section.title}</h2>
        {section.lede ? <p className={`mt-2.5 max-w-[62ch] ${band.lede}`}>{section.lede}</p> : null}
      </div>
      {section.ctaLabel ? (
        <ButtonAnchor variant={band.button} href={section.ctaHref || "#enroll"}>
          {section.ctaLabel}
        </ButtonAnchor>
      ) : null}
    </Reveal>
  );
}

/** A single embedded or uploaded video with optional supporting copy. */
export function VideoBlock({ section }: BlockProps) {
  const band = bandOf(section.theme);
  const external = section.videoUrl?.trim();
  const embed = external ? (youtubeEmbed(external) ?? vimeoEmbed(external)) : null;
  const file = mediaUrl(section.media);

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <Reveal>
        {embed ? (
          <iframe
            src={embed}
            title={section.title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className={FRAME}
          />
        ) : external || file ? (
          <video controls preload="metadata" className={FRAME}>
            <source src={(external || file) as string} />
            Your browser cannot play this video.
          </video>
        ) : (
          <div className={`${FRAME} grid place-items-center text-sm text-on-dark-muted`}>
            No video attached yet.
          </div>
        )}
      </Reveal>

      {section.body ? (
        <Reveal delay={70}>
          <RichText text={section.body} className={band.lede} />
        </Reveal>
      ) : null}
    </div>
  );
}

export function GalleryBlock({ section }: BlockProps) {
  const images = section.items.filter((item) => mediaUrl(item.media));
  if (!images.length) return null;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((item, i) => (
        <Reveal key={item._id ?? i} delay={i * 60}>
          <figure className="m-0">
            <Image
              media={item.media}
              alt={item.title}
              className="w-full border border-line-strong object-cover"
            />
            {item.title ? (
              <figcaption className="mt-2 text-[0.9rem] text-muted">{item.title}</figcaption>
            ) : null}
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
