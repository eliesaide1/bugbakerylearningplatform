import { Router } from "express";
import { Theme } from "../models/Theme.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, requireDb } from "../middleware/error.js";
import { emitChange } from "../realtime.js";

const router = Router();
router.use(requireDb, requireAuth);

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
