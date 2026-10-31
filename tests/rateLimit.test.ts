import { describe, it, expect } from "vitest";
import { createRateLimiter } from "@/lib/rateLimit";

describe("createRateLimiter", () => {
  it("allows up to the limit then blocks within the window", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.check("ip", 1000).allowed).toBe(true);
    expect(rl.check("ip", 1001).allowed).toBe(true);
    const third = rl.check("ip", 1002);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const blocked = rl.check("ip", 1003);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(997); // oldest(1000) + 1000 − 1003
  });

  it("allows again once the window slides past old hits", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 1000 });
    rl.check("ip", 1000);
    rl.check("ip", 1500);
    expect(rl.check("ip", 1600).allowed).toBe(false);
    // At 2600, the 1000 and 1500 hits are outside the 1000ms window.
    expect(rl.check("ip", 2600).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("a", 1000).allowed).toBe(true);
    expect(rl.check("a", 1000).allowed).toBe(false);
    expect(rl.check("b", 1000).allowed).toBe(true); // different key, fresh budget
  });

  it("resets a single key or everything", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    rl.check("a", 1000);
    rl.reset("a");
    expect(rl.check("a", 1000).allowed).toBe(true);
    rl.check("a", 1000);
    rl.reset();
    expect(rl.check("a", 1000).allowed).toBe(true);
  });
});
