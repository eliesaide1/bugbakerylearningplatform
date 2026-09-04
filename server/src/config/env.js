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
};

export const isProd = env.nodeEnv === "production";
