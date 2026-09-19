import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/**
 * A code that unlocks a program for whoever redeems it.
 *
 * Codes are the join between however you actually sell — a bank transfer, an
 * invoice, a conversation after the intro call — and access on the site. That
 * keeps payment out of the platform entirely, which is the right trade while
 * there is no card processing to reconcile against.
 *
 * A code is not a password: it is handed to a person, and they may pass it on.
 * `maxUses` is what makes that survivable — issue single-use codes for one
 * student, a larger batch for a cohort.
 */
const accessCodeSchema = new mongoose.Schema(
  {
    /** Stored upper-case so entry is forgiving. */
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    /** The program it opens. Null unlocks every program. */
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", default: null },
    /** For your own records: who this batch went to. */
    label: String,
    maxUses: { type: Number, default: 1, min: 1 },
    uses: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions
);

/** Why a code cannot be redeemed right now, or null if it can. */
accessCodeSchema.methods.problem = function problem() {
  if (!this.active) return "That code is no longer active.";
  if (this.expiresAt && this.expiresAt < new Date()) return "That code has expired.";
  if (this.uses >= this.maxUses) return "That code has already been used.";
  return null;
};

export const AccessCode = mongoose.model("AccessCode", accessCodeSchema);
