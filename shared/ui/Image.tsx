import { mediaUrl } from "../media";
import type { Media, Ref } from "../types";

interface ImageProps {
  media?: Ref<Media>;
  alt?: string;
  className?: string;
  eager?: boolean;
  /** Shown when no media is attached; omit to render nothing. */
  fallback?: React.ReactNode;
}

/** Renders a media reference, whether it arrived populated or as an id. */
export function Image({ media, alt, className = "", eager = false, fallback = null }: ImageProps) {
  const url = mediaUrl(media);
  if (!url) return <>{fallback}</>;

  const altText = alt ?? (typeof media === "object" && media ? media.alt : "") ?? "";

  return (
    <img
      src={url}
      alt={altText}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`max-w-full ${className}`}
    />
  );
}

/** The circular play affordance from the original preview links. */
export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-[26px] flex-none place-items-center rounded-full bg-primary transition-transform duration-200 group-hover:scale-110 ${className}`}
    >
      <span className="ml-0.5 border-y-[5px] border-l-[7px] border-y-transparent border-l-white" />
    </span>
  );
}
