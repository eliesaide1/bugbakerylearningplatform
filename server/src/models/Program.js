import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

/**
 * A block of the curriculum. Programs render as a numbered sequence of these,
 * which is what turns a flat list of bullet points into a syllabus you can see
 * the shape of.
 */
const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: String,
    duration: String,
    topics: [String],
  },
  { _id: true }
);

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    stack: String,
    summary: String,
    /** Shown on the course card, the way a marketplace credits a teacher. */
    instructor: String,
    /** Coloured label on the card, e.g. "Most popular". Free text. */
    badge: String,
    /** Written as you want it read, currency included: "$149", "6,000,000 LBP". */
    price: String,
    /** Struck through beside the price when set. */
    originalPrice: String,
    outcomes: [String],
    modules: [moduleSchema],

    level: String,
    length: String,
    prerequisite: String,
    finishWith: String,

    cover: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    ...orderedFields,
  },
  baseOptions
);

programSchema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "program",
});

export const Program = mongoose.model("Program", programSchema);
