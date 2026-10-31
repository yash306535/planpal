import { z } from "zod";

/**
 * Single source of truth. Every runtime boundary (form, API request bodies,
 * LLM output, API responses) is validated with these zod schemas, and all
 * shared types are inferred from them — never hand-written.
 */

// ---------- enums ----------

export const EVENT_TYPES = ["wedding", "birthday", "community"] as const;
export const eventTypeSchema = z.enum(EVENT_TYPES);
export type EventType = z.infer<typeof eventTypeSchema>;

export const IDEA_TAGS = ["theme", "food", "activity", "decor"] as const;
export const ideaTagSchema = z.enum(IDEA_TAGS);
export type IdeaTag = z.infer<typeof ideaTagSchema>;

// ---------- event input (the form) ----------

const currencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code, e.g. USD")
  .transform((s) => s.toUpperCase());

const eventDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
  // Reject impossible calendar dates like 2026-02-30. Date rolls such values
  // over (→ March 2), so we round-trip the parts and require them to match.
  .refine((s) => {
    const [y, m, d] = s.split("-").map((n) => Number(n));
    if (y === undefined || m === undefined || d === undefined) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
    );
  }, "Pick a valid date");

export const eventInputSchema = z.object({
  type: eventTypeSchema,
  name: z
    .string()
    .trim()
    .min(1, "Give your event a name")
    .max(100, "Keep the name under 100 characters"),
  date: eventDateSchema,
  guests: z.coerce
    .number({ invalid_type_error: "Guests must be a number" })
    .int("Guests must be a whole number")
    .min(1, "At least 1 guest")
    .max(10000, "Up to 10,000 guests"),
  budget: z.coerce
    .number({ invalid_type_error: "Budget must be a number" })
    .positive("Budget must be greater than 0")
    .max(1_000_000_000, "That budget looks too large"),
  currency: currencySchema,
  city: z
    .string()
    .trim()
    .min(1, "Which city?")
    .max(100, "Keep the city under 100 characters"),
  preferences: z
    .string()
    .trim()
    .max(500, "Keep preferences under 500 characters")
    .default(""),
});
export type EventInput = z.infer<typeof eventInputSchema>;

// ---------- LLM output contract ----------

export const llmBudgetItemSchema = z.object({
  category: z.string().trim().min(1).max(60),
  percent: z.number().min(0).max(100),
});
export const llmTimelineItemSchema = z.object({
  task: z.string().trim().min(1).max(160),
  weeksBefore: z.number().min(0).max(260),
  category: z.string().trim().min(1).max(60),
});
export const llmVendorGroupSchema = z.object({
  category: z.string().trim().min(1).max(60),
  items: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
});
export const llmIdeaSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(400),
  tag: ideaTagSchema,
});
export const llmPlanSchema = z.object({
  budget: z.array(llmBudgetItemSchema).min(2).max(12),
  timeline: z.array(llmTimelineItemSchema).min(3).max(24),
  vendors: z.array(llmVendorGroupSchema).min(2).max(10),
  ideas: z.array(llmIdeaSchema).min(6).max(8),
});
export type LlmPlan = z.infer<typeof llmPlanSchema>;
export type LlmBudgetItem = z.infer<typeof llmBudgetItemSchema>;
export type LlmTimelineItem = z.infer<typeof llmTimelineItemSchema>;
export type LlmIdea = z.infer<typeof llmIdeaSchema>;

// ---------- computed plan (derived locally, what the UI consumes) ----------

export const budgetRowSchema = z.object({
  category: z.string(),
  percent: z.number(), // normalized integer, rows sum to 100
  amount: z.number(), // integer currency units, rows sum exactly to total
});
export const timelineMilestoneSchema = z.object({
  task: z.string(),
  category: z.string(),
  weeksBefore: z.number(),
  date: z.string(), // YYYY-MM-DD
  overdue: z.boolean(),
});
export const computedPlanSchema = z.object({
  budget: z.object({
    rows: z.array(budgetRowSchema),
    total: z.number(),
    currency: z.string(),
  }),
  timeline: z.array(timelineMilestoneSchema),
  vendors: z.array(llmVendorGroupSchema),
  ideas: z.array(llmIdeaSchema),
});
export type ComputedPlan = z.infer<typeof computedPlanSchema>;
export type BudgetRow = z.infer<typeof budgetRowSchema>;
export type TimelineMilestone = z.infer<typeof timelineMilestoneSchema>;
export type VendorGroup = z.infer<typeof llmVendorGroupSchema>;
export type Idea = z.infer<typeof llmIdeaSchema>;

// ---------- API request / response contracts ----------

export const planRequestSchema = eventInputSchema;

export const planResponseSchema = z.object({
  plan: computedPlanSchema,
  source: z.enum(["llm", "mock"]),
});
export type PlanResponse = z.infer<typeof planResponseSchema>;

export const tavusRequestSchema = z.object({
  eventInput: eventInputSchema,
  planSummary: z.string().trim().max(600).optional(),
});
export type TavusRequest = z.infer<typeof tavusRequestSchema>;

export const tavusResponseSchema = z.object({
  conversation_url: z.string().url(),
});
export type TavusResponse = z.infer<typeof tavusResponseSchema>;

export const errorResponseSchema = z.object({ error: z.string() });
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
