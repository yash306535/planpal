import { API_RATE_LIMIT, json, rateLimit, readJsonBody } from "@/lib/apiHelpers";
import { createRateLimiter } from "@/lib/rateLimit";
import { tavusRequestSchema, type TavusResponse } from "@/lib/schema";
import { createTavusConversation, getTavusConfig } from "@/lib/tavusClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter(API_RATE_LIMIT);

export async function POST(req: Request): Promise<Response> {
  const limited = rateLimit(req, limiter);
  if (limited) return limited;

  const body = await readJsonBody(req);
  const parsed = tavusRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input." }, 400);
  }

  const config = getTavusConfig();
  if (!config) {
    // Feature simply isn't configured — the rest of the app keeps working.
    return json(
      { error: "Live video planner isn't configured on this deployment." },
      503,
    );
  }

  try {
    const result: TavusResponse = await createTavusConversation(
      parsed.data.eventInput,
      parsed.data.planSummary,
      config,
    );
    // Return ONLY the conversation_url.
    return json(result, 200);
  } catch {
    console.error("Tavus conversation failed");
    return json({ error: "Couldn't start the video planner. Please try again." }, 502);
  }
}
