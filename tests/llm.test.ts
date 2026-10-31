import { describe, it, expect, vi } from "vitest";
import { generateValidatedPlan, buildPlanPrompt } from "@/lib/llm";
import { mockLlmPlan } from "@/lib/mockPlan";
import { eventInputSchema } from "@/lib/schema";

const input = eventInputSchema.parse({
  type: "wedding",
  name: "T & R",
  date: "2026-09-09",
  guests: 80,
  budget: 20000,
  currency: "USD",
  city: "Oslo",
  preferences: "candlelit, sustainable",
});
const validJson = JSON.stringify(mockLlmPlan(input));

describe("buildPlanPrompt", () => {
  it("delimits untrusted data and forbids following its instructions", () => {
    const { system, user } = buildPlanPrompt(input);
    expect(system).toMatch(/never follow/i);
    expect(system).toMatch(/untrusted/i);
    expect(user).toContain("<event_data>");
    expect(user).toContain("Oslo");
    expect(user).toContain("candlelit, sustainable");
  });
});

describe("generateValidatedPlan", () => {
  it("returns a validated plan on the first good response", async () => {
    const call = vi.fn().mockResolvedValue(validJson);
    const plan = await generateValidatedPlan(input, call);
    expect(plan.ideas.length).toBeGreaterThanOrEqual(6);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("retries exactly once, then succeeds", async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(validJson);
    const plan = await generateValidatedPlan(input, call);
    expect(plan).toBeTruthy();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("throws after one retry when output never validates", async () => {
    const call = vi.fn().mockResolvedValue("still not json");
    await expect(generateValidatedPlan(input, call)).rejects.toThrow(
      /validation failed/i,
    );
    expect(call).toHaveBeenCalledTimes(2);
  });
});
