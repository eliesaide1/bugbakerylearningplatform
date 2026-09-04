import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface RevealProps {
  as?: ElementType;
  delay?: number;
  className?: string;
  children?: ReactNode;
  id?: string;
}

/**
 * Adds the `in` class once the element scrolls into view, matching the
 * staggered reveal of the original page.
 */
export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(prefersReducedMotion);

  useEffect(() => {
    const node = ref.current;
    if (shown || !node) return undefined;

    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        obs.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`rise ${shown ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${Math.min(delay, 520)}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Hero content plays on load instead of waiting for a scroll. */
export function RevealOnLoad({ as: Tag = "div", delay = 0, className = "", children, ...rest }: RevealProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Tag
      className={`rise ${shown ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${Math.min(delay, 520)}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
