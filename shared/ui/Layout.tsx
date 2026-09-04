import type { ReactNode } from "react";
import { bandOf, type SectionTheme } from "../styles";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1120px] px-6 ${className}`}>{children}</div>;
}

/** A full-width horizontal band in one of the theme's colour schemes. */
export function Band({
  theme = "paper",
  id,
  className = "",
  children,
}: {
  theme?: SectionTheme;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-14 md:py-20 ${bandOf(theme).band} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function Card({
  theme = "paper",
  className = "",
  children,
}: {
  theme?: SectionTheme;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`border p-6 ${bandOf(theme).panel} ${className}`}>{children}</div>;
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`m-0 border-0 border-t border-line ${className}`} />;
}
