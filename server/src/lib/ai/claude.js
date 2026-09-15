import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env.js";
import { REVIEW_SCHEMA, SYSTEM_PROMPT, normaliseReview, parseJson } from "./contract.js";

/**
 * The quality path. Structured outputs pin the response to REVIEW_SCHEMA, so
 * the reviewer cannot hand back prose we then have to guess at.
 */
let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: env.ai.apiKey || undefined }));

export const claude = {
  name: "claude",

  status() {
    // The SDK also accepts an `ant auth login` profile, so a missing env var is
    // not proof there are no credentials — say so rather than claiming it is off.
    const hasKey = Boolean(env.ai.apiKey || process.env.ANTHROPIC_AUTH_TOKEN);
    return {
      provider: "claude",
      model: env.ai.model,
      configured: hasKey,
      note: hasKey
        ? undefined
        : "Set ANTHROPIC_API_KEY in server/.env (or sign in with `ant auth login`).",
    };
  },

  async review({ system, prompt }) {
    const model = env.ai.model;
    const response = await getClient().beta.messages.create({
      model,
      max_tokens: 16000,
      // Safety classifiers can decline a request; this re-runs it on Anthropic's
      // recommended fallback model server-side instead of returning the refusal.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: system || SYSTEM_PROMPT,
      output_config: {
        ...(env.ai.effort ? { effort: env.ai.effort } : {}),
        format: { type: "json_schema", schema: REVIEW_SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(
        `The reviewer declined this submission (${response.stop_details?.category ?? "unspecified"}). A person will look at it instead.`
      );
    }

    const text = response.content.find((block) => block.type === "text")?.text;
    if (!text) throw new Error("The reviewer returned an empty response.");

    return normaliseReview(parseJson(text), { provider: "claude", model: response.model || model });
  },
};
