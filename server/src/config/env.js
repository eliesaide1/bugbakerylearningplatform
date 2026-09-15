import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(here, "..", "..");

dotenv.config({ path: path.join(serverRoot, ".env") });

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bugbakery",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  publicUrl: (process.env.PUBLIC_URL || "http://localhost:5000").replace(/\/$/, ""),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  uploadsDir: path.join(serverRoot, "uploads"),
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@bugbakery.local",
    password: process.env.ADMIN_PASSWORD || "admin1234",
    name: process.env.ADMIN_NAME || "Elie",
  },
  ai: aiConfig(),
  review: {
    /**
     * The dials on the escalation ladder. Everything below the confidence
     * floor, and everything that has already failed this many times, goes to a
     * person — those are the cases where a human actually adds something.
     */
    confidenceFloor: Number(process.env.REVIEW_CONFIDENCE_FLOOR || 0.7),
    repeatFailures: Number(process.env.REVIEW_REPEAT_FAILURES || 2),
    /** Share of auto-passed work spot-checked anyway, to catch model drift. */
    auditRate: Number(process.env.REVIEW_AUDIT_RATE || 0.07),
    /** Peer reviews needed to clear a submission when peer review is on. */
    peerReviewsRequired: Number(process.env.REVIEW_PEER_REQUIRED || 2),
    /** Blocked paste attempts, or pasted characters, that flag a submission. */
    pasteAttempts: Number(process.env.REVIEW_PASTE_ATTEMPTS || 2),
    pastedCharacters: Number(process.env.REVIEW_PASTED_CHARACTERS || 200),
    /** How long the trainee waits for the automatic reply before a person takes it. */
    aiWaitMs: Number(process.env.REVIEW_WAIT_MS || 60_000),
  },
};

/**
 * Which reviewer runs, and where to reach it. Defaults are per-provider so
 * picking one is a single env var rather than four.
 */
function aiConfig() {
  const provider = (process.env.AI_PROVIDER || "off").trim();

  const MODEL_DEFAULTS = {
    claude: "claude-opus-5",
    ollama: "qwen2.5-coder:7b",
  };
  const URL_DEFAULTS = {
    ollama: "http://127.0.0.1:11434",
  };

  return {
    provider,
    model: process.env.AI_MODEL || MODEL_DEFAULTS[provider] || "",
    baseUrl: (process.env.AI_BASE_URL || URL_DEFAULTS[provider] || "").replace(/\/$/, ""),
    apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || "",
    /** Claude only: low | medium | high | xhigh | max. Unset uses the default. */
    effort: process.env.AI_EFFORT || "",
    /** Set to "object" for hosts that reject a json_schema response format. */
    jsonMode: process.env.AI_JSON_MODE || "schema",
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 90_000),
  };
}

export const isProd = env.nodeEnv === "production";
