import type { Media, Ref } from "./types";

/**
 * Media urls are absolute in the API response, but a deployment that serves
 * uploads from a relative path still works: each app sets its API base once at
 * startup and the shared components resolve against it.
 */
let apiBase = "";

export function setApiBase(url: string) {
  apiBase = url.replace(/\/$/, "");
}

export function getApiBase() {
  return apiBase;
}

export function mediaUrl(media: Ref<Media> | undefined): string | null {
  if (!media) return null;
  const url = typeof media === "string" ? media : media.url;
  if (!url) return null;
  return url.startsWith("http") ? url : `${apiBase}${url}`;
}

/** Populated refs come back as objects; unpopulated ones as id strings. */
export function asMedia(media: Ref<Media> | undefined): Media | null {
  return media && typeof media === "object" ? media : null;
}

/** The id behind a reference, whichever form it arrived in. */
export function mediaId(media: Ref<Media> | undefined): string | null {
  if (!media) return null;
  return typeof media === "string" ? media : media.id;
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** True once a lesson actually has something to play. */
export function hasVideo(lesson: { videoUrl?: string | null; media?: Ref<Media> }): boolean {
  return Boolean(lesson.videoUrl?.trim() || lesson.media);
}
