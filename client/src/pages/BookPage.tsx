import { Link } from "react-router-dom";
import { useSite, useSlots } from "../api/queries";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BookingCalendar } from "../components/BookingCalendar";
import { Reveal } from "../components/Reveal";
import { CheckGlyph, Container, Image } from "@shared/ui";

/** The 1:1 card on the page is the same offer, so the panel reads from it. */
function useOffer() {
  const { data } = useSite();
  const card = data?.sections
    .find((s) => s.slug === "formats")
    ?.items.find((i) => i.featured || /1:1/.test(i.title ?? ""));

  return {
    card,
    programs: data?.programs ?? [],
    settings: data?.settings,
    sections: data?.sections,
    bullets: (card?.meta || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export default function BookPage() {
  const { card, bullets, programs, settings, sections } = useOffer();
  const { data: slots } = useSlots();

  return (
    <>
      <Header settings={settings} sections={sections} />

      <main>
        <Container className="py-10 md:py-14">
          <Link to="/" className="text-[0.95rem] text-ink-2 underline underline-offset-4 hover:text-primary">
            ← Back to the site
          </Link>

          <Reveal className="mt-6 max-w-[62ch]">
            <h1 className="text-step-3">Book a 1:1 hour</h1>
            <p className="mt-4 text-step-1 leading-[1.5] text-ink-2">
              {card?.text ||
                "Private time for debugging your own project, a code review, or interview preparation."}
            </p>
          </Reveal>

          <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
            {/* ------------------------ what you are booking ------------------------ */}
            <Reveal className="lg:sticky lg:top-24">
              <aside className="rounded-panel border border-line-strong bg-panel p-5">
                <Image media={card?.media} alt="" className="mb-4 size-10 object-contain" />

                <p className="flex items-baseline gap-2">
                  <span className="font-display text-[1.8rem] leading-none font-extrabold text-ink">
                    {slots?.price || card?.price || "—"}
                  </span>
                  <span className="text-[0.9rem] text-muted">
                    {slots?.priceNote || card?.priceNote || ""}
                  </span>
                </p>

                <p className="mt-3 border-t border-line pt-3 font-mono text-[0.78rem] tabular-nums text-muted">
                  {slots?.slotMinutes ?? 60} minutes · online · one to one
                </p>

                {bullets.length ? (
                  <ul className="m-0 mt-4 grid list-none gap-2 p-0">
                    {bullets.map((line, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-[auto_1fr] items-start gap-2.5 text-[0.92rem] text-ink-2"
                      >
                        <CheckGlyph className="mt-[5px] size-3.5 text-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-4 border-t border-line pt-3 text-[0.85rem] text-muted">
                  With {settings?.brandName ?? "Bug Bakery"}
                  {settings?.location ? ` · ${settings.location}` : ""}
                </p>
              </aside>
            </Reveal>

            <Reveal delay={70}>
              <BookingCalendar programs={programs} />
            </Reveal>
          </div>
        </Container>
      </main>

      <Footer settings={settings} />
    </>
  );
}
