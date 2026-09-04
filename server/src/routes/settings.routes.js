import { Router } from "express";
import { SiteSettings } from "../models/SiteSettings.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, requireDb } from "../middleware/error.js";
import { emitChange } from "../realtime.js";
import { normalizeRefs } from "../lib/refs.js";

const router = Router();
router.use(requireDb, requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await SiteSettings.getSingleton());
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    // Reads populate these, so accept them back as objects or as ids.
    const payload = normalizeRefs(req.body, ["logo", "ogImage", "heroMedia"]);
    delete payload.id;
    delete payload._id;
    delete payload.key;

    const doc = await SiteSettings.findOneAndUpdate({ key: "site" }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }).populate("logo ogImage heroMedia");

    emitChange("settings", "updated", doc);
    res.json(doc);
  })
);

export default router;
