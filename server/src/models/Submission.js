import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

const checkResultSchema = new mongoose.Schema(
  {
    kind: String,
    value: String,
    passed: Boolean,
    message: String,
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    title: String,
    detail: String,
    severity: { type: String, enum: ["blocker", "major", "minor"], default: "major" },
  },
  { _id: false }
);

/** Normalised across every provider, so the UI never branches on which ran. */
const reviewSchema = new mongoose.Schema(
  {
    provider: String,
    model: String,
    verdict: { type: String, enum: ["pass", "revise", "fail"] },
    score: Number,
    /**
     * How sure the reviewer is, 0–1. Low confidence is the main reason a
     * submission gets routed to a person: the ambiguous middle is exactly
     * where a human adds something the model does not.
     */
    confidence: Number,
    summary: String,
    issues: [issueSchema],
    hints: [String],
    /** Set when the provider was unreachable. The submission still saves. */
    error: String,
    at: Date,
  },
  { _id: false }
);

/** One trainee reviewing another's attempt at a step they have already passed. */
const peerReviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerName: String,
    verdict: { type: String, enum: ["pass", "revise"], required: true },
    note: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const submissionSchema = new mongoose.Schema(
  {
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    track: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    step: { type: mongoose.Schema.Types.ObjectId, ref: "Step", required: true, index: true },
    /** 1 for the first go at this step, 2 for the next, and so on. */
    attempt: { type: Number, default: 1 },

    payload: {
      code: String,
      notes: String,
      repoUrl: String,
      commitUrl: String,
      answers: [String],
    },

    checks: [checkResultSchema],
    review: reviewSchema,
    peerReviews: [peerReviewSchema],

    /**
     * The automatic review runs after the response is sent, so the trainee gets
     * their deterministic checks instantly and the written feedback a moment
     * later. "reviewing" is what the workspace waits on.
     */
    reviewState: {
      type: String,
      enum: ["skipped", "reviewing", "done", "timeout"],
      default: "skipped",
      index: true,
    },

    /**
     * What the browser observed while the answer was being written. Blocking a
     * paste is a speed bump anyone can step over; counting the attempts is the
     * part that survives, because it is evidence you can act on.
     */
    integrity: {
      pasteAttempts: { type: Number, default: 0 },
      pastedCharacters: { type: Number, default: 0 },
      copyAttempts: { type: Number, default: 0 },
      /** Times the trainee left the tab while writing this answer. */
      awayEvents: { type: Number, default: 0 },
      /** Keystrokes counted in the answer fields. */
      typedCharacters: { type: Number, default: 0 },
      /** Milliseconds between opening the step and submitting. */
      durationMs: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["pending", "passed", "changes-requested", "failed"],
      default: "pending",
      index: true,
    },

    /**
     * The escalation ladder's output. `needsHuman` is what the review queue
     * filters on; `escalation` says which rule put it there, so the queue can
     * be triaged rather than worked front to back.
     */
    needsHuman: { type: Boolean, default: false, index: true },
    escalation: {
      type: String,
      enum: [
        "low-confidence",
        "repeat-failure",
        "milestone",
        "requested",
        "audit",
        "peer-split",
        "integrity",
      ],
    },
    /** The trainee ticked "I'd like a person to look at this". */
    humanRequested: { type: Boolean, default: false },

    mentor: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      note: String,
      at: Date,
    },
  },
  baseOptions
);

submissionSchema.index({ trainee: 1, step: 1, attempt: -1 });
submissionSchema.index({ needsHuman: 1, createdAt: 1 });

export const Submission = mongoose.model("Submission", submissionSchema);
