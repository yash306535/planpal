"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Tabs following the WAI-ARIA tabs pattern: a roving tabindex, arrow/Home/End
 * key navigation, aria-selected, and aria-controls/labelledby wiring.
 */
export function Tabs({ tabs, ariaLabel }: { tabs: TabDef[]; ariaLabel: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function select(index: number) {
    setActive(index);
    tabRefs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        select(index === last ? 0 : index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        select(index === 0 ? last : index - 1);
        break;
      case "Home":
        select(0);
        break;
      case "End":
        select(last);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        className="flex flex-wrap gap-1 border-b border-line"
      >
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`-mb-px rounded-t-md px-4 py-2.5 font-sans text-sm font-semibold transition-colors ${
                selected
                  ? "border-b-2 border-accent-deep text-accent-deep"
                  : "border-b-2 border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={index !== active}
          tabIndex={0}
          className="pt-6 focus-visible:outline-none"
        >
          {index === active ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
