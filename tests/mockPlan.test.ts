import { describe, it, expect } from "vitest";
import { mockLlmPlan } from "@/lib/mockPlan";
import { eventInputSchema, llmPlanSchema, EVENT_TYPES } from "@/lib/schema";
import { EVENT_TYPE_META, eventTypeMeta, CURRENCIES } from "@/lib/defaults";

const base = {
  name: "Sample",
  date: "2026-08-01",
  guests: 50,
  budget: 10000,
  currency: "USD",
  city: "Nairobi",
  preferences: "rooftop, citrus palette",
};

describe("mockLlmPlan", () => {
  it.each(EVENT_TYPES)("produces a schema-valid plan for %s", (type) => {
    const plan = mockLlmPlan(eventInputSchema.parse({ ...base, type }));
    expect(llmPlanSchema.safeParse(plan).success).toBe(true);
    // budget categories match the event-type defaults
    expect(plan.budget.map((b) => b.category)).toEqual(
      EVENT_TYPE_META[type].budgetCategories,
    );
  });

  it("reflects the host's city and preferences in the ideas", () => {
    const plan = mockLlmPlan(eventInputSchema.parse({ ...base, type: "birthday" }));
    const blob = plan.ideas.map((i) => `${i.title} ${i.description}`).join(" ");
    expect(blob).toContain("Nairobi");
    expect(blob).toContain("citrus palette");
  });

  it("still yields valid ideas with no preferences", () => {
    const plan = mockLlmPlan(
      eventInputSchema.parse({ ...base, type: "wedding", preferences: "" }),
    );
    expect(plan.ideas).toHaveLength(6);
    expect(llmPlanSchema.safeParse(plan).success).toBe(true);
  });
});

describe("defaults", () => {
  it("exposes metadata for every event type", () => {
    for (const type of EVENT_TYPES) {
      expect(eventTypeMeta(type)).toBe(EVENT_TYPE_META[type]);
      expect(EVENT_TYPE_META[type].budgetCategories.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("offers a non-empty currency list", () => {
    expect(CURRENCIES).toContain("USD");
    expect(CURRENCIES.length).toBeGreaterThan(3);
  });
});
