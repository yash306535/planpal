import { API_RATE_LIMIT, json, rateLimit, readJsonBody } from "@/lib/apiHelpers";
import { computeBudgetRows } from "@/lib/budget";
import { getLlmClient } from "@/lib/llm";
import { createRateLimiter } from "@/lib/rateLimit";
import { planRequestSchema, type ComputedPlan, type PlanResponse } from "@/lib/schema";
import { buildTimeline } from "@/lib/timeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter(API_RATE_LIMIT);

export async function POST(req: Request): Promise<Response> {
  const limited = rateLimit(req, limiter);
  if (limited) return limited;

  const body = await readJsonBody(req);
  const parsed = planRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input." }, 400);
  }
  const input = parsed.data;

  const client = getLlmClient();
  let llmPlan;
  try {
    llmPlan = await client.generatePlan(input);
  } catch {
    // Generic message only — never leak upstream details or event data.
    console.error("Plan generation failed");
    return json(
      { error: "We couldn't generate your plan right now. Please try again." },
      502,
    );
  }

  // All exact numbers are derived locally — we never trust the model's math.
  const plan: ComputedPlan = {
    budget: {
      rows: computeBudgetRows(llmPlan.budget, input.budget),
      total: Math.round(input.budget),
      currency: input.currency,
    },
    timeline: buildTimeline(llmPlan.timeline, input.date),
    vendors: llmPlan.vendors,
    ideas: llmPlan.ideas,
  };

  const payload: PlanResponse = { plan, source: client.source };
  return json(payload, 200);
}
