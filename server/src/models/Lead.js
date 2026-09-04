import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/** An enrolment request or a custom track request from the public site. */
const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    program: String,
    format: { type: String, default: "Not sure yet" },
    message: String,
    technologies: [String],
    estimatedWeeks: Number,
    source: { type: String, enum: ["enroll", "builder"], default: "enroll", index: true },
    status: { type: String, enum: ["new", "contacted", "enrolled", "closed"], default: "new", index: true },
    notes: String,
  },
  baseOptions
);

export const Lead = mongoose.model("Lead", leadSchema);
