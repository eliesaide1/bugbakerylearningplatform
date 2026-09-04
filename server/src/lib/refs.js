/**
 * Reads populate their media refs, so a document comes out of the API with
 * `media` as a full object. Anything editing that document then sends the same
 * shape back, and Mongoose cannot cast an object into an ObjectId.
 *
 * Rather than making every client remember to strip them, writes accept either
 * shape and these helpers reduce a populated ref back to its id.
 */

/** A ref in any of its shapes -> an id string, or null. */
export function toId(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.id ?? value._id ?? null;
  return null;
}

/**
 * Returns a copy of `body` with the named fields reduced to ids. Paths ending
 * in `[].field` are applied to every entry of that array.
 */
export function normalizeRefs(body, paths = []) {
  if (!body || typeof body !== "object") return body;
  const out = { ...body };

  for (const path of paths) {
    const [head, tail] = path.split("[].");

    if (!tail) {
      if (head in out) out[head] = toId(out[head]);
      continue;
    }

    if (Array.isArray(out[head])) {
      out[head] = out[head].map((entry) =>
        entry && typeof entry === "object" && tail in entry
          ? { ...entry, [tail]: toId(entry[tail]) }
          : entry
      );
    }
  }

  return out;
}
