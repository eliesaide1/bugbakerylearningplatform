import { useEffect } from "react";
import { useSite } from "../api/queries";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { Hero } from "../sections/Hero";
import { SectionRenderer } from "../sections/SectionRenderer";
import { EnrollForm } from "../sections/EnrollForm";
import { TrackProvider } from "../state/TrackContext";
import { Container } from "@shared/ui";

export default function Home() {
  const { data, isLoading, isError, error, refetch } = useSite();
  const settings = data?.settings;

  // The page title and description are CMS-managed too.
  useEffect(() => {
    if (!settings) return;
    document.title = settings.metaTitle || `${settings.brandName} — Software Training`;
    if (settings.metaDescription) {
      const tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute("content", settings.metaDescription);
    }
  }, [settings]);

  if (isLoading) return <PageState kind="loading" />;
  if (isError || !data) {
    return <PageState kind="error" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const { sections, technologies, programs, settings: site } = data;

  return (
    <TrackProvider>
      <Header settings={site} sections={sections} />

      {site.announcement?.active && site.announcement.text ? (
        <div className="bg-primary text-white">
          <Container className="py-2.5 text-center text-[0.95rem]">
            {site.announcement.href ? (
              <a href={site.announcement.href} className="text-white underline underline-offset-4">
                {site.announcement.text}
              </a>
            ) : (
              site.announcement.text
            )}
          </Container>
        </div>
      ) : null}

      <main>
        <Hero settings={site} technologies={technologies} programs={programs} />

        {sections.map((section) => (
          <SectionRenderer key={section.id} section={section} site={data} />
        ))}

        <EnrollForm settings={site} programs={programs} />
      </main>

      <Footer settings={site} />
    </TrackProvider>
  );
}
