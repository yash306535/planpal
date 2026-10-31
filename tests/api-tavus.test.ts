import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/tavus/conversation/route";

const SECRET = "tavus-secret-key-xyz";

const validBody = {
  eventInput: {
    type: "community",
    name: "Riverside Fair",
    date: "2026-07-01",
    guests: 100,
    budget: 5000,
    currency: "USD",
    city: "Austin",
    preferences: "zero waste",
  },
  planSummary: "Budget leans on permits and sound.",
};

function req(body: unknown, ip = "20.0.0.1"): Request {
  return new Request("http://localhost/api/tavus/conversation", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  process.env.TAVUS_API_KEY = SECRET;
  process.env.TAVUS_REPLICA_ID = "r_abc123";
  process.env.TAVUS_PERSONA_ID = "p_abc123";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.TAVUS_API_KEY;
  delete process.env.TAVUS_REPLICA_ID;
  delete process.env.TAVUS_PERSONA_ID;
});

describe("POST /api/tavus/conversation", () => {
  it("returns only conversation_url, strips extras, and never leaks the key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        conversation_url: "https://tavus.daily.co/abc123",
        conversation_id: "c_secret_internal",
        status: "active",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(req(validBody, "20.0.0.1"));
    expect(res.status).toBe(200);
    const data = await res.json();

    // Only the url survives — upstream extras are dropped.
    expect(data).toEqual({ conversation_url: "https://tavus.daily.co/abc123" });

    // The key is sent to Tavus server-side as a header…
    expect(fetchMock).toHaveBeenCalledWith(
      "https://tavusapi.com/v2/conversations",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": SECRET }),
      }),
    );
    // …and never appears in our response to the client.
    expect(JSON.stringify(data)).not.toContain(SECRET);
  });

  it("rejects invalid input with 400", async () => {
    const res = await POST(req({ planSummary: "oops, no eventInput" }, "20.0.0.2"));
    expect(res.status).toBe(400);
  });

  it("returns 503 when Tavus isn't configured (app keeps working)", async () => {
    delete process.env.TAVUS_API_KEY;
    delete process.env.TAVUS_REPLICA_ID;
    delete process.env.TAVUS_PERSONA_ID;
    const res = await POST(req(validBody, "20.0.0.3"));
    expect(res.status).toBe(503);
  });

  it("returns 502 when Tavus upstream fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "err" }, 500)),
    );
    const res = await POST(req(validBody, "20.0.0.4"));
    expect(res.status).toBe(502);
  });

  it("rate-limits the 11th request in a minute with 429", async () => {
    // Fresh Response per call — a Response body can only be read once.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ conversation_url: "https://tavus.daily.co/x" })),
    );
    const ip = "20.9.9.9";
    for (let i = 0; i < 10; i += 1) {
      const res = await POST(req(validBody, ip));
      expect(res.status).toBe(200);
    }
    expect((await POST(req(validBody, ip))).status).toBe(429);
  });
});
