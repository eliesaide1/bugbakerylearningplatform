import { setApiBase } from "@shared/media";
import type { ApiErrorBody } from "@shared/types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const TOKEN_KEY = "bugbakery.trainee.token";

/** The signed-in trainee's session. Separate key from the CMS on purpose. */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Set by TraineeProvider so an expired session bounces to the sign-in screen. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

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
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the API is running.", 0);
  }

  if (res.status === 401) onUnauthorized?.();

  const payload = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;

  if (!res.ok) {
    throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status, payload?.fields);
  }
  return payload as T;
}

// Shared components resolve media through this base.
setApiBase(API_URL);

export { mediaUrl, asMedia, mediaId, formatBytes } from "@shared/media";
