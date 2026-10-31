import type { BudgetRow, LlmBudgetItem } from "@/lib/schema";

/**
 * Budget math — pure, deterministic, UI-independent.
 *
 * The LLM only supplies rough category weights; all exact numbers are derived
 * here so we never trust the model's arithmetic:
 *  - normalizePercents → integer percents that sum to exactly 100
 *  - computeBudgetRows → integer currency amounts that sum to exactly the total
 *
 * Both use the largest-remainder method so rounding never loses or invents money.
 */

/** Largest-remainder allocation of `target` units across non-negative `weights`. */
function allocate(weights: number[], target: number): number[] {
  const n = weights.length;
  if (n === 0) return [];

  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  // If every weight is zero, distribute as evenly as possible.
  const shares =
    sum > 0 ? safe.map((w) => (w / sum) * target) : safe.map(() => target / n);

  const floors = shares.map((s) => Math.floor(s));
  const assigned = floors.reduce((a, b) => a + b, 0);
  const remainder = Math.round(target) - assigned;

  const byFraction = shares
    .map((s, i) => ({ i, frac: s - Math.floor(s) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < remainder; k += 1) {
    const pick = byFraction[k % byFraction.length];
    if (!pick) break;
    result[pick.i] = (result[pick.i] ?? 0) + 1;
  }
  return result;
}

/** Normalize arbitrary category weights to integer percents summing to exactly 100. */
export function normalizePercents(
  items: readonly LlmBudgetItem[],
): { category: string; percent: number }[] {
  const percents = allocate(
    items.map((it) => it.percent),
    100,
  );
  return items.map((it, i) => ({ category: it.category, percent: percents[i] ?? 0 }));
}

/** Allocate a total budget across categories; amounts are integers summing to the total. */
export function computeBudgetRows(
  items: readonly LlmBudgetItem[],
  total: number,
): BudgetRow[] {
  const totalUnits = Math.max(0, Math.round(total));
  const percents = normalizePercents(items);
  const amounts = allocate(
    items.map((it) => it.percent),
    totalUnits,
  );
  return percents.map((p, i) => ({
    category: p.category,
    percent: p.percent,
    amount: amounts[i] ?? 0,
  }));
}

/** Sum of "actual spent" entries, ignoring blanks / non-numbers. */
export function sumSpent(spentByCategory: Record<string, number | undefined>): number {
  return Object.values(spentByCategory).reduce<number>(
    (acc, v) => acc + (typeof v === "number" && Number.isFinite(v) ? v : 0),
    0,
  );
}

/** Remaining budget = total − actual spent (can go negative when over budget). */
export function remainingBudget(
  total: number,
  spentByCategory: Record<string, number | undefined>,
): number {
  return Math.round(total) - sumSpent(spentByCategory);
}
