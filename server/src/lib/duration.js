/**
 * Mirrors shared/duration.ts for the server, which is plain JavaScript and so
 * cannot import the TypeScript module the frontends share.
 */

/** "mm:ss" or "h:mm:ss" -> seconds. Returns 0 for anything unparseable. */
export function parseDuration(duration) {
  if (!duration) return 0;
  const parts = String(duration).trim().split(":").map(Number);
  if (!parts.length || parts.some((p) => Number.isNaN(p))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function sumDuration(items = []) {
  return items.reduce((total, item) => total + parseDuration(item?.duration), 0);
}

/** 14792 -> "4h 07m"; 2718 -> "45m". Empty string when there is nothing to show. */
export function formatRuntime(seconds) {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

export function runtimeOf(items = []) {
  return formatRuntime(sumDuration(items));
}
