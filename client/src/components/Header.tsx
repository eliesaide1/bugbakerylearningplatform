import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRealtime } from "../realtime/RealtimeProvider";
import { useActiveSection } from "../hooks/useActiveSection";
import { Container, Image } from "@shared/ui";
import type { Section, SiteSettings } from "@shared/types";

interface HeaderProps {
  settings?: SiteSettings;
  sections?: Section[];
}

/** The nav is built from whichever sections the CMS gave a nav label. */
export function Header({ settings, sections = [] }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { connected } = useRealtime();
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  const links = useMemo(
    () =>
      sections
        .filter((s) => s.navLabel)
        .map((s) => ({ label: s.navLabel as string, id: s.slug }))
        .concat([{ label: "Enroll", id: "enroll" }]),
    [sections]
  );

  // Only the home page has these sections to scroll through.
  const ids = useMemo(() => (onHome ? links.map((l) => l.id) : []), [onHome, links]);
  const active = useActiveSection(ids);

  const linkClass = (id: string) =>
    `no-underline transition-colors ${
      onHome && active === id
        ? "font-semibold text-primary"
        : "text-ink-2 hover:text-primary hover:underline hover:underline-offset-4"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-[-0.01em] no-underline">
          {/* The mark sits beside the wordmark: the name is set in the real
              display font here, which an SVG in an <img> could never load. */}
          <Image media={settings?.logo} alt="" className="size-9 flex-none" eager />
          <span className="flex items-baseline gap-2.5">
            <span className="font-display text-[1.15rem] font-extrabold">
              {settings?.brandName || "Bug Bakery"}
            </span>
            <span className="hidden text-[0.9rem] text-muted sm:inline">{settings?.brandTagline}</span>
          </span>
          <span
            title={connected ? "Live: this page updates as content is published" : "Reconnecting…"}
            className={`size-1.5 rounded-full transition-colors ${connected ? "bg-secondary" : "bg-line-strong"}`}
          />
        </Link>

        <nav className="hidden items-center gap-6 text-[0.97rem] md:flex">
          {links.map((link) => (
            <a
              key={link.id}
              href={onHome ? `#${link.id}` : `/#${link.id}`}
              aria-current={onHome && active === link.id ? "true" : undefined}
              className={`relative py-1 ${linkClass(link.id)}`}
            >
              {link.label}
              {/* The underline marks position; it is not a hover affordance. */}
              <span
                aria-hidden="true"
                className={`absolute -bottom-px left-0 h-0.5 w-full origin-left bg-primary transition-transform duration-200 ${
                  onHome && active === link.id ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex size-10 cursor-pointer flex-col items-center justify-center gap-1.5 border border-line-strong md:hidden"
        >
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
        </button>
      </Container>

      {open ? (
        <nav className="animate-panel-open border-t border-line bg-paper md:hidden">
          <Container className="flex flex-col py-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={onHome ? `#${link.id}` : `/#${link.id}`}
                onClick={() => setOpen(false)}
                aria-current={onHome && active === link.id ? "true" : undefined}
                className={`border-l-2 border-b border-line py-3 pl-3 last:border-b-0 ${
                  onHome && active === link.id
                    ? "border-l-primary font-semibold text-primary"
                    : "border-l-transparent text-ink-2"
                } no-underline`}
              >
                {link.label}
              </a>
            ))}
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
