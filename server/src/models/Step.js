import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

/**
 * One deterministic rule run against a submission before any AI sees it. The
 * hard requirements of a step belong here rather than in the rubric: these are
 * instant, free, and they cannot hallucinate.
 */
const checkSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["contains", "not-contains", "regex"], default: "contains" },
    value: { type: String, required: true },
    message: String,
    caseSensitive: { type: Boolean, default: false },
    field: { type: String, enum: ["code", "notes", "repoUrl", "commitUrl", "any"], default: "any" },
  },
  { _id: true }
);

/** The planted defect a "bug" step hands over. `rootCause` is the answer key. */
const bugSchema = new mongoose.Schema(
  {
    language: { type: String, default: "javascript" },
    filename: String,
    code: String,
    symptom: String,
    stackTrace: String,
    hints: [String],
    /** Stripped from every public response — see sanitiseStep(). */
    rootCause: String,
    acceptance: [String],
  },
  { _id: false }
);

const pushSchema = new mongoose.Schema(
  {
    branch: String,
    commitMessage: String,
    requireRepoUrl: { type: Boolean, default: true },
    requireCommitUrl: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  { prompt: { type: String, required: true }, expected: String },
  { _id: true }
);

const stepSchema = new mongoose.Schema(
  {
    track: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    kind: {
      type: String,
      enum: ["watch", "read", "task", "bug", "push", "quiz"],
      default: "task",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    summary: String,
    brief: String,
    estimateMinutes: Number,
    points: { type: Number, default: 10 },
    /** Which week of the track this belongs to. 1-based; 0 means unscheduled. */
    week: { type: Number, default: 1, index: true },

    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    videoUrl: String,

    deliverables: [String],
    starterRepo: String,

    bug: bugSchema,
    push: pushSchema,
    quiz: [questionSchema],

    checks: [checkSchema],
    rubric: String,
    requiresSubmission: { type: Boolean, default: true },

    /**
     * A milestone always goes to a human, whatever the checks and the reviewer
     * said. Gate one step in six rather than all six — this is the dial that
     * decides how much lands in the review queue.
     */
    milestone: { type: Boolean, default: false },
    /** Trainees who passed this step may review other people's attempts at it. */
    peerReviewable: { type: Boolean, default: true },
    ...orderedFields,
  },
  baseOptions
);

stepSchema.index({ track: 1, slug: 1 }, { unique: true });

export const Step = mongoose.model("Step", stepSchema);
