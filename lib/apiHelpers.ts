/** Small server-only helpers shared by the API routes. */

import type { RateLimiter } from "@/lib/rateLimit";

/** Shared throttling policy for the public API routes: 10 requests per minute. */
export const API_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

/** Best-effort client IP for rate limiting (behind a proxy or not). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** JSON response with a consistent content-type. */
export function json(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/**
 * Apply a rate limiter to a request, keyed by client IP. Returns a ready-to-send
 * 429 response (with a `retry-after` header) when the caller is over the limit,
 * or null when the request may proceed.
 */
export function rateLimit(req: Request, limiter: RateLimiter): Response | null {
  const rate = limiter.check(clientIp(req));
  if (rate.allowed) return null;
  return json({ error: "Too many requests. Please slow down." }, 429, {
    "retry-after": String(Math.ceil(rate.retryAfterMs / 1000)),
  });
}

/** Read and size-cap a request body, returning parsed JSON or null if invalid. */
export async function readJsonBody(
  req: Request,
  maxChars = 10_000,
): Promise<unknown | null> {
  const raw = await req.text();
  if (raw.length === 0 || raw.length > maxChars) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
