import { describe, it, expect } from "vitest";
import { eventInputSchema, llmPlanSchema } from "@/lib/schema";
import { mockLlmPlan } from "@/lib/mockPlan";

const validInput = {
  type: "wedding",
  name: "Alex & Sam",
  date: "2026-09-12",
  guests: 120,
  budget: 25000,
  currency: "usd",
  city: "Lisbon",
  preferences: "garden, candlelit, sustainable",
};

describe("eventInputSchema", () => {
  it("accepts a valid event and normalizes values", () => {
    const parsed = eventInputSchema.parse(validInput);
    expect(parsed.currency).toBe("USD"); // transformed to upper case
    expect(parsed.guests).toBe(120);
    expect(parsed.budget).toBe(25000);
  });

  it("coerces numeric strings from form fields", () => {
    const parsed = eventInputSchema.parse({
      ...validInput,
      guests: "80",
      budget: "15000",
    });
    expect(parsed.guests).toBe(80);
    expect(parsed.budget).toBe(15000);
  });

  it("defaults preferences to an empty string when omitted", () => {
    const { preferences, ...rest } = validInput;
    void preferences;
    const parsed = eventInputSchema.parse(rest);
    expect(parsed.preferences).toBe("");
  });

  const invalidCases: Array<[string, Record<string, unknown>]> = [
    ["empty name", { ...validInput, name: "" }],
    ["name too long", { ...validInput, name: "x".repeat(101) }],
    ["unknown type", { ...validInput, type: "party" }],
    ["guests below 1", { ...validInput, guests: 0 }],
    ["guests above 10000", { ...validInput, guests: 10001 }],
    ["fractional guests", { ...validInput, guests: 3.5 }],
    ["non-numeric guests", { ...validInput, guests: "abc" }],
    ["zero budget", { ...validInput, budget: 0 }],
    ["negative budget", { ...validInput, budget: -5 }],
    ["preferences too long", { ...validInput, preferences: "x".repeat(501) }],
    ["bad currency", { ...validInput, currency: "US" }],
    ["impossible date", { ...validInput, date: "2026-02-30" }],
    ["malformed date", { ...validInput, date: "12/09/2026" }],
    ["empty city", { ...validInput, city: "  " }],
  ];

  it.each(invalidCases)("rejects %s", (_label, input) => {
    expect(eventInputSchema.safeParse(input).success).toBe(false);
  });
});

describe("llmPlanSchema", () => {
  it("accepts well-formed plans for every event type", () => {
    for (const type of ["wedding", "birthday", "community"] as const) {
      const plan = mockLlmPlan(eventInputSchema.parse({ ...validInput, type }));
      expect(llmPlanSchema.safeParse(plan).success).toBe(true);
    }
  });

  it("rejects the wrong number of ideas", () => {
    const plan = mockLlmPlan(eventInputSchema.parse(validInput));
    const tooFew = { ...plan, ideas: plan.ideas.slice(0, 5) };
    expect(llmPlanSchema.safeParse(tooFew).success).toBe(false);
  });

  it("rejects an unknown idea tag", () => {
    const plan = mockLlmPlan(eventInputSchema.parse(validInput));
    const firstIdea = plan.ideas[0]!;
    const badTag = {
      ...plan,
      ideas: [{ ...firstIdea, tag: "music" }, ...plan.ideas.slice(1)],
    };
    expect(llmPlanSchema.safeParse(badTag).success).toBe(false);
  });
});
