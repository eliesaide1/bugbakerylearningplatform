import { Container } from "@shared/ui";
import type { SiteSettings } from "@shared/types";

export function Footer({ settings }: { settings?: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <Container className="flex flex-wrap justify-between gap-4 py-7 text-[0.92rem] text-muted">
        <span>{settings?.footerNote || `Software training by ${settings?.brandName ?? "Bug Bakery"}`}</span>
        <span className="flex gap-4">
          <a href="#programs" className="text-ink-2">
            Programs
          </a>
          <a href="#enroll" className="text-ink-2">
            Enroll
          </a>
          <span>© {year}</span>
        </span>
      </Container>
    </footer>
  );
}
