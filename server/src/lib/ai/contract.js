/**
 * The one shape every provider must return. Written once here so the review
 * queue, the trainee UI and the escalation rules never branch on which model
 * happened to run.
 */
export const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["pass", "revise", "fail"],
      description:
        "pass = the work meets the acceptance criteria. revise = close, but something specific is wrong. fail = it does not address the task.",
    },
    confidence: {
      type: "number",
      description:
        "How sure you are of that verdict, 0 to 1. Be honest: use 0.5 or below when the submission is ambiguous, when you cannot see enough of the code to judge, or when the task is a matter of taste. Low confidence sends this to a human, which is the correct outcome for a genuinely unclear case.",
    },
    score: { type: "number", description: "0 to 100, how complete the work is." },
    summary: {
      type: "string",
      description:
        "Two or three sentences addressed to the trainee, in second person. Lead with what they got right, then the single most important thing to change.",
    },
    issues: {
      type: "array",
      description: "Concrete problems, most important first. Empty when the verdict is pass.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "One short line naming the problem." },
          detail: {
            type: "string",
            description: "Why it is wrong and what it causes. Do not paste the fixed code.",
          },
          severity: { type: "string", enum: ["blocker", "major", "minor"] },
        },
        required: ["title", "detail", "severity"],
        additionalProperties: false,
      },
    },
    hints: {
      type: "array",
      description:
        "Nudges that help the trainee find the answer themselves. Never the answer itself.",
      items: { type: "string" },
    },
  },
  required: ["verdict", "confidence", "score", "summary", "issues", "hints"],
  additionalProperties: false,
};

export const SYSTEM_PROMPT = `You are reviewing a trainee's work on a software bootcamp exercise.

You are a teacher, not a linter. Your job is to decide whether the work meets the
acceptance criteria and to write feedback that moves the trainee forward.

Rules:
- Judge only against the acceptance criteria and the rubric you are given. Do not
  invent extra requirements, and do not mark work down for style choices the task
  never asked about.
- Never write the corrected code. Hints point at where to look and what to
  reconsider; the trainee does the work.
- Address the trainee directly, as "you". Be warm and specific. No preamble.
- Deterministic checks have already run and their results are shown to you. Do not
  re-litigate a check that passed.
- Report your confidence honestly. If the submission is too short to judge, if the
  code is truncated, or if the task is genuinely a matter of taste, say so with a
  low confidence score. A human will pick it up, and that is the right outcome.`;

/** Coerce whatever a provider returned into a valid review, or throw. */
export function normaliseReview(raw, { provider, model }) {
  if (!raw || typeof raw !== "object") throw new Error("Reviewer returned no object.");

  const verdict = ["pass", "revise", "fail"].includes(raw.verdict) ? raw.verdict : "revise";
  const clamp = (n, lo, hi, fallback) =>
    typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;

  return {
    provider,
    model,
    verdict,
    // A model that returns 0-100 for a 0-1 field is a common slip; rescale it.
    confidence: clamp(raw.confidence > 1 ? raw.confidence / 100 : raw.confidence, 0, 1, 0.5),
    score: clamp(raw.score, 0, 100, verdict === "pass" ? 100 : 50),
    summary: String(raw.summary || "").trim() || "No summary was returned.",
    issues: (Array.isArray(raw.issues) ? raw.issues : [])
      .filter((i) => i && i.title)
      .slice(0, 12)
      .map((i) => ({
        title: String(i.title).slice(0, 300),
        detail: String(i.detail || "").slice(0, 2000),
        severity: ["blocker", "major", "minor"].includes(i.severity) ? i.severity : "major",
      })),
    hints: (Array.isArray(raw.hints) ? raw.hints : [])
      .filter(Boolean)
      .slice(0, 6)
      .map((h) => String(h).slice(0, 600)),
    at: new Date().toISOString(),
  };
}

/**
 * Providers without schema enforcement sometimes wrap the JSON in prose or a
 * fenced block. Pull the object out rather than failing the whole review.
 */
export function parseJson(text) {
  const trimmed = String(text ?? "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        /* fall through to the brace scan */
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Reviewer did not return JSON.");
  }
}
