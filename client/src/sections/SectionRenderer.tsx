import { bandOf } from "@shared/styles";
import { Reveal } from "../components/Reveal";
import { Container, SectionHeading } from "@shared/ui";
import {
  CalloutBlock,
  CardsBlock,
  CtaBlock,
  GalleryBlock,
  QuoteBlock,
  RichBlock,
  SplitBlock,
  StepsBlock,
  VideoBlock,
  WeekBlock,
} from "./blocks";
import { ProgramsSection } from "./ProgramsSection";
import { BootcampSection } from "./BootcampSection";
import { FaqSection } from "./FaqSection";
import { TrackBuilder } from "./TrackBuilder";
import type { Section, SectionType, SitePayload } from "@shared/types";

/** These lay out their own title, so the shared heading is skipped. */
const SELF_TITLED = new Set<SectionType>(["split", "callout", "quote", "cta"]);

interface SectionRendererProps {
  section: Section;
  site: SitePayload;
}

export function SectionRenderer({ section, site }: SectionRendererProps) {
  const band = bandOf(section.theme);

  return (
    <section id={section.slug} className={`scroll-mt-20 py-14 md:py-20 ${band.band}`}>
      <Container>
        {SELF_TITLED.has(section.type) ? null : (
          <Reveal>
            <SectionHeading
              theme={section.theme}
              eyebrow={section.eyebrow}
              title={section.title}
              lede={section.lede}
            />
          </Reveal>
        )}
        <SectionBody section={section} site={site} />
      </Container>
    </section>
  );
}

function SectionBody({ section, site }: SectionRendererProps) {
  const { settings, programs, faqs, technologies } = site;

  switch (section.type) {
    case "week":
      return <WeekBlock section={section} settings={settings} />;
    case "cards":
      return <CardsBlock section={section} />;
    case "steps":
      return <StepsBlock section={section} />;
    case "split":
      return <SplitBlock section={section} />;
    case "callout":
      return <CalloutBlock section={section} />;
    case "quote":
      return <QuoteBlock section={section} />;
    case "cta":
      return <CtaBlock section={section} />;
    case "video":
      return <VideoBlock section={section} />;
    case "gallery":
      return <GalleryBlock section={section} />;
    case "programs":
      return <ProgramsSection section={section} programs={programs} />;
    case "bootcamp":
      return <BootcampSection section={section} />;
    case "faq":
      return <FaqSection faqs={faqs} />;
    case "builder":
      return (
        <Reveal className="mt-8 max-w-[560px]">
          <TrackBuilder technologies={technologies} settings={settings} />
        </Reveal>
      );
    case "rich":
    default:
      return <RichBlock section={section} />;
  }
}
