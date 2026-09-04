/**
 * Lesson durations are stored as they are written on a video: "7:30",
 * "1:02:15". These turn a set of them into a run time you can print.
 */

/** "mm:ss" or "h:mm:ss" -> seconds. Returns 0 for anything unparseable. */
export function parseDuration(duration?: string | null): number {
  if (!duration) return 0;
  const parts = duration.trim().split(":").map(Number);
  if (!parts.length || parts.some((p) => Number.isNaN(p))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function sumDuration(items: Array<{ duration?: string | null }>): number {
  return items.reduce((total, item) => total + parseDuration(item.duration), 0);
}

/** 14792 -> "4h 07m"; 2718 -> "45m". Empty string when there is nothing to show. */
export function formatRuntime(seconds: number): string {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (!hours) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function runtimeOf(items: Array<{ duration?: string | null }>): string {
  return formatRuntime(sumDuration(items));
}
