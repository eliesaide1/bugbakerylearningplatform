import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpires }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in to continue." });

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "This account no longer exists." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Your session expired. Sign in again." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have access to this action." });
    }
    next();
  };
}

/**
 * Sets `req.user` when a valid token is present, and carries on regardless.
 *
 * Public pages need to answer differently for a signed-in student — unlocking
 * the lessons they have paid for — without turning the page itself private.
 */
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = (await User.findById(payload.id)) || undefined;
  } catch {
    // An expired or forged token is simply an anonymous visitor here.
  }
  next();
}
