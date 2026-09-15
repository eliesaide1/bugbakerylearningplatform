import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRealtime } from "../realtime/RealtimeProvider";
import { useTrainee } from "../state/TraineeContext";
import { useActiveSection } from "../hooks/useActiveSection";
import { Container, Image, buttonClasses } from "@shared/ui";
import type { Section, SiteSettings } from "@shared/types";

interface HeaderProps {
  settings?: SiteSettings;
  sections?: Section[];
}

const BOOTCAMP = "/bootcamp";

/** The nav is built from whichever sections the CMS gave a nav label. */
export function Header({ settings, sections = [] }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { connected } = useRealtime();
  const { trainee } = useTrainee();
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const onBootcamp = pathname.startsWith(BOOTCAMP);

  const links = useMemo(
    () =>
      sections
        .filter((s) => s.navLabel)
        // The bootcamp has its own page, linked on its own below; an anchor to
        // its teaser section would put the same word in the nav twice.
        .filter((s) => s.type !== "bootcamp" && s.navLabel?.trim().toLowerCase() !== "bootcamp")
        .map((s) => ({ label: s.navLabel as string, id: s.slug })),
    [sections]
  );

  // Only the home page has these sections to scroll through. Enroll is tracked
  // too, so it lights up once the reader reaches the form.
  const ids = useMemo(() => (onHome ? [...links.map((l) => l.id), "enroll"] : []), [onHome, links]);
  const active = useActiveSection(ids);

  const anchor = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const isActive = (id: string) => onHome && active === id;

  const linkClass = (current: boolean) =>
    `relative whitespace-nowrap py-1 no-underline transition-colors ${
      current ? "font-semibold text-primary" : "text-ink-2 hover:text-primary"
    }`;

  /** Marks position, not hover — it is the one thing that says "you are here". */
  const underline = (current: boolean) => (
    <span
      aria-hidden="true"
      className={`absolute -bottom-px left-0 h-0.5 w-full origin-left bg-primary transition-transform duration-200 ${
        current ? "scale-x-100" : "scale-x-0"
      }`}
    />
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <Container className="flex items-center justify-between gap-6 py-3.5">
        <Link to="/" className="flex flex-none items-center gap-2.5 no-underline">
          {/* The mark sits beside the wordmark: the name is set in the real
              display font here, which an SVG in an <img> could never load. */}
          <Image media={settings?.logo} alt="" className="size-9 flex-none" eager />
          <span className="flex flex-col leading-none">
            <span className="flex items-center gap-1.5 whitespace-nowrap font-display text-[1.12rem] font-extrabold tracking-[-0.01em]">
              {settings?.brandName || "Bug Bakery"}
              <span
                title={connected ? "Live: this page updates as content is published" : "Reconnecting…"}
                className={`size-1.5 flex-none rounded-full transition-colors ${
                  connected ? "bg-secondary" : "bg-line-strong"
                }`}
              />
            </span>
            {settings?.brandTagline ? (
              <span className="mt-1 whitespace-nowrap font-mono text-[0.68rem] tracking-wide text-muted uppercase">
                {settings.brandTagline}
              </span>
            ) : null}
          </span>
        </Link>

        {/* Eight links and a button need the full container; below xl they
            wrap into two lines, so the menu button takes over instead. */}
        <nav className="hidden items-center gap-5 text-[0.95rem] xl:flex">
          <Link to={BOOTCAMP} aria-current={onBootcamp ? "page" : undefined} className={linkClass(onBootcamp)}>
            Bootcamp
            {underline(onBootcamp)}
          </Link>

          {links.map((link) => (
            <a
              key={link.id}
              href={anchor(link.id)}
              aria-current={isActive(link.id) ? "true" : undefined}
              className={linkClass(isActive(link.id))}
            >
              {link.label}
              {underline(isActive(link.id))}
            </a>
          ))}

          {trainee ? (
            <Link
              to={BOOTCAMP}
              title={`Signed in as ${trainee.name}`}
              className="whitespace-nowrap border-l border-line pl-5 font-mono text-[0.82rem] text-muted no-underline hover:text-primary"
            >
              {trainee.name.split(" ")[0]}
            </Link>
          ) : null}

          <a href={anchor("enroll")} className={buttonClasses("solid", "sm", "ml-1 whitespace-nowrap")}>
            Enroll
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex size-10 flex-none cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-line-strong xl:hidden"
        >
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
        </button>
      </Container>

      {open ? (
        <nav className="animate-panel-open border-t border-line bg-paper xl:hidden">
          <Container className="flex flex-col py-2">
            <Link
              to={BOOTCAMP}
              onClick={() => setOpen(false)}
              aria-current={onBootcamp ? "page" : undefined}
              className={`border-l-2 border-b border-line py-3 pl-3 no-underline ${
                onBootcamp ? "border-l-primary font-semibold text-primary" : "border-l-transparent text-ink-2"
              }`}
            >
              Bootcamp
            </Link>
            {[...links, { label: "Enroll", id: "enroll" }].map((link) => (
              <a
                key={link.id}
                href={anchor(link.id)}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.id) ? "true" : undefined}
                className={`border-l-2 border-b border-line py-3 pl-3 no-underline last:border-b-0 ${
                  isActive(link.id)
                    ? "border-l-primary font-semibold text-primary"
                    : "border-l-transparent text-ink-2"
                }`}
              >
                {link.label}
              </a>
            ))}
            {trainee ? (
              <Link
                to={BOOTCAMP}
                onClick={() => setOpen(false)}
                className="py-3 pl-3.5 font-mono text-[0.82rem] text-muted no-underline"
              >
                Signed in as {trainee.name}
              </Link>
            ) : null}
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
