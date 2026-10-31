import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Anthropic SDK so we can drive the model's responses.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: createMock };
    constructor(_opts: unknown) {
      void _opts;
    }
  }
  return { default: MockAnthropic };
});

import { POST } from "@/app/api/plan/route";

const validBody = {
  type: "birthday",
  name: "Mia turns 8",
  date: "2027-01-10",
  guests: 25,
  budget: 1200,
  currency: "usd",
  city: "Oslo",
  preferences: "dinosaurs",
};

function req(body: unknown, ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const ORIG = {
  MOCK_MODE: process.env.MOCK_MODE,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

beforeEach(() => {
  createMock.mockReset();
  process.env.MOCK_MODE = "true"; // default: deterministic mock planner
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  process.env.MOCK_MODE = ORIG.MOCK_MODE ?? "";
  if (ORIG.MOCK_MODE === undefined) delete process.env.MOCK_MODE;
  if (ORIG.ANTHROPIC_API_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = ORIG.ANTHROPIC_API_KEY;
});

describe("POST /api/plan", () => {
  it("returns a computed plan from the mock planner", async () => {
    const res = await POST(req(validBody, "10.0.0.1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe("mock");

    const { total, rows } = data.plan.budget;
    const sum = rows.reduce((a: number, r: { amount: number }) => a + r.amount, 0);
    expect(total).toBe(1200);
    expect(sum).toBe(total); // amounts sum exactly to the total
    expect(data.plan.ideas.length).toBeGreaterThanOrEqual(6);
    expect(data.plan.timeline[0]).toHaveProperty("overdue");
  });

  it("rejects invalid input with 400", async () => {
    const res = await POST(req({ ...validBody, guests: 0 }, "10.0.0.2"));
    expect(res.status).toBe(400);
  });

  it("rejects oversized bodies with 400", async () => {
    const huge = JSON.stringify({ ...validBody, preferences: "x".repeat(20_000) });
    const res = await POST(req(huge, "10.0.0.3"));
    expect(res.status).toBe(400);
  });

  it("fails safely (502) after retrying malformed LLM output", async () => {
    process.env.MOCK_MODE = "false";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    createMock.mockResolvedValue({ content: [{ type: "text", text: "not valid json" }] });

    const res = await POST(req(validBody, "10.0.0.4"));
    expect(res.status).toBe(502);
    expect(createMock).toHaveBeenCalledTimes(2); // one retry
    const data = await res.json();
    expect(data.error).toMatch(/couldn't generate/i);
  });

  it("returns 502 when the LLM call throws (upstream failure)", async () => {
    process.env.MOCK_MODE = "false";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    createMock.mockRejectedValue(new Error("network down"));

    const res = await POST(req(validBody, "10.0.0.5"));
    expect(res.status).toBe(502);
  });

  it("rate-limits the 11th request in a minute with 429", async () => {
    const ip = "10.9.9.9";
    for (let i = 0; i < 10; i += 1) {
      const res = await POST(req(validBody, ip));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(req(validBody, ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});
