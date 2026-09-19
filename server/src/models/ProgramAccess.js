import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/**
 * One person's access to one program. Separate from Enrollment, which is the
 * bootcamp's per-track progress record: this only answers "may they open it".
 */
const programAccessSchema = new mongoose.Schema(
  {
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    /** How it was granted, so a wrongly-issued batch can be traced back. */
    source: { type: String, enum: ["code", "granted"], default: "code" },
    code: { type: String, uppercase: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions
);

programAccessSchema.index({ trainee: 1, program: 1 }, { unique: true });

export const ProgramAccess = mongoose.model("ProgramAccess", programAccessSchema);
