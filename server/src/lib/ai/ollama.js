import { env } from "../../config/env.js";
import { REVIEW_SCHEMA, SYSTEM_PROMPT, normaliseReview, parseJson } from "./contract.js";

/**
 * The free path: a model running on your own machine. No key, no per-review
 * cost, and no submission ever leaves the box. Ollama constrains the reply to
 * a JSON schema through its `format` field, same idea as structured outputs.
 *
 *   brew install ollama && ollama serve && ollama pull qwen2.5-coder:7b
 */
export const ollama = {
  name: "ollama",

  status() {
    return {
      provider: "ollama",
      model: env.ai.model,
      configured: true,
      note: `Expecting Ollama at ${env.ai.baseUrl}. Run \`ollama pull ${env.ai.model}\` if the model is missing.`,
    };
  },

  async review({ system, prompt }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.ai.timeoutMs);

    try {
      const res = await fetch(`${env.ai.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: env.ai.model,
          stream: false,
          format: REVIEW_SCHEMA,
          options: { temperature: 0.2 },
          messages: [
            { role: "system", content: system || SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama replied ${res.status}. Is it running and is the model pulled?`);
      }

      const body = await res.json();
      const text = body?.message?.content;
      if (!text) throw new Error("Ollama returned an empty response.");

      return normaliseReview(parseJson(text), { provider: "ollama", model: env.ai.model });
    } finally {
      clearTimeout(timer);
    }
  },
};
