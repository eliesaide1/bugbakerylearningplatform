import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

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
    ...orderedFields,
  },
  baseOptions
);

lessonSchema.index({ program: 1, slug: 1 }, { unique: true });

export const Lesson = mongoose.model("Lesson", lessonSchema);
