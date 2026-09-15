import { env } from "../../config/env.js";
import { REVIEW_SCHEMA, SYSTEM_PROMPT, normaliseReview, parseJson } from "./contract.js";

/**
 * Anything speaking the /chat/completions shape: Groq and OpenRouter (both have
 * free tiers), LM Studio, vLLM, a self-hosted gateway. One adapter covers them
 * all — set AI_BASE_URL, AI_API_KEY and AI_MODEL for the one you want.
 */
export const openaiCompatible = {
  name: "openai-compatible",

  status() {
    return {
      provider: "openai-compatible",
      model: env.ai.model,
      configured: Boolean(env.ai.baseUrl && env.ai.apiKey),
      note:
        env.ai.baseUrl && env.ai.apiKey
          ? `Calling ${env.ai.baseUrl}.`
          : "Set AI_BASE_URL and AI_API_KEY in server/.env.",
    };
  },

  async review({ system, prompt }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.ai.timeoutMs);

    try {
      const res = await fetch(`${env.ai.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ai.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: env.ai.model,
          temperature: 0.2,
          // Hosts that reject json_schema usually accept plain json_object;
          // parseJson copes with either, so this degrades rather than fails.
          response_format:
            env.ai.jsonMode === "object"
              ? { type: "json_object" }
              : {
                  type: "json_schema",
                  json_schema: { name: "review", strict: true, schema: REVIEW_SCHEMA },
                },
          messages: [
            { role: "system", content: system || SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Reviewer replied ${res.status}. ${detail.slice(0, 300)}`);
      }

      const body = await res.json();
      const text = body?.choices?.[0]?.message?.content;
      if (!text) throw new Error("The reviewer returned an empty response.");

      return normaliseReview(parseJson(text), {
        provider: "openai-compatible",
        model: body.model || env.ai.model,
      });
    } finally {
      clearTimeout(timer);
    }
  },
};
