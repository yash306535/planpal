import { describe, it, expect } from "vitest";
import { buildTimeline, parseISODate, toISODate } from "@/lib/timeline";
import type { LlmTimelineItem } from "@/lib/schema";

describe("date helpers", () => {
  it("round-trips a date through UTC without drift", () => {
    expect(toISODate(parseISODate("2026-06-20"))).toBe("2026-06-20");
  });
});

describe("buildTimeline", () => {
  const items: LlmTimelineItem[] = [
    { task: "Event day", weeksBefore: 0, category: "Day-of" },
    { task: "One week before", weeksBefore: 1, category: "Prep" },
    { task: "Three weeks before", weeksBefore: 3, category: "Prep" },
  ];

  it("counts dates back from the event date", () => {
    const out = buildTimeline(items, "2026-06-20", new Date("2026-01-01T00:00:00Z"));
    const byTask = Object.fromEntries(out.map((m) => [m.task, m.date]));
    expect(byTask["Event day"]).toBe("2026-06-20");
    expect(byTask["One week before"]).toBe("2026-06-13"); // −7 days
    expect(byTask["Three weeks before"]).toBe("2026-05-30"); // −21 days
  });

  it("sorts milestones earliest → latest", () => {
    const out = buildTimeline(items, "2026-06-20", new Date("2026-01-01T00:00:00Z"));
    expect(out.map((m) => m.date)).toEqual(["2026-05-30", "2026-06-13", "2026-06-20"]);
  });

  it("flags only milestones strictly before today", () => {
    // 'now' sits between the 3-weeks-before date and the others.
    const out = buildTimeline(items, "2026-06-20", new Date("2026-06-01T09:30:00Z"));
    const byTask = Object.fromEntries(out.map((m) => [m.task, m.overdue]));
    expect(byTask["Three weeks before"]).toBe(true); // 2026-05-30 < 2026-06-01
    expect(byTask["One week before"]).toBe(false);
    expect(byTask["Event day"]).toBe(false);
  });

  it("treats a milestone falling on today as not overdue", () => {
    const out = buildTimeline(
      [{ task: "Today", weeksBefore: 0, category: "x" }],
      "2026-06-01",
      new Date("2026-06-01T23:00:00Z"),
    );
    expect(out[0]!.overdue).toBe(false);
  });
});
