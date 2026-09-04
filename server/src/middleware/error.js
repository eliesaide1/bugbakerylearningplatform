import { ZodError } from "zod";
import { dbReady } from "../config/db.js";
import { isProd } from "../config/env.js";

/** Wraps async handlers so a rejection reaches the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Data routes are pointless without mongo; fail loudly rather than hang. */
export function requireDb(_req, res, next) {
  if (!dbReady()) {
    return res.status(503).json({
      error: "The database is not connected yet. Start MongoDB and try again.",
    });
  }
  next();
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Some fields need fixing.",
      fields: err.flatten().fieldErrors,
    });
  }
  if (err?.name === "ValidationError") {
    return res.status(400).json({
      error: "Some fields need fixing.",
      fields: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, [v.message]])
      ),
    });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || { value: 1 })[0];
    return res.status(409).json({ error: `That ${field} is already taken.` });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ error: "That id is not valid." });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "That file is too large." });
  }

  const status = err.status || 500;
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({
    error: err.expose || status < 500 ? err.message : "Something broke on our side.",
    ...(isProd ? {} : { stack: status >= 500 ? err.stack : undefined }),
  });
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}
