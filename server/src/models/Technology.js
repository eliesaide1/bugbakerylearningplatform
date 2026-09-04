import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

export const TECH_GROUPS = ["front", "back", "data", "mobile", "ai", "ops"];

/** One chip in the track builder. Weight drives the estimated length. */
const technologySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    group: { type: String, enum: TECH_GROUPS, default: "front", index: true },
    weight: { type: Number, default: 2, min: 1, max: 12 },
    ...orderedFields,
  },
  baseOptions
);

export const Technology = mongoose.model("Technology", technologySchema);
