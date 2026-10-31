import { llmPlanSchema, type LlmPlan } from "@/lib/schema";

/**
 * Turn raw model output into a validated LlmPlan, or fail cleanly. Pure so it
 * can be unit-tested without the network. The API route calls this and retries
 * once before failing safely.
 */

export type ParseResult = { ok: true; plan: LlmPlan } | { ok: false; error: string };

/** Isolate a JSON object from text that may be fenced or wrapped in prose. */
export function extractJson(text: string): string {
  let t = text.trim();

  // Strip a surrounding ```json ... ``` (or plain ``` ... ```) fence.
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) t = fence[1].trim();

  // Fall back to the outermost { ... } span.
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last > first) t = t.slice(first, last + 1);

  return t;
}

/** Parse + validate. Accepts either a raw string or an already-parsed value. */
export function parsePlan(input: unknown): ParseResult {
  let candidate: unknown = input;

  if (typeof input === "string") {
    try {
      candidate = JSON.parse(extractJson(input));
    } catch {
      return { ok: false, error: "Model output was not valid JSON" };
    }
  }

  const result = llmPlanSchema.safeParse(candidate);
  if (!result.success) {
    return { ok: false, error: "Model output did not match the plan schema" };
  }
  return { ok: true, plan: result.data };
}
