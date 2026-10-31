import { describe, it, expect } from "vitest";
import { buildTavusContext, buildConversationName } from "@/lib/tavus";
import { eventInputSchema } from "@/lib/schema";

const input = eventInputSchema.parse({
  type: "community",
  name: "Riverside Cleanup Fair",
  date: "2026-07-18",
  guests: 300,
  budget: 8000,
  currency: "usd",
  city: "Austin",
  preferences: "family friendly, zero waste",
});

describe("buildTavusContext", () => {
  it("includes every validated event detail", () => {
    const ctx = buildTavusContext(input);
    expect(ctx).toContain("community");
    expect(ctx).toContain("Riverside Cleanup Fair");
    expect(ctx).toContain("2026-07-18");
    expect(ctx).toContain("Austin");
    expect(ctx).toContain("300");
    expect(ctx).toContain("8000");
    expect(ctx).toContain("USD");
    expect(ctx).toContain("zero waste");
  });

  it("appends a plan summary when provided", () => {
    const ctx = buildTavusContext(input, "Budget leans on permits and sound.");
    expect(ctx).toContain("summary");
    expect(ctx).toContain("permits and sound");
  });

  it("handles missing preferences gracefully", () => {
    const ctx = buildTavusContext({ ...input, preferences: "" });
    expect(ctx).toContain("hasn't shared specific style notes");
  });
});

describe("buildConversationName", () => {
  it("builds a readable, bounded name", () => {
    expect(buildConversationName(input)).toBe("PlanPal — Riverside Cleanup Fair");
    const long = buildConversationName({ ...input, name: "x".repeat(200) });
    expect(long.length).toBeLessThanOrEqual(80);
  });
});
