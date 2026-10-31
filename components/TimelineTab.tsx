"use client";

import { formatDate } from "@/lib/format";
import type { ComputedPlan } from "@/lib/schema";

export function TimelineTab({ timeline }: { timeline: ComputedPlan["timeline"] }) {
  return (
    <ol className="animate-fade-up space-y-4">
      {timeline.map((milestone, i) => (
        <li
          key={`${milestone.date}-${milestone.task}-${i}`}
          className="ticket flex items-center gap-4 px-5 py-4"
        >
          <div className="min-w-24 border-r border-dashed border-line pr-4">
            <p className="font-serif text-base font-semibold tabular-nums">
              {formatDate(milestone.date)}
            </p>
            <p className="text-xs text-ink-soft">
              {milestone.weeksBefore === 0
                ? "event day"
                : `${milestone.weeksBefore} week${milestone.weeksBefore === 1 ? "" : "s"} before`}
            </p>
          </div>
          <div className="flex-1">
            <p className="font-medium text-ink">{milestone.task}</p>
            <span className="mt-1 inline-block rounded-full bg-sage/20 px-2 py-0.5 text-xs text-ink-soft">
              {milestone.category}
            </span>
          </div>
          {milestone.overdue ? (
            <span className="flex items-center gap-1 rounded-full border border-accent-deep/50 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent-deep">
              <span aria-hidden>⚠</span> Overdue
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
