"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { Tabs, type TabDef } from "@/components/Tabs";
import { BudgetTab } from "@/components/BudgetTab";
import { TimelineTab } from "@/components/TimelineTab";
import { VendorsTab } from "@/components/VendorsTab";
import { IdeasTab } from "@/components/IdeasTab";
import { EVENT_TYPE_META } from "@/lib/defaults";
import { formatDate, formatMoney } from "@/lib/format";
import type { ComputedPlan, EventInput } from "@/lib/schema";

// Lazy-load the Tavus panel: it's optional and keeps the initial bundle small.
const TavusPanel = dynamic(
  () => import("@/components/TavusPanel").then((m) => ({ default: m.TavusPanel })),
  {
    ssr: false,
    loading: () => <p className="text-sm text-ink-soft">Loading the video planner…</p>,
  },
);

interface Props {
  input: EventInput;
  plan: ComputedPlan;
  source: "llm" | "mock";
  hash: string;
  onStartOver: () => void;
}

function planSummaryLine(input: EventInput, plan: ComputedPlan): string {
  const top = [...plan.budget.rows].sort((a, b) => b.amount - a.amount)[0];
  const line =
    `A ${input.type} for ${input.guests} guests in ${input.city} on ${input.date}, ` +
    `budget ${formatMoney(plan.budget.total, plan.budget.currency)}. ` +
    `Biggest line: ${top?.category ?? "venue"}. ` +
    `${plan.timeline.length} milestones and ${plan.vendors.length} vendor groups drafted.`;
  return line.slice(0, 600);
}

export function PlanView({ input, plan, source, hash, onStartOver }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Swap the accent theme to match the event type, and move focus to the plan
  // heading so keyboard/screen-reader users land here when the plan loads.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", input.type);
    headingRef.current?.focus();
    return () => root.removeAttribute("data-theme");
  }, [input.type]);

  const summary = planSummaryLine(input, plan);

  const tabs: TabDef[] = [
    {
      id: "budget",
      label: "Budget",
      content: <BudgetTab budget={plan.budget} hash={hash} />,
    },
    {
      id: "timeline",
      label: "Timeline",
      content: <TimelineTab timeline={plan.timeline} />,
    },
    {
      id: "vendors",
      label: "Vendors",
      content: <VendorsTab vendors={plan.vendors} hash={hash} />,
    },
    { id: "ideas", label: "Ideas", content: <IdeasTab ideas={plan.ideas} /> },
  ];

  const meta = EVENT_TYPE_META[input.type];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-line bg-paper-deep p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
              {meta.label}
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 font-serif text-2xl font-bold leading-tight focus-visible:outline-none"
            >
              {input.name}
            </h2>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Date</dt>
                <dd className="text-right font-medium">{formatDate(input.date)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">City</dt>
                <dd className="text-right font-medium">{input.city}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Guests</dt>
                <dd className="text-right font-medium tabular-nums">{input.guests}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Budget</dt>
                <dd className="text-right font-medium tabular-nums">
                  {formatMoney(plan.budget.total, plan.budget.currency)}
                </dd>
              </div>
            </dl>
            <p className="mt-4">
              <span className="inline-block rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft">
                {source === "mock" ? "Example plan" : "AI-generated"}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5">
            <TavusPanel eventInput={input} planSummary={summary} />
          </div>

          <button
            type="button"
            onClick={onStartOver}
            className="w-full rounded-lg border border-ink/20 px-4 py-2.5 font-semibold text-ink transition hover:border-ink/40"
          >
            Plan another event
          </button>
        </aside>

        <section aria-label="Your plan">
          <Tabs tabs={tabs} ariaLabel="Plan sections" />
        </section>
      </div>
    </div>
  );
}
