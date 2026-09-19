import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

/**
 * One rule checked against what the learner typed. Same three kinds the
 * bootcamp uses, so an exercise written here reads the same as a step.
 */
const checkSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["contains", "not-contains", "regex"], default: "contains" },
    value: { type: String, required: true },
    /** Written as the thing to do, not the thing that failed. */
    message: String,
    caseSensitive: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * The hands-on that follows the video: a short brief, something to type into,
 * and rules that answer instantly.
 *
 * Instant is the point. Flexbox Froggy works because the board re-renders as
 * you type — the loop is tight enough to experiment in. So these are checked
 * in the browser, with no request and no grading: nothing here is assessed,
 * it is somewhere to try the thing you just watched.
 */
/** A statement to judge. For lessons where there is nothing to build. */
const questionSchema = new mongoose.Schema(
  {
    statement: { type: String, required: true },
    answer: { type: Boolean, required: true },
    /** Shown once they have answered — the reason matters more than the mark. */
    because: String,
  },
  { _id: false }
);

const practiceSchema = new mongoose.Schema(
  {
    brief: String,
    /** What the code should produce when it runs. Shown beside the editor. */
    expect: String,
    /** Seeded into the editor, usually with the interesting line missing. */
    starter: String,
    language: { type: String, default: "javascript" },
    /** Opened one at a time, so the struggle comes before the answer. */
    hints: [String],
    solution: String,
    checks: [checkSchema],
    /** Used instead of checks when the lesson has nothing to build. */
    questions: [questionSchema],
  },
  { _id: false }
);

/**
 * A video lesson. `source` decides where it plays from: a file uploaded through
 * the CMS, or an external host. Marking one `isFree` publishes it as the
 * program's open preview on the public site.
 */
const lessonSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: String,

    source: { type: String, enum: ["upload", "youtube", "vimeo", "url"], default: "upload" },
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    videoUrl: String,
    thumbnail: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    duration: String,
    /** Which of the program's modules this lesson belongs to. */
    module: { type: Number, default: null },

    isFree: { type: Boolean, default: false, index: true },
    /** A diagram shown with the lesson text. */
    diagram: String,
    /** Optional hands-on shown under the lesson. */
    practice: practiceSchema,
    ...orderedFields,
  },
  baseOptions
);

lessonSchema.index({ program: 1, slug: 1 }, { unique: true });

export const Lesson = mongoose.model("Lesson", lessonSchema);
