import { Router } from "express";
import { z } from "zod";

import { Submission } from "../models/Submission.js";
import { Enrollment } from "../models/Enrollment.js";
import { Step } from "../models/Step.js";
import { User } from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { emitTo } from "../realtime.js";
import { aiStatus, testProvider } from "../lib/ai/index.js";
import { ESCALATION_LABELS } from "../lib/review.js";
import { completeStep } from "../lib/bootcamp.js";

export const adminReview = Router();
adminReview.use(requireDb, requireAuth, requireRole("admin", "editor"));

const withPeople = (query) =>
  query.populate("trainee", "name email").populate("step", "title kind brief milestone");

const shape = (row) => ({
  ...row.toJSON(),
  traineeInfo: row.trainee
    ? { id: row.trainee.id, name: row.trainee.name, email: row.trainee.email }
    : undefined,
  stepInfo: row.step ? { id: row.step.id, title: row.step.title, kind: row.step.kind } : undefined,
  escalationLabel: row.escalation ? ESCALATION_LABELS[row.escalation] : undefined,
});

/**
 * The queue. Blocked trainees first, then oldest — someone who cannot move is
 * more urgent than a spot check on work that already passed.
 */
adminReview.get(
  "/submissions",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.queue === "1") filter.needsHuman = true;
    if (req.query.escalation) filter.escalation = req.query.escalation;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.step) filter.step = req.query.step;
    if (req.query.track) filter.track = req.query.track;

    const rows = await withPeople(Submission.find(filter))
      .sort({ status: 1, createdAt: 1 })
      .limit(300);

    // "pending" sorts first alphabetically by luck; make the intent explicit.
    const weight = (r) => (r.status === "pending" ? 0 : r.escalation === "audit" ? 2 : 1);
    res.json(rows.map(shape).sort((a, b) => weight(a) - weight(b)));
  })
);

/** Counts for the dashboard, so you can see the shape of the backlog at once. */
adminReview.get(
  "/submissions/stats",
  asyncHandler(async (_req, res) => {
    const [byEscalation, total, blocking] = await Promise.all([
      Submission.aggregate([
        { $match: { needsHuman: true } },
        { $group: { _id: "$escalation", count: { $sum: 1 } } },
      ]),
      Submission.countDocuments({}),
      Submission.countDocuments({ needsHuman: true, status: "pending" }),
    ]);

    res.json({
      total,
      blocking,
      queue: byEscalation.map((row) => ({
        escalation: row._id,
        label: ESCALATION_LABELS[row._id] ?? row._id,
        count: row.count,
      })),
    });
  })
);

adminReview.get(
  "/submissions/:id",
  asyncHandler(async (req, res) => {
    const row = await withPeople(Submission.findById(req.params.id));
    if (!row) throw httpError(404, "Not found.");
    res.json(shape(row));
  })
);

/** Your verdict always wins — the reviewer is an assistant, not the authority. */
adminReview.patch(
  "/submissions/:id",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.enum(["pending", "passed", "changes-requested", "failed"]),
        note: z.string().trim().max(4000).optional(),
      })
      .parse(req.body);

    const submission = await Submission.findById(req.params.id);
    if (!submission) throw httpError(404, "Not found.");

    submission.status = body.status;
    submission.needsHuman = body.status === "pending";
    submission.mentor = {
      user: req.user._id,
      name: req.user.name,
      note: body.note,
      at: new Date(),
    };

    if (body.status === "passed") {
      const [step, enrollment, author] = await Promise.all([
        Step.findById(submission.step),
        Enrollment.findOne({ trainee: submission.trainee, track: submission.track }),
        User.findById(submission.trainee),
      ]);
      if (step && enrollment) await completeStep({ enrollment, step, user: author });
    }

    await submission.save();
    emitTo("cms", "submission:reviewed", {
      id: submission.id,
      by: req.user.name,
      status: submission.status,
    });
    // Only the author hears about their own verdict.
    emitTo(`trainee:${submission.trainee}`, "review:updated", {
      submission: submission.id,
      step: submission.step.toString(),
      status: submission.status,
      note: body.note,
      by: req.user.name,
    });
    res.json(shape(await withPeople(Submission.findById(submission.id))));
  })
);

/* ---------------------------- enrollments -------------------------- */

adminReview.get(
  "/enrollments",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.track) filter.track = req.query.track;
    if (req.query.status) filter.status = req.query.status;

    const rows = await Enrollment.find(filter)
      .sort({ lastActivityAt: -1 })
      .limit(500)
      .populate("trainee", "name email")
      .populate("track", "title slug");

    res.json(
      rows.map((row) => ({
        ...row.toJSON(),
        traineeInfo: row.trainee
          ? { id: row.trainee.id, name: row.trainee.name, email: row.trainee.email }
          : undefined,
        trackInfo: row.track
          ? { id: row.track.id, title: row.track.title, slug: row.track.slug }
          : undefined,
      }))
    );
  })
);

/* ------------------------------- ai -------------------------------- */

adminReview.get("/ai", (_req, res) => res.json(aiStatus()));

adminReview.post(
  "/ai/test",
  asyncHandler(async (_req, res) => {
    try {
      res.json({ ok: true, review: await testProvider() });
    } catch (err) {
      res.status(502).json({ ok: false, error: err.message });
    }
  })
);
