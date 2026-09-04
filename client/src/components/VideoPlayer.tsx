import { asMedia, mediaUrl } from "../api/client";
import type { Lesson, Media, Ref } from "@shared/types";

/** youtu.be/ID, /watch?v=ID and /embed/ID all normalise to an embed url. */
export function youtubeEmbed(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function vimeoEmbed(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export const FRAME = "aspect-video w-full border border-line-strong bg-ink";

interface VideoPlayerProps {
  lesson?: Lesson | null;
  poster?: Ref<Media>;
  className?: string;
}

/**
 * Plays whatever the CMS attached: an uploaded file, a YouTube or Vimeo link,
 * or any other embeddable url.
 */
export function VideoPlayer({ lesson, poster, className = "" }: VideoPlayerProps) {
  if (!lesson) return null;

  const uploaded = mediaUrl(lesson.media);
  const external = lesson.videoUrl?.trim();

  if (lesson.source === "upload" && uploaded) {
    return (
      <video
        controls
        preload="metadata"
        poster={mediaUrl(poster ?? lesson.thumbnail) ?? undefined}
        className={`${FRAME} ${className}`}
      >
        <source src={uploaded} type={asMedia(lesson.media)?.mimeType || "video/mp4"} />
        Your browser cannot play this video.
      </video>
    );
  }

  const embed = external ? (youtubeEmbed(external) ?? vimeoEmbed(external)) : null;

  if (embed) {
    return (
      <iframe
        src={embed}
        title={lesson.title || "Lesson video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className={`${FRAME} ${className}`}
      />
    );
  }

  if (external) {
    return (
      <video controls preload="metadata" className={`${FRAME} ${className}`}>
        <source src={external} />
        Your browser cannot play this video.
      </video>
    );
  }

  return (
    <div className={`${FRAME} ${className} grid place-items-center px-6 text-center text-sm text-on-dark-muted`}>
      This lesson has no video attached yet.
    </div>
  );
}
