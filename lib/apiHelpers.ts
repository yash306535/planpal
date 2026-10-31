/** Small server-only helpers shared by the API routes. */

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
