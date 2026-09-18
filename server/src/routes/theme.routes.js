import { Router } from "express";
import { Theme } from "../models/Theme.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, requireDb } from "../middleware/error.js";
import { emitChange } from "../realtime.js";

const router = Router();
// Content is staff-only. Trainees hold a valid token too, so checking
// that one exists is not enough: without the role check, anyone who
// signed up could read the bug answer keys and rewrite the site.
router.use(requireDb, requireAuth, requireRole("admin", "editor"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await Theme.getSingleton());
  })
);

/** A colour change here repaints every open tab over the socket. */
router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    delete payload.id;
    delete payload._id;
    delete payload.key;

    const doc = await Theme.findOneAndUpdate({ key: "theme" }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    emitChange("theme", "updated", doc);
    res.json(doc);
  })
);

/** Drop back to the shipped palette. */
router.post(
  "/reset",
  asyncHandler(async (_req, res) => {
    await Theme.deleteOne({ key: "theme" });
    const doc = await Theme.create({ key: "theme" });
    emitChange("theme", "updated", doc);
    res.json(doc);
  })
);

export default router;
