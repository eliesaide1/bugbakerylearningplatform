import { env } from "../config/env.js";

/**
 * Rung 1 of the ladder: deterministic checks. These run before any model sees
 * the work — instant, free, and incapable of hallucinating, which is why the
 * hard requirements of a step belong here and not in the rubric.
 */
export function runChecks(step, payload = {}) {
  const fields = {
    code: payload.code ?? "",
    notes: payload.notes ?? "",
    repoUrl: payload.repoUrl ?? "",
    commitUrl: payload.commitUrl ?? "",
  };
  fields.any = Object.values(fields).join("\n");

  return (step.checks ?? []).map((check) => {
    const haystack = fields[check.field ?? "any"] ?? fields.any;
    let passed = false;

    try {
      if (check.kind === "regex") {
        passed = new RegExp(check.value, check.caseSensitive ? "" : "i").test(haystack);
      } else {
        const hay = check.caseSensitive ? haystack : haystack.toLowerCase();
        const needle = check.caseSensitive ? check.value : check.value.toLowerCase();
        const found = hay.includes(needle);
        passed = check.kind === "not-contains" ? !found : found;
      }
    } catch {
      // A malformed regex is an authoring mistake, not the trainee's fault:
      // pass the check and let the reviewer judge instead of failing them.
      passed = true;
    }

    return {
      kind: check.kind,
      value: check.value,
      passed,
      message: check.message || defaultCheckMessage(check),
    };
  });
}

function defaultCheckMessage(check) {
  const what = `"${check.value}"`;
  if (check.kind === "not-contains") return `Your submission should not contain ${what}.`;
  if (check.kind === "regex") return `Your submission should match ${what}.`;
  return `Your submission should contain ${what}.`;
}

/**
 * Rung 3 of the ladder: routing. Decides the submission's status and, more
 * importantly, whether a person needs to look at it. Only five things put work
 * in front of a human, and each one is a case where a human genuinely adds
 * something a model does not.
 */
export function decide({ step, checkResults, review, attempt, humanRequested, integrity }) {
  const failedChecks = checkResults.filter((c) => !c.passed);
  const repeat = attempt >= env.review.repeatFailures + 1;

  // Asked for, or a step you deliberately chose to gate. Both are decisions
  // already made, so they short-circuit everything else.
  if (humanRequested) return route("pending", "requested");
  if (step.milestone) return route("pending", "milestone");

  // Deterministic failure: the trainee can see exactly what to fix, so this is
  // not worth anyone's time — until they have been round the loop enough that
  // the feedback clearly is not landing.
  if (failedChecks.length) {
    return repeat ? route("changes-requested", "repeat-failure") : route("changes-requested");
  }

  // No reviewer configured at all. The checks have passed, so the only thing
  // left to judge is whatever the rubric describes — a step without one has
  // nothing subjective in it and can settle on the checks alone.
  if (!review) return step.rubric ? route("pending", "low-confidence") : route("passed");

  // The reviewer fell over. Fall back to a person rather than guessing, and
  // never make the trainee resubmit because of our outage.
  if (review.error) return route("pending", "low-confidence");

  if (review.confidence < env.review.confidenceFloor) return route("pending", "low-confidence");

  if (review.verdict === "pass") {
    // Passing is not the end of the story: a small sample is spot-checked so
    // model drift shows up here rather than in a graduate's first job.
    const audited = Math.random() < env.review.auditRate;
    return audited ? route("passed", "audit") : route("passed");
  }

  const status = review.verdict === "fail" ? "failed" : "changes-requested";
  return repeat ? route(status, "repeat-failure") : route(status);
}

/**
 * A separate gate, applied after the verdict. Work that looks pasted is not
 * marked wrong — that would be unjust, and the signal is circumstantial — but
 * it never passes on its own either. A person decides.
 */
export function applyIntegrity(outcome, integrity) {
  if (!integrity || !suspicious(integrity)) return outcome;
  if (outcome.needsHuman && outcome.escalation !== "audit") return outcome;

  return {
    // A suspicious pass must not advance the trainee before it is looked at.
    status: outcome.status === "passed" ? "pending" : outcome.status,
    needsHuman: true,
    blocking: true,
    escalation: "integrity",
  };
}

function suspicious(integrity) {
  if ((integrity.pasteAttempts ?? 0) >= env.review.pasteAttempts) return true;
  if ((integrity.pastedCharacters ?? 0) >= env.review.pastedCharacters) return true;

  // An answer that arrived far faster than it could have been typed is worth a
  // second look. Only applied once there is enough of an answer to judge.
  const typed = integrity.typedCharacters ?? 0;
  const seconds = (integrity.durationMs ?? 0) / 1000;
  return typed > 400 && seconds > 0 && typed / seconds > 25;
}

const route = (status, escalation) => ({
  status,
  needsHuman: Boolean(escalation),
  // An audited pass is already through — the review is quality control on the
  // reviewer, and must never sit between the trainee and their next step.
  blocking: Boolean(escalation) && escalation !== "audit",
  escalation,
});

/**
 * Rung 4: peers. A trainee who has passed this step can judge someone else's
 * attempt at it. Enough agreement settles the submission; disagreement is
 * exactly the interesting case, so it goes to you.
 */
export function settleWithPeers(submission) {
  const reviews = submission.peerReviews ?? [];
  const required = env.review.peerReviewsRequired;
  if (reviews.length < required) return null;

  const passes = reviews.filter((r) => r.verdict === "pass").length;
  const revises = reviews.length - passes;

  if (passes >= required && revises === 0) {
    return { status: "passed", needsHuman: false, escalation: undefined };
  }
  if (revises >= required && passes === 0) {
    return { status: "changes-requested", needsHuman: false, escalation: undefined };
  }
  return { status: "pending", needsHuman: true, escalation: "peer-split" };
}

/** Plain-language reason, for the queue and for the trainee. */
export const ESCALATION_LABELS = {
  "low-confidence": "The reviewer was unsure",
  "repeat-failure": "Stuck after repeated attempts",
  milestone: "Milestone step",
  requested: "Trainee asked for a person",
  audit: "Spot check",
  "peer-split": "Peers disagreed",
  integrity: "Looks pasted",
};
