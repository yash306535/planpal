import { buildConversationName, buildTavusContext } from "@/lib/tavus";
import { tavusResponseSchema, type EventInput, type TavusResponse } from "@/lib/schema";

/**
 * Network adapter for the Tavus Conversational Video Interface. Isolated here so
 * the request shape is easy to correct and secrets never reach the client — only
 * the resulting conversation_url is returned.
 */

export interface TavusConfig {
  apiKey: string;
  replicaId: string;
  personaId: string;
}

const TAVUS_ENDPOINT = "https://tavusapi.com/v2/conversations";
const REQUEST_TIMEOUT_MS = 15_000;

/** Read Tavus config from env; null means the feature is simply not configured. */
export function getTavusConfig(): TavusConfig | null {
  const apiKey = process.env.TAVUS_API_KEY?.trim();
  const replicaId = process.env.TAVUS_REPLICA_ID?.trim();
  const personaId = process.env.TAVUS_PERSONA_ID?.trim();
  if (!apiKey || !replicaId || !personaId) return null;
  return { apiKey, replicaId, personaId };
}

export async function createTavusConversation(
  input: EventInput,
  planSummary: string | undefined,
  config: TavusConfig,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<TavusResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(TAVUS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        replica_id: config.replicaId,
        persona_id: config.personaId,
        conversation_name: buildConversationName(input),
        conversational_context: buildTavusContext(input, planSummary),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Tavus request failed with status ${response.status}`);
    }

    const data: unknown = await response.json();
    const parsed = tavusResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Tavus response did not include a conversation_url");
    }
    // Return ONLY the conversation_url — never echo keys or raw upstream data.
    return parsed.data;
  } finally {
    clearTimeout(timer);
  }
}
