import type { EventInput } from "@/lib/schema";

/**
 * Pure builders for the Tavus conversation. Kept separate from the network call
 * (lib/tavusClient.ts) so the prompt/context construction is unit-testable and
 * contains no secrets.
 */

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Short, human conversation name shown in the Tavus dashboard. */
export function buildConversationName(input: EventInput): string {
  return clip(`PlanPal — ${input.name}`, 80);
}

/**
 * The `conversational_context` handed to the planner persona so the live video
 * conversation already knows the event. Built only from validated event data
 * plus an optional one-line plan summary.
 */
export function buildTavusContext(input: EventInput, planSummary?: string): string {
  const parts = [
    "You are PlanPal, a warm and practical event planner talking live with the host over video.",
    `They are planning a ${input.type} called "${input.name}".`,
    `Date: ${input.date}. City: ${input.city}.`,
    `Guest count: ${input.guests}. Total budget: ${input.budget} ${input.currency}.`,
    input.preferences
      ? `The host's style and preferences: ${clip(input.preferences, 500)}`
      : "The host hasn't shared specific style notes yet.",
    planSummary
      ? `A plan has already been drafted — summary: ${clip(planSummary, 500)}`
      : "",
    `Open by referencing their ${input.type} in ${input.city}, keep answers concise, and suggest concrete next steps.`,
  ].filter((p) => p.length > 0);

  return parts.join(" ");
}
