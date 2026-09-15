import { env } from "../../config/env.js";
import { SYSTEM_PROMPT } from "./contract.js";
import { buildReviewPrompt } from "./prompt.js";
import { claude } from "./claude.js";
import { ollama } from "./ollama.js";
import { openaiCompatible } from "./openaiCompatible.js";

/**
 * The AI layer is one rung of the ladder, never the whole of it: deterministic
 * checks run before it, a person can overrule it after. Swapping providers is
 * an env var — the review contract and the prompt are the part that matters.
 */
const PROVIDERS = {
  claude,
  ollama,
  "openai-compatible": openaiCompatible,
};

const off = {
  name: "off",
  status: () => ({
    provider: "off",
    configured: false,
    note: "AI review is disabled. Set AI_PROVIDER in server/.env to turn it on.",
  }),
};

export const provider = () => PROVIDERS[env.ai.provider] ?? off;

export const aiEnabled = () => env.ai.provider !== "off" && Boolean(PROVIDERS[env.ai.provider]);

export function aiStatus() {
  return provider().status();
}

/**
 * Review one submission. Never throws: a provider that is down must not cost a
 * trainee their work, so the failure is recorded on the review and the ladder
 * routes the submission to a person instead.
 */
export async function reviewSubmission({ step, submission, checkResults, attempt = 1 }) {
  if (!aiEnabled()) return null;

  const prompt = buildReviewPrompt({ step, submission, checkResults, attempt });

  try {
    // The trainee is told they will hear back within a minute, so the wait is
    // capped here rather than left to whatever the provider decides to do.
    return await Promise.race([
      provider().review({ system: SYSTEM_PROMPT, prompt }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("The reviewer took too long to answer.")),
          env.review.aiWaitMs
        )
      ),
    ]);
  } catch (err) {
    console.error("[ai] review failed:", err.message);
    return {
      provider: env.ai.provider,
      model: env.ai.model,
      verdict: "revise",
      confidence: 0,
      score: 0,
      summary: "Automatic review could not run, so a person will look at this instead.",
      issues: [],
      hints: [],
      error: err.message,
      at: new Date().toISOString(),
    };
  }
}

/** Cheap smoke test for the CMS, so you find out here rather than mid-cohort. */
export async function testProvider() {
  if (!aiEnabled()) throw new Error("AI review is turned off.");
  return provider().review({
    system: SYSTEM_PROMPT,
    prompt:
      "# Exercise: Smoke test\nType: task\n\n## What the trainee was asked to do\nReturn a pass verdict with high confidence so we know the connection works.\n\n# The trainee's submission (attempt 1)\n## Their notes\nEverything is wired up correctly.\n",
  });
}
