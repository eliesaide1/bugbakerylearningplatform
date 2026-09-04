import { setApiBase } from "@shared/media";
import type { ApiErrorBody } from "@shared/types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]> | null;

  constructor(message: string, status: number, fields?: Record<string, string[]> | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields ?? null;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the API is running.", 0);
  }

  const payload = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;

  if (!res.ok) {
    throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status, payload?.fields);
  }
  return payload as T;
}

// Shared components resolve media through this base.
setApiBase(API_URL);

export { mediaUrl, asMedia, mediaId, formatBytes } from "@shared/media";
