import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import { Track } from "../models/Track.js";
import { Step } from "../models/Step.js";
import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { emitTo } from "../realtime.js";
import { reviewSubmission, aiEnabled } from "../lib/ai/index.js";
import { runChecks, decide, applyIntegrity, settleWithPeers } from "../lib/review.js";
import {
  sanitiseStep,
  unlockedStepIds,
  stepsOf,
  trackTotals,
  completeStep,
} from "../lib/bootcamp.js";

export const publicBootcamp = Router();
export const traineeAuth = Router();
export const meRoutes = Router();

const visible = { visible: true };

/* ------------------------------ public ----------------------------- */

publicBootcamp.use(requireDb);

publicBootcamp.get(
  "/tracks",
  asyncHandler(async (_req, res) => {
    const tracks = await Track.find(visible).sort({ order: 1, createdAt: 1 }).populate("cover");
    const steps = await Step.find(visible).select("track estimateMinutes");

    const byTrack = new Map();
    for (const step of steps) {
      const key = step.track.toString();
      byTrack.set(key, [...(byTrack.get(key) ?? []), step]);
    }

    res.json(
      tracks.map((track) => ({ ...track.toJSON(), ...trackTotals(byTrack.get(track.id) ?? []) }))
    );
  })
);

publicBootcamp.get(
  "/tracks/:slug",
  asyncHandler(async (req, res) => {
    const track = await Track.findOne({ slug: req.params.slug, ...visible }).populate("cover");
    if (!track) throw httpError(404, "That track does not exist.");

    const steps = await stepsOf(track._id).populate("lesson");
    res.json({
      ...track.toJSON(),
      ...trackTotals(steps),
      steps: steps.map(sanitiseStep),
    });
  })
);

/* --------------------------- trainee accounts ---------------------- */

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-ups from here. Try again in a while." },
});

traineeAuth.post(
  "/register",
  requireDb,
  registerLimiter,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().trim().min(2, "Tell us your name."),
        email: z.string().trim().email("Enter a valid email address."),
        password: z.string().min(8, "Use at least 8 characters."),
      })
      .parse(req.body);

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) throw httpError(409, "An account with that email already exists. Sign in instead.");

    const user = await User.create({ ...body, role: "trainee" });
    res.status(201).json({ token: signToken(user), user: user.toJSON() });
  })
);

/* ------------------------------ trainee ---------------------------- */

meRoutes.use(requireDb, requireAuth);

const loadTrack = async (slug) => {
  const track = await Track.findOne({ slug, ...visible }).populate("cover");
  if (!track) throw httpError(404, "That track does not exist.");
  return track;
};

meRoutes.get(
  "/enrollments",
  asyncHandler(async (req, res) => {
    const rows = await Enrollment.find({ trainee: req.user._id })
      .sort({ lastActivityAt: -1 })
      .populate("track", "title slug summary stack");

    res.json(
      rows.map((row) => ({
        ...row.toJSON(),
        trackInfo: row.track
          ? { id: row.track.id, title: row.track.title, slug: row.track.slug }
          : undefined,
      }))
    );
  })
);

meRoutes.post(
  "/enrollments",
  asyncHandler(async (req, res) => {
    const { slug } = z.object({ slug: z.string().trim().min(1) }).parse(req.body);
    const track = await loadTrack(slug);

    const enrollment = await Enrollment.findOneAndUpdate(
      { trainee: req.user._id, track: track._id },
      { $setOnInsert: { startedAt: new Date() }, $set: { lastActivityAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    emitTo("cms", "enrollment:new", {
      id: enrollment.id,
      track: track.title,
      trainee: { id: req.user.id, name: req.user.name, email: req.user.email },
    });

    res.status(201).json(enrollment.toJSON());
  })
);

/** Everything the workspace needs for one track, in a single request. */
meRoutes.get(
  "/tracks/:slug",
  asyncHandler(async (req, res) => {
    const track = await loadTrack(req.params.slug);
    const steps = await stepsOf(track._id).populate("lesson");
    const enrollment = await Enrollment.findOne({ trainee: req.user._id, track: track._id });

    // The newest attempt per step is what the workspace shows.
    const submissions = await Submission.find({ trainee: req.user._id, track: track._id }).sort({
      createdAt: 1,
    });
    const latest = {};
    for (const submission of submissions) latest[submission.step.toString()] = submission.toJSON();

    res.json({
      track: { ...track.toJSON(), ...trackTotals(steps) },
      steps: steps.map(sanitiseStep),
      enrollment: enrollment?.toJSON() ?? null,
      submissions: latest,
      unlocked: unlockedStepIds(track, steps, enrollment),
    });
  })
);

const requireEnrollment = async (userId, trackId) => {
  const enrollment = await Enrollment.findOne({ trainee: userId, track: trackId });
  if (!enrollment) throw httpError(403, "Join this track before starting its steps.");
  return enrollment;
};

const assertUnlocked = async (track, step, enrollment) => {
  const steps = await stepsOf(track._id).select("_id");
  const unlocked = unlockedStepIds(track, steps, enrollment);
  if (!unlocked.includes(step.id)) throw httpError(403, "Finish the earlier steps first.");
};

/** Steps that are watched or read finish with a button, not a submission. */
meRoutes.post(
  "/steps/:id/complete",
  asyncHandler(async (req, res) => {
    const step = await Step.findById(req.params.id);
    if (!step || !step.visible) throw httpError(404, "That step does not exist.");
    if (step.requiresSubmission) throw httpError(400, "This step needs a submission.");

    const track = await Track.findById(step.track);
    const enrollment = await requireEnrollment(req.user._id, track._id);
    await assertUnlocked(track, step, enrollment);

    const updated = await completeStep({ enrollment, step, user: req.user });
    res.json(updated.toJSON());
  })
);

const submissionSchema = z.object({
  code: z.string().max(200_000).optional(),
  notes: z.string().max(20_000).optional(),
  repoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  commitUrl: z.string().trim().max(500).optional().or(z.literal("")),
  answers: z.array(z.string().max(5_000)).max(50).optional(),
  /** The trainee can always pull a person in, whatever the reviewer says. */
  requestHuman: z.boolean().optional(),
  /** What the browser saw while the answer was written. Advisory, not trusted. */
  integrity: z
    .object({
      pasteAttempts: z.number().int().min(0).max(10_000).optional(),
      pastedCharacters: z.number().int().min(0).max(1_000_000).optional(),
      copyAttempts: z.number().int().min(0).max(10_000).optional(),
      awayEvents: z.number().int().min(0).max(10_000).optional(),
      typedCharacters: z.number().int().min(0).max(1_000_000).optional(),
      durationMs: z.number().int().min(0).max(86_400_000).optional(),
    })
    .optional(),
});

meRoutes.post(
  "/steps/:id/submit",
  asyncHandler(async (req, res) => {
    const body = submissionSchema.parse(req.body);
    const step = await Step.findById(req.params.id);
    if (!step || !step.visible) throw httpError(404, "That step does not exist.");

    const track = await Track.findById(step.track);
    const enrollment = await requireEnrollment(req.user._id, track._id);
    await assertUnlocked(track, step, enrollment);

    const payload = {
      code: body.code,
      notes: body.notes,
      repoUrl: body.repoUrl,
      commitUrl: body.commitUrl,
      answers: body.answers ?? [],
    };

    if (step.kind === "push" && step.push?.requireRepoUrl && !payload.repoUrl) {
      throw httpError(400, "Paste the repository url so it can be reviewed.");
    }

    const attempt = (await Submission.countDocuments({ trainee: req.user._id, step: step._id })) + 1;

    // Rung one runs here, in front of the trainee: deterministic checks are
    // instant, so they never wait to be told they forgot express.json().
    const checkResults = runChecks(step, payload);
    const allPassed = checkResults.every((c) => c.passed);
    const willReview = allPassed && aiEnabled();

    const submission = await Submission.create({
      trainee: req.user._id,
      track: track._id,
      step: step._id,
      attempt,
      payload,
      checks: checkResults,
      integrity: body.integrity ?? {},
      humanRequested: Boolean(body.requestHuman),
      reviewState: willReview ? "reviewing" : "skipped",
      status: "pending",
    });

    // Nothing to ask a model — settle it now and answer with the verdict.
    if (!willReview) {
      const outcome = applyIntegrity(
        decide({
          step,
          checkResults,
          review: null,
          attempt,
          humanRequested: body.requestHuman,
        }),
        body.integrity
      );
      await settle({ submission, outcome, step, enrollment, user: req.user });
      return res.status(201).json({
        submission: submission.toJSON(),
        enrollment: enrollment.toJSON(),
      });
    }

    // Otherwise answer immediately and let the reviewer catch up. The trainee
    // watches for it on their own socket; the wait is capped at a minute.
    enrollment.lastActivityAt = new Date();
    await enrollment.save();

    void runReview({ submissionId: submission.id, step, attempt, payload, checkResults, user: req.user });

    res.status(201).json({ submission: submission.toJSON(), enrollment: enrollment.toJSON() });
  })
);

/** Write the outcome onto a submission, and move the trainee if it passed. */
async function settle({ submission, outcome, step, enrollment, user }) {
  submission.status = outcome.status;
  submission.needsHuman = outcome.needsHuman;
  submission.escalation = outcome.escalation;
  await submission.save();

  if (outcome.status === "passed") {
    await completeStep({ enrollment, step, user });
  } else {
    enrollment.lastActivityAt = new Date();
    await enrollment.save();
  }

  if (outcome.needsHuman) {
    emitTo("cms", "submission:new", {
      id: submission.id,
      escalation: outcome.escalation,
      step: step.title,
      trainee: { id: user.id, name: user.name },
    });
  }
}

/**
 * The automatic review, run after the response has gone out. It never throws:
 * reviewSubmission already turns a provider failure into a review carrying the
 * error, and the ladder routes that to a person.
 */
async function runReview({ submissionId, step, attempt, payload, checkResults, user }) {
  try {
    const review = await reviewSubmission({ step, submission: payload, checkResults, attempt });

    const submission = await Submission.findById(submissionId);
    if (!submission) return;

    const outcome = applyIntegrity(
      decide({
        step,
        checkResults,
        review,
        attempt,
        humanRequested: submission.humanRequested,
      }),
      submission.integrity
    );

    submission.review = review;
    submission.reviewState = review?.error ? "timeout" : "done";

    const enrollment = await Enrollment.findOne({ trainee: submission.trainee, track: step.track });
    if (enrollment) await settle({ submission, outcome, step, enrollment, user });
    else await submission.save();

    // Only the author hears their own verdict.
    emitTo(`trainee:${submission.trainee}`, "review:updated", {
      submission: submission.id,
      step: step.id,
      status: submission.status,
    });
  } catch (err) {
    console.error("[review] background pass failed:", err.message);
    await Submission.findByIdAndUpdate(submissionId, {
      reviewState: "timeout",
      needsHuman: true,
      escalation: "low-confidence",
    });
  }
}

/**
 * A restart mid-review would otherwise leave a submission waiting forever.
 * Anything still "reviewing" when the process comes up is past its minute, so
 * it goes to a person.
 */
export async function recoverStuckReviews() {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  const result = await Submission.updateMany(
    { reviewState: "reviewing", createdAt: { $lt: cutoff } },
    { $set: { reviewState: "timeout", needsHuman: true, escalation: "low-confidence" } }
  );
  if (result.modifiedCount) {
    console.log(`[review] ${result.modifiedCount} interrupted review(s) sent to the queue`);
  }
  return result.modifiedCount;
}

/* ---------------------------- peer review -------------------------- */

/**
 * Rung 4. You can only review a step you have already passed, and never your
 * own work — which makes the queue self-serve as the cohort moves through.
 */
meRoutes.get(
  "/peer-queue",
  asyncHandler(async (req, res) => {
    const mine = await Enrollment.find({ trainee: req.user._id }).select("completed");
    const passed = mine.flatMap((e) => e.completed);
    if (!passed.length) return res.json([]);

    const eligible = await Step.find({ _id: { $in: passed }, peerReviewable: true }).select("_id");
    const rows = await Submission.find({
      step: { $in: eligible.map((s) => s._id) },
      trainee: { $ne: req.user._id },
      status: "pending",
      needsHuman: true,
      "peerReviews.reviewer": { $ne: req.user._id },
    })
      .sort({ createdAt: 1 })
      .limit(20)
      .populate("step", "title kind brief")
      .populate("trainee", "name");

    res.json(
      rows.map((row) => ({
        ...row.toJSON(),
        // Reviewing is anonymous in one direction: you judge the work, not the person.
        traineeInfo: undefined,
        trainee: undefined,
        stepInfo: row.step ? { id: row.step.id, title: row.step.title, kind: row.step.kind } : undefined,
      }))
    );
  })
);

meRoutes.post(
  "/peer-reviews/:submissionId",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        verdict: z.enum(["pass", "revise"]),
        note: z.string().trim().min(20, "Say something the author can act on — 20 characters or more."),
      })
      .parse(req.body);

    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) throw httpError(404, "That submission does not exist.");
    if (submission.trainee.equals(req.user._id)) throw httpError(403, "You cannot review your own work.");
    if (submission.peerReviews.some((r) => r.reviewer.equals(req.user._id))) {
      throw httpError(409, "You have already reviewed this one.");
    }

    const enrolled = await Enrollment.findOne({
      trainee: req.user._id,
      completed: submission.step,
    });
    if (!enrolled) throw httpError(403, "You can only review a step you have passed yourself.");

    submission.peerReviews.push({
      reviewer: req.user._id,
      reviewerName: req.user.name,
      verdict: body.verdict,
      note: body.note,
    });

    const settled = settleWithPeers(submission);
    if (settled) {
      submission.status = settled.status;
      submission.needsHuman = settled.needsHuman;
      submission.escalation = settled.escalation;

      if (settled.status === "passed") {
        const step = await Step.findById(submission.step);
        const author = await User.findById(submission.trainee);
        const enrollment = await Enrollment.findOne({
          trainee: submission.trainee,
          track: submission.track,
        });
        if (enrollment && step) await completeStep({ enrollment, step, user: author });
      }
    }

    await submission.save();
    emitTo("cms", "submission:reviewed", { id: submission.id, by: "peer", status: submission.status });
    emitTo(`trainee:${submission.trainee}`, "review:updated", {
      submission: submission.id,
      step: submission.step.toString(),
      status: submission.status,
      by: "a peer",
    });
    res.json({ ok: true, status: submission.status });
  })
);
