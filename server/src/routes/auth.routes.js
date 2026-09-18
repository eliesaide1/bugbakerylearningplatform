import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Wait a few minutes." },
});

const credentials = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

router.post(
  "/login",
  requireDb,
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.checkPassword(password))) {
      throw httpError(401, "Wrong email or password.");
    }
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
    res.json({ token: signToken(user), user: user.toJSON() });
  })
);

router.get("/me", requireDb, requireAuth, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

/**
 * Edit your own profile. Name only: an email is the account's identity and the
 * one factor in signing in, so changing it needs a confirmation round-trip
 * rather than a text field, and the role is never the account holder's to set.
 */
router.patch(
  "/me",
  requireDb,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name } = z
      .object({ name: z.string().trim().min(2, "Tell us your name.").max(80) })
      .parse(req.body);

    req.user.name = name;
    await req.user.save();
    // The name is carried in the token, so a stale one would keep showing the
    // old value in the header until it expired. Hand back a fresh one.
    res.json({ token: signToken(req.user), user: req.user.toJSON() });
  })
);

router.post(
  "/password",
  requireDb,
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "Use at least 8 characters."),
      })
      .parse(req.body);

    const user = await User.findById(req.user.id).select("+password");
    if (!(await user.checkPassword(body.currentPassword))) {
      throw httpError(400, "Your current password is wrong.");
    }
    user.password = body.newPassword;
    await user.save();
    res.json({ ok: true });
  })
);

export default router;
