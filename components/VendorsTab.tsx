"use client";

import { useEffect, useState } from "react";
import { loadTicks, saveTicks, type Ticks } from "@/lib/storage";
import type { ComputedPlan } from "@/lib/schema";

function key(category: string, item: string): string {
  return `${category}|${item}`;
}

export function VendorsTab({
  vendors,
  hash,
}: {
  vendors: ComputedPlan["vendors"];
  hash: string;
}) {
  const [ticks, setTicks] = useState<Ticks>({});

  // Load persisted ticks after mount to avoid a hydration mismatch.
  useEffect(() => {
    setTicks(loadTicks(hash));
  }, [hash]);

  function toggle(category: string, item: string) {
    setTicks((prev) => {
      const k = key(category, item);
      const next = { ...prev, [k]: !prev[k] };
      saveTicks(hash, next);
      return next;
    });
  }

  return (
    <div className="animate-fade-up space-y-7">
      {vendors.map((group) => {
        const done = group.items.filter(
          (item) => ticks[key(group.category, item)],
        ).length;
        return (
          <section key={group.category}>
            <div className="mb-2 flex items-baseline justify-between border-b border-line pb-1">
              <h3 className="font-serif text-lg font-semibold">{group.category}</h3>
              <span className="text-xs tabular-nums text-ink-soft">
                {done}/{group.items.length} done
              </span>
            </div>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const checked = Boolean(ticks[key(group.category, item)]);
                return (
                  <li key={item}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-paper-deep">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(group.category, item)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden
                        className="grid h-5 w-5 shrink-0 place-items-center rounded border border-line bg-paper text-paper peer-checked:border-accent-deep peer-checked:bg-accent-deep peer-focus-visible:ring-2 peer-focus-visible:ring-accent-deep peer-focus-visible:ring-offset-1"
                      >
                        <span className={checked ? "animate-tick" : "opacity-0"}>✓</span>
                      </span>
                      <span
                        className={checked ? "text-ink-soft line-through" : "text-ink"}
                      >
                        {item}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
