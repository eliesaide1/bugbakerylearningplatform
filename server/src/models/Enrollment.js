import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/** One trainee's run at one track. */
const enrollmentSchema = new mongoose.Schema(
  {
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    track: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    status: { type: String, enum: ["active", "completed", "paused"], default: "active", index: true },
    /** Step ids already passed. Ordering comes from the steps themselves. */
    completed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Step" }],
    points: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    lastActivityAt: { type: Date, default: Date.now },
  },
  baseOptions
);

enrollmentSchema.index({ trainee: 1, track: 1 }, { unique: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
