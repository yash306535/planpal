/**
 * Tiny in-memory sliding-window rate limiter (per key, usually an IP). Pure
 * logic with an injectable clock so it is fully unit-testable. In-process only
 * — fine for a single-instance demo; a real deployment would use a shared store.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
  reset(key?: string): void;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

export function createRateLimiter({ limit, windowMs }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      const windowStart = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (recent.length >= limit) {
        const oldest = recent[0] ?? now;
        hits.set(key, recent);
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, oldest + windowMs - now),
        };
      }

      recent.push(now);
      hits.set(key, recent);
      return {
        allowed: true,
        remaining: Math.max(0, limit - recent.length),
        retryAfterMs: 0,
      };
    },

    reset(key) {
      if (key === undefined) hits.clear();
      else hits.delete(key);
    },
  };
}
