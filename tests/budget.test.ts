import { describe, it, expect } from "vitest";
import {
  normalizePercents,
  computeBudgetRows,
  sumSpent,
  remainingBudget,
} from "@/lib/budget";
import type { LlmBudgetItem } from "@/lib/schema";

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

function items(...weights: number[]): LlmBudgetItem[] {
  return weights.map((w, i) => ({ category: `cat${i}`, percent: w }));
}

describe("normalizePercents", () => {
  it("keeps a clean 100-sum distribution", () => {
    const out = normalizePercents(items(40, 22, 12, 10, 8, 8));
    expect(out.map((o) => o.percent)).toEqual([40, 22, 12, 10, 8, 8]);
  });

  it("normalizes arbitrary weights to sum exactly 100", () => {
    const out = normalizePercents(items(1, 1, 1));
    expect(sum(out.map((o) => o.percent))).toBe(100);
    expect(out.map((o) => o.percent)).toEqual([34, 33, 33]); // largest-remainder
  });

  it("distributes evenly when all weights are zero", () => {
    const out = normalizePercents(items(0, 0, 0, 0));
    expect(out.map((o) => o.percent)).toEqual([25, 25, 25, 25]);
  });

  it("handles a single category", () => {
    expect(normalizePercents(items(5))).toEqual([{ category: "cat0", percent: 100 }]);
  });

  it("preserves category names and order", () => {
    const out = normalizePercents([
      { category: "Venue", percent: 50 },
      { category: "Food", percent: 50 },
    ]);
    expect(out.map((o) => o.category)).toEqual(["Venue", "Food"]);
  });
});

describe("computeBudgetRows", () => {
  it("produces integer amounts that sum exactly to the total", () => {
    const rows = computeBudgetRows(items(1, 1, 1), 10000);
    expect(rows.map((r) => r.amount)).toEqual([3334, 3333, 3333]);
    expect(sum(rows.map((r) => r.amount))).toBe(10000);
    expect(rows.every((r) => Number.isInteger(r.amount))).toBe(true);
  });

  it("rounds a fractional total and still sums exactly", () => {
    const rows = computeBudgetRows(items(1, 1), 999.6); // rounds to 1000
    expect(sum(rows.map((r) => r.amount))).toBe(1000);
    expect(rows.map((r) => r.amount)).toEqual([500, 500]);
  });

  it("allocates realistic wedding splits that reconcile", () => {
    const rows = computeBudgetRows(items(40, 22, 12, 10, 8, 8), 25000);
    expect(sum(rows.map((r) => r.amount))).toBe(25000);
    expect(sum(rows.map((r) => r.percent))).toBe(100);
    expect(rows[0]!.amount).toBe(10000); // 40% of 25000
  });

  it("never produces negative amounts for a zero total", () => {
    const rows = computeBudgetRows(items(3, 1), 0);
    expect(rows.map((r) => r.amount)).toEqual([0, 0]);
  });
});

describe("spent / remaining", () => {
  it("sums only finite spent values", () => {
    expect(sumSpent({ a: 200, b: 300, c: undefined, d: NaN })).toBe(500);
  });

  it("computes remaining budget and goes negative when over", () => {
    expect(remainingBudget(1000, { a: 200, b: 300 })).toBe(500);
    expect(remainingBudget(1000, { a: 800, b: 400 })).toBe(-200);
  });
});
