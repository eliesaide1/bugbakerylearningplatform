import { useEffect, useState } from "react";

/**
 * Which section the reader is currently in.
 *
 * Rather than firing on whichever element merely intersects — which flickers
 * when two are on screen at once — this tracks every section's position and
 * picks the last one whose top has passed the reading line just below the
 * sticky header. That gives one unambiguous answer at any scroll position, and
 * it still resolves correctly at the very bottom of the page, where a short
 * final section can never reach the line.
 */
export function useActiveSection(ids: string[], offset = 96): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (!ids.length) return undefined;

    let frame = 0;

    const measure = () => {
      frame = 0;

      const line = window.scrollY + offset;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      let current: string | null = null;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        // offsetTop walks up the offsetParent chain, so it is the page
        // position regardless of how the section is nested.
        if (el.getBoundingClientRect().top + window.scrollY <= line) current = id;
      }

      // The last section may be too short to reach the line; at the end of the
      // page it is unambiguously the one being read.
      if (atBottom) {
        const last = [...ids].reverse().find((id) => document.getElementById(id));
        if (last) current = last;
      }

      setActive(current ?? ids[0] ?? null);
    };

    const onScroll = () => {
      // Coalesce to one measurement per frame; scroll fires far more often.
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, offset]);

  return active;
}
