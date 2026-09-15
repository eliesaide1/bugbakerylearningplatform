import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

/**
 * A bootcamp path: an ordered run of steps a trainee works through. A track is
 * the thing someone enrols in ("MERN stack"); the steps are what they actually
 * do day to day.
 */
const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    stack: String,
    summary: String,
    level: String,
    weeks: Number,
    outcomes: [String],
    /** Names matching the Technology list, so the card can show the chips. */
    technologies: [String],
    cover: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    /** The marketing program this track teaches, when there is one. */
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    /** "sequential" keeps each step locked until the one before it passes. */
    gate: { type: String, enum: ["sequential", "open"], default: "sequential" },

    /**
     * Deterrents against lifting the exercise into a chatbot and pasting the
     * answer back. These raise the effort; they cannot make it impossible, and
     * the attempt counts they produce are the more useful half — see
     * `integrity` on Submission.
     */
    protect: {
      blockCopy: { type: Boolean, default: true },
      blockPaste: { type: Boolean, default: true },
      deterScreenshots: { type: Boolean, default: true },
    },
    ...orderedFields,
  },
  baseOptions
);

trackSchema.virtual("steps", {
  ref: "Step",
  localField: "_id",
  foreignField: "track",
});

export const Track = mongoose.model("Track", trackSchema);
