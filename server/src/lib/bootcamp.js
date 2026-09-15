import { Step } from "../models/Step.js";
import { emitTo } from "../realtime.js";

/**
 * Answer keys never leave the server. The trainee sees the broken code, the
 * symptom and the hints; the root cause, the expected quiz answers and the
 * deterministic checks stay here and go only to the reviewer.
 */
export function sanitiseStep(step) {
  const json = step.toJSON ? step.toJSON() : { ...step };
  delete json.rubric;
  delete json.checks;

  if (json.bug) {
    const { rootCause, ...rest } = json.bug;
    json.bug = rest;
  }
  if (Array.isArray(json.quiz)) {
    json.quiz = json.quiz.map(({ expected, ...rest }) => rest);
  }
  return json;
}

/**
 * Which steps a trainee may open. A sequential track shows everything done so
 * far plus the one they are on — enough to see the shape of the road without
 * letting them skip ahead of the work.
 */
export function unlockedStepIds(track, steps, enrollment) {
  const ids = steps.map((s) => s.id);
  if (!enrollment) return ids.slice(0, 1);
  if (track.gate === "open") return ids;

  const done = new Set((enrollment.completed ?? []).map(String));
  const next = ids.findIndex((id) => !done.has(id));
  return next === -1 ? ids : ids.slice(0, next + 1);
}

export const stepsOf = (trackId) =>
  Step.find({ track: trackId, visible: true }).sort({ order: 1, createdAt: 1 });

/** Totals the track cards show without loading every step. */
export function trackTotals(steps) {
  return {
    stepCount: steps.length,
    totalMinutes: steps.reduce((sum, s) => sum + (s.estimateMinutes || 0), 0),
  };
}

/**
 * Mark a step done and move the trainee on. Shared by every path that can
 * finish one: the trainee's own button, a passing review, enough peer
 * agreement, or your override in the queue.
 */
export async function completeStep({ enrollment, step, user }) {
  const already = (enrollment.completed ?? []).some((id) => id.toString() === step.id);
  if (!already) {
    enrollment.completed.push(step._id);
    enrollment.points += step.points ?? 0;
  }
  enrollment.lastActivityAt = new Date();

  const total = await Step.countDocuments({ track: step.track, visible: true });
  if (enrollment.completed.length >= total) {
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
    emitTo("cms", "track:completed", {
      trainee: user ? { id: user.id, name: user.name } : null,
      track: step.track.toString(),
    });
  }

  await enrollment.save();
  return enrollment;
}
