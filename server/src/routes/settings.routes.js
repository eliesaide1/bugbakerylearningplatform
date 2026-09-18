import { Router } from "express";
import { SiteSettings } from "../models/SiteSettings.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, requireDb } from "../middleware/error.js";
import { emitChange } from "../realtime.js";
import { normalizeRefs } from "../lib/refs.js";

const router = Router();
// Content is staff-only. Trainees hold a valid token too, so checking
// that one exists is not enough: without the role check, anyone who
// signed up could read the bug answer keys and rewrite the site.
router.use(requireDb, requireAuth, requireRole("admin", "editor"));

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
