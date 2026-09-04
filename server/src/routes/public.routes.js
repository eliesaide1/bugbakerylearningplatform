import { Router } from "express";
import { Program } from "../models/Program.js";
import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Faq } from "../models/Faq.js";
import { Technology } from "../models/Technology.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { Theme } from "../models/Theme.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { runtimeOf } from "../lib/duration.js";

const router = Router();
router.use(requireDb);

const visible = { visible: true };
const byOrder = { order: 1, createdAt: 1 };

/**
 * One request paints the whole landing page. The client refetches this on any
 * content:changed socket event, which is cheap and keeps the page consistent.
 */
router.get(
  "/site",
  asyncHandler(async (_req, res) => {
    const [settings, theme, sections, programs, faqs, technologies, allLessons] = await Promise.all([
      SiteSettings.getSingleton(),
      Theme.getSingleton(),
      Section.find(visible).sort(byOrder).populate("media items.media"),
      Program.find(visible).sort(byOrder).populate("cover"),
      Faq.find(visible).sort(byOrder),
      Technology.find(visible).sort(byOrder),
      Lesson.find(visible).sort(byOrder).populate("media thumbnail"),
    ]);

    // Group every visible lesson by program so the listing can report how many
    // videos and how long they run, and pick out the free preview.
    const byProgram = new Map();
    for (const lesson of allLessons) {
      const key = lesson.program.toString();
      if (!byProgram.has(key)) byProgram.set(key, []);
      byProgram.get(key).push(lesson);
    }

    res.json({
      settings,
      theme,
      sections,
      faqs,
      technologies,
      programs: programs.map((p) => {
        const lessons = byProgram.get(p.id) ?? [];
        return {
          ...p.toJSON(),
          preview: lessons.find((l) => l.isFree)?.toJSON() ?? null,
          lessonCount: lessons.length,
          freeCount: lessons.filter((l) => l.isFree).length,
          runtime: runtimeOf(lessons),
        };
      }),
      generatedAt: new Date().toISOString(),
    });
  })
);

router.get(
  "/programs/:slug",
  asyncHandler(async (req, res) => {
    const program = await Program.findOne({ slug: req.params.slug, ...visible }).populate("cover");
    if (!program) throw httpError(404, "That program does not exist.");

    const lessons = await Lesson.find({ program: program._id, ...visible })
      .sort(byOrder)
      .populate("media thumbnail");

    res.json({
      ...program.toJSON(),
      lessons: lessons.map((l) => (l.isFree ? l.toJSON() : stripLocked(l.toJSON()))),
    });
  })
);

/** Free lessons are watchable without an account; the rest expose metadata only. */
router.get(
  "/lessons/:programSlug/:lessonSlug",
  asyncHandler(async (req, res) => {
    const program = await Program.findOne({ slug: req.params.programSlug, ...visible });
    if (!program) throw httpError(404, "That program does not exist.");

    const lesson = await Lesson.findOne({
      program: program._id,
      slug: req.params.lessonSlug,
      ...visible,
    }).populate("media thumbnail");
    if (!lesson) throw httpError(404, "That lesson does not exist.");
    if (!lesson.isFree) throw httpError(403, "This lesson is part of the paid program.");

    res.json({ ...lesson.toJSON(), program: { id: program.id, title: program.title, slug: program.slug } });
  })
);

function stripLocked(lesson) {
  return { ...lesson, videoUrl: null, media: null, locked: true };
}

export default router;
