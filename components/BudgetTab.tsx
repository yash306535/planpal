"use client";

import { useEffect, useState } from "react";
import { remainingBudget } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import { loadSpent, saveSpent, type Spent } from "@/lib/storage";
import type { ComputedPlan } from "@/lib/schema";

export function BudgetTab({
  budget,
  hash,
}: {
  budget: ComputedPlan["budget"];
  hash: string;
}) {
  const [spent, setSpent] = useState<Spent>({});

  // Load persisted spend after mount (keeps SSR and first client render in sync).
  useEffect(() => {
    setSpent(loadSpent(hash));
  }, [hash]);

  function updateSpent(category: string, raw: string) {
    setSpent((prev) => {
      const next = { ...prev };
      if (raw.trim() === "") delete next[category];
      else {
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0) next[category] = n;
      }
      saveSpent(hash, next);
      return next;
    });
  }

  const remaining = remainingBudget(budget.total, spent);
  const over = remaining < 0;

  return (
    <div className="animate-fade-up">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Budget breakdown by category, with planned amounts, share of total, and your
          actual spend.
        </caption>
        <thead>
          <tr className="border-b border-line text-ink-soft">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Category
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Planned
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Share
            </th>
            <th scope="col" className="py-2 font-semibold">
              Actual spent
            </th>
          </tr>
        </thead>
        <tbody>
          {budget.rows.map((row) => (
            <tr key={row.category} className="border-b border-line/60 align-middle">
              <th scope="row" className="py-3 pr-3 font-medium text-ink">
                {row.category}
              </th>
              <td className="py-3 pr-3 tabular-nums">
                {formatMoney(row.amount, budget.currency)}
              </td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <span className="w-9 tabular-nums text-ink-soft">{row.percent}%</span>
                  <span
                    aria-hidden
                    className="hidden h-2 w-24 overflow-hidden rounded-full bg-paper-deep sm:block"
                  >
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${row.percent}%` }}
                    />
                  </span>
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  <span className="text-ink-soft">{budget.currency}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    aria-label={`Actual spent for ${row.category}`}
                    value={spent[row.category] ?? ""}
                    onChange={(e) => updateSpent(row.category, e.target.value)}
                    className="w-28 rounded-md border border-line bg-paper px-2 py-1.5 tabular-nums focus-visible:border-accent-deep"
                    placeholder="0"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <th scope="row" className="py-3 pr-3 text-left">
              Total
            </th>
            <td className="py-3 pr-3 tabular-nums">
              {formatMoney(budget.total, budget.currency)}
            </td>
            <td className="py-3 pr-3 tabular-nums text-ink-soft">100%</td>
            <td className="py-3 tabular-nums">
              {formatMoney(
                Object.values(spent).reduce((a, b) => a + b, 0),
                budget.currency,
              )}
            </td>
          </tr>
        </tfoot>
      </table>

      <p
        aria-live="polite"
        className={`mt-4 rounded-lg border px-4 py-3 text-sm font-medium ${
          over
            ? "border-accent-deep/50 bg-accent/10 text-accent-deep"
            : "border-line bg-paper-deep text-ink"
        }`}
      >
        {over ? (
          <>
            <span aria-hidden className="mr-1.5 font-bold">
              ⚠
            </span>
            Over budget by {formatMoney(Math.abs(remaining), budget.currency)}
          </>
        ) : (
          <>Remaining budget: {formatMoney(remaining, budget.currency)}</>
        )}
      </p>
    </div>
  );
}
