import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/** A booked 1:1 session. `start` is a real instant, never a wall-clock string. */
const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    program: String,
    note: String,

    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true },
    /** Recorded so a later timezone change does not rewrite history. */
    timezone: String,

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  baseOptions
);

/** One session per start time, unless it was cancelled. */
bookingSchema.index(
  { start: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

export const Booking = mongoose.model("Booking", bookingSchema);
