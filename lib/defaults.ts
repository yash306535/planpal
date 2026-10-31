import type { EventType } from "@/lib/schema";

/**
 * Per-event-type defaults. Drives the mock planner, the hint categories sent to
 * the LLM, and the UI theming. Themes only swap the accent color + hero image.
 */
export interface EventTypeMeta {
  label: string;
  tagline: string;
  /** data-theme value applied on the plan view to swap the accent. */
  theme: EventType;
  budgetCategories: string[];
  vendorCategories: string[];
}

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  wedding: {
    label: "Wedding",
    tagline: "Two people, one unforgettable day.",
    theme: "wedding",
    budgetCategories: ["Venue", "Catering", "Photography", "Attire", "Music", "Decor"],
    vendorCategories: ["Venue", "Catering", "Photography", "Attire", "Music", "Florals"],
  },
  birthday: {
    label: "Birthday",
    tagline: "A day that's all about them.",
    theme: "birthday",
    budgetCategories: ["Venue", "Food", "Entertainment", "Cake", "Decor", "Invitations"],
    vendorCategories: ["Venue", "Catering", "Entertainment", "Bakery", "Decor"],
  },
  community: {
    label: "Community event",
    tagline: "Bring the whole neighborhood together.",
    theme: "community",
    budgetCategories: [
      "Permits",
      "Venue",
      "Sound",
      "Publicity",
      "Volunteers",
      "Supplies",
    ],
    vendorCategories: ["Permits", "Venue", "Sound & stage", "Publicity", "Volunteers"],
  },
};

export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "CAD",
  "AUD",
  "JPY",
  "SGD",
  "AED",
  "ZAR",
] as const;

export function eventTypeMeta(type: EventType): EventTypeMeta {
  return EVENT_TYPE_META[type];
}
