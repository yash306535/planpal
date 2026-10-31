import { describe, it, expect } from "vitest";
import { parsePlan, extractJson } from "@/lib/parsePlan";
import { mockLlmPlan } from "@/lib/mockPlan";
import { eventInputSchema } from "@/lib/schema";

const plan = mockLlmPlan(
  eventInputSchema.parse({
    type: "birthday",
    name: "Nadia turns 30",
    date: "2026-05-01",
    guests: 40,
    budget: 3000,
    currency: "EUR",
    city: "Porto",
    preferences: "citrus colors, outdoors",
  }),
);

describe("extractJson", () => {
  it("strips a ```json fence", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("isolates an object embedded in prose", () => {
    expect(extractJson('Sure! {"a":1} hope that helps')).toBe('{"a":1}');
  });
});

describe("parsePlan", () => {
  it("accepts an already-parsed valid plan object", () => {
    const result = parsePlan(plan);
    expect(result.ok).toBe(true);
  });

  it("accepts a valid JSON string, fenced", () => {
    const result = parsePlan("```json\n" + JSON.stringify(plan) + "\n```");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.ideas).toHaveLength(plan.ideas.length);
  });

  it("fails cleanly on non-JSON text", () => {
    const result = parsePlan("I'm sorry, I can't do that.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/json/i);
  });

  it("fails on JSON that violates the schema", () => {
    const broken = JSON.stringify({ ...plan, ideas: plan.ideas.slice(0, 2) });
    const result = parsePlan(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schema/i);
  });
});
