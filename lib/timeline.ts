import type { LlmTimelineItem, TimelineMilestone } from "@/lib/schema";

/**
 * Timeline math — pure and timezone-stable. The LLM returns `weeksBefore`
 * offsets only; we convert them to real calendar dates counting back from the
 * event date and flag anything already in the past.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Format a Date as YYYY-MM-DD in UTC. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse YYYY-MM-DD as midnight UTC (avoids local-timezone off-by-one errors). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/**
 * Build dated milestones from weeks-before offsets, sorted earliest → latest.
 * `now` is injectable so the overdue logic is deterministic in tests.
 */
export function buildTimeline(
  items: readonly LlmTimelineItem[],
  eventDate: string,
  now: Date = new Date(),
): TimelineMilestone[] {
  const event = parseISODate(eventDate);
  const today = parseISODate(toISODate(now)); // midnight UTC today

  return items
    .map((it) => {
      const weeks = Math.max(0, Math.round(it.weeksBefore));
      const date = new Date(event.getTime() - weeks * 7 * DAY_MS);
      return {
        task: it.task,
        category: it.category,
        weeksBefore: weeks,
        date: toISODate(date),
        overdue: date.getTime() < today.getTime(),
      };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
