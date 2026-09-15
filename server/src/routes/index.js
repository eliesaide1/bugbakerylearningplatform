import { Router } from "express";
import slugify from "slugify";

import { crudRouter } from "../lib/crud.js";
import { normalizeRefs } from "../lib/refs.js";
import { Program } from "../models/Program.js";
import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Faq } from "../models/Faq.js";
import { Technology } from "../models/Technology.js";
import { Track } from "../models/Track.js";
import { Step } from "../models/Step.js";

import authRoutes from "./auth.routes.js";
import publicRoutes from "./public.routes.js";
import mediaRoutes from "./media.routes.js";
import settingsRoutes from "./settings.routes.js";
import themeRoutes from "./theme.routes.js";
import { publicLeads, adminLeads } from "./leads.routes.js";
import { publicBooking, adminBooking } from "./booking.routes.js";
import { publicBootcamp, traineeAuth, meRoutes } from "./bootcamp.routes.js";
import { adminReview } from "./reviewQueue.routes.js";
import { dbReady } from "../config/db.js";

const router = Router();

const slug = (value) => slugify(String(value || ""), { lower: true, strict: true });

/**
 * Fill the slug from the title when the editor leaves it blank, and accept
 * media refs in either shape — reads populate them, so writes get objects back.
 */
const autoSlug =
  (from, refs = []) =>
  (body) => {
    const next = normalizeRefs(body, refs);
    if (!next.slug && next[from]) next.slug = slug(next[from]);
    if (next.slug) next.slug = slug(next.slug);
    return next;
  };

router.get("/health", (_req, res) =>
  res.json({ ok: true, db: dbReady() ? "connected" : "disconnected", uptime: process.uptime() })
);

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/leads", publicLeads);
router.use("/public", publicBooking);
router.use("/public", publicBootcamp);
router.use("/trainee", traineeAuth);
router.use("/me", meRoutes);

router.use("/admin/settings", settingsRoutes);
router.use("/admin/theme", themeRoutes);
router.use("/admin/media", mediaRoutes);
router.use("/admin/leads", adminLeads);
router.use("/admin", adminBooking);

router.use(
  "/admin/sections",
  crudRouter({
    Model: Section,
    resource: "sections",
    populate: "media items.media",
    transform: autoSlug("title", ["media", "items[].media"]),
  })
);

router.use(
  "/admin/programs",
  crudRouter({
    Model: Program,
    resource: "programs",
    populate: "cover",
    transform: autoSlug("title", ["cover"]),
  })
);

router.use(
  "/admin/lessons",
  crudRouter({
    Model: Lesson,
    resource: "lessons",
    populate: "media thumbnail",
    filterable: ["program"],
    sort: { program: 1, order: 1 },
    transform: autoSlug("title", ["media", "thumbnail"]),
  })
);

router.use(
  "/admin/tracks",
  crudRouter({
    Model: Track,
    resource: "tracks",
    populate: "cover",
    transform: autoSlug("title", ["cover"]),
  })
);

router.use(
  "/admin/steps",
  crudRouter({
    Model: Step,
    resource: "steps",
    populate: "lesson",
    filterable: ["track", "kind"],
    sort: { track: 1, order: 1 },
    transform: autoSlug("title", ["lesson"]),
  })
);

router.use("/admin/faqs", crudRouter({ Model: Faq, resource: "faqs" }));

router.use(
  "/admin/technologies",
  crudRouter({ Model: Technology, resource: "technologies", filterable: ["group"] })
);

router.use("/admin", adminReview);

export default router;
