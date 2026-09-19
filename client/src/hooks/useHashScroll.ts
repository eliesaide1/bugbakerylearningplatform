import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to `#section` once that section actually exists.
 *
 * The browser handles a hash on its own, but only at load, and this is a single
 * page app: arriving at /#programs from another route, the browser looks for
 * the element before the page has fetched its content, finds nothing, and
 * silently gives up at the top. So we wait for the element to appear and then
 * scroll it ourselves.
 */
export function useHashScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return undefined;

    let raf = 0;
    // The section renders when its data lands, which is a network round trip
    // away. Keep looking for a couple of seconds, then stop rather than spin.
    const deadline = performance.now() + 2500;

    const attempt = () => {
      const target = document.getElementById(id);
      if (target) {
        // scroll-mt on the section keeps it clear of the sticky header.
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (performance.now() < deadline) raf = requestAnimationFrame(attempt);
    };

    raf = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);
}
