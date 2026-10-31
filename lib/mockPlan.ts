import { EVENT_TYPE_META } from "@/lib/defaults";
import type { EventInput, EventType, LlmPlan } from "@/lib/schema";

/**
 * Deterministic, offline plan generator. Used whenever keys are missing or
 * MOCK_MODE=true, and as the "Try an example" demo. Same shape as real LLM
 * output, so the rest of the pipeline (budget/timeline normalization) is
 * identical. Ideas visibly reflect the host's city and preferences.
 */

const BUDGET_PERCENTS: Record<EventType, number[]> = {
  // aligned to EVENT_TYPE_META[type].budgetCategories order; each row sums to 100
  wedding: [40, 22, 12, 10, 8, 8],
  birthday: [30, 25, 20, 10, 10, 5],
  community: [15, 25, 20, 15, 10, 15],
};

const TIMELINES: Record<
  EventType,
  { task: string; weeksBefore: number; category: string }[]
> = {
  wedding: [
    { task: "Book the venue and lock the date", weeksBefore: 52, category: "Venue" },
    {
      task: "Confirm the caterer and schedule a tasting",
      weeksBefore: 40,
      category: "Catering",
    },
    { task: "Reserve the photographer", weeksBefore: 36, category: "Photography" },
    { task: "Order attire and book first fitting", weeksBefore: 28, category: "Attire" },
    { task: "Send invitations", weeksBefore: 20, category: "Invitations" },
    { task: "Confirm music and build the playlist", weeksBefore: 12, category: "Music" },
    { task: "Give final headcount to the caterer", weeksBefore: 3, category: "Catering" },
    { task: "Wedding day", weeksBefore: 0, category: "Day-of" },
  ],
  birthday: [
    { task: "Pick and book the venue", weeksBefore: 10, category: "Venue" },
    { task: "Book entertainment", weeksBefore: 8, category: "Entertainment" },
    { task: "Send invitations", weeksBefore: 6, category: "Invitations" },
    { task: "Order the cake", weeksBefore: 4, category: "Cake" },
    { task: "Confirm food and drinks", weeksBefore: 2, category: "Food" },
    { task: "Buy decor and party supplies", weeksBefore: 1, category: "Decor" },
    { task: "Party day", weeksBefore: 0, category: "Day-of" },
  ],
  community: [
    { task: "Apply for permits and insurance", weeksBefore: 16, category: "Permits" },
    { task: "Confirm the venue or public space", weeksBefore: 12, category: "Venue" },
    { task: "Book sound and stage", weeksBefore: 10, category: "Sound" },
    { task: "Recruit and brief volunteers", weeksBefore: 8, category: "Volunteers" },
    { task: "Launch publicity", weeksBefore: 6, category: "Publicity" },
    { task: "Order supplies and signage", weeksBefore: 2, category: "Supplies" },
    { task: "Event day", weeksBefore: 0, category: "Day-of" },
  ],
};

const VENDORS: Record<EventType, { category: string; items: string[] }[]> = {
  wedding: [
    {
      category: "Venue",
      items: ["Tour 3 venues", "Confirm date & deposit", "Review the rain plan"],
    },
    {
      category: "Catering",
      items: ["Schedule a tasting", "Confirm dietary options", "Lock final headcount"],
    },
    {
      category: "Photography",
      items: ["Review portfolios", "Book engagement shoot", "Share the shot list"],
    },
    {
      category: "Attire",
      items: ["Order dress/suit", "Schedule fittings", "Arrange press & steam"],
    },
    {
      category: "Music",
      items: ["Book DJ or band", "Build do-not-play list", "Confirm first-dance song"],
    },
    {
      category: "Florals",
      items: ["Choose seasonal blooms", "Confirm bouquets", "Plan centerpieces"],
    },
  ],
  birthday: [
    {
      category: "Venue",
      items: ["Reserve the space", "Confirm setup time", "Check parking & access"],
    },
    {
      category: "Catering",
      items: ["Pick the menu", "Order drinks", "Confirm allergies"],
    },
    {
      category: "Entertainment",
      items: ["Book the act or DJ", "Prep a playlist", "Plan games"],
    },
    {
      category: "Bakery",
      items: ["Order the cake", "Confirm flavors", "Arrange pickup"],
    },
    {
      category: "Decor",
      items: ["Buy balloons & banners", "Set up a photo corner", "Order favors"],
    },
  ],
  community: [
    {
      category: "Permits",
      items: ["Submit event permit", "Confirm insurance", "Check noise rules"],
    },
    {
      category: "Venue",
      items: ["Reserve park or hall", "Arrange restrooms", "Plan accessibility"],
    },
    {
      category: "Sound & stage",
      items: ["Book PA system", "Confirm power", "Schedule sound check"],
    },
    {
      category: "Publicity",
      items: ["Design flyers", "Post to local groups", "Brief local press"],
    },
    {
      category: "Volunteers",
      items: ["Recruit a lead team", "Assign shifts", "Plan the check-in table"],
    },
  ],
};

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

type MockIdea = {
  title: string;
  description: string;
  tag: "theme" | "food" | "activity" | "decor";
};

function ideasFor(input: EventInput): MockIdea[] {
  const city = input.city;
  const pref = input.preferences.trim();
  const prefLine = pref ? ` We leaned into your notes — "${clip(pref, 90)}".` : "";

  const sets: Record<EventType, MockIdea[]> = {
    wedding: [
      {
        title: "Heirloom garden ceremony",
        tag: "theme",
        description: `A relaxed, green-and-ivory garden look that suits ${city} beautifully.${prefLine}`,
      },
      {
        title: "Family-style seasonal feast",
        tag: "food",
        description: `Shared platters of what's in season near ${city}, so tables feel generous and warm.`,
      },
      {
        title: "Golden-hour lawn games",
        tag: "activity",
        description: `Croquet and bocce while the light is soft — easy mingling before dinner in ${city}.`,
      },
      {
        title: "Pressed-flower table runners",
        tag: "decor",
        description:
          "Local blooms pressed into vellum runners; keepsakes guests can take home.",
      },
      {
        title: "Candlelit evening reception",
        tag: "theme",
        description: `Hundreds of warm candles for an intimate after-dark mood.${prefLine}`,
      },
      {
        title: "Handwritten vow corner",
        tag: "activity",
        description:
          "A quiet nook with heirloom paper where guests leave notes for the couple.",
      },
    ],
    birthday: [
      {
        title: "Citrus carnival",
        tag: "theme",
        description: `Bright lemon-and-tangerine color pop, scaled for ${input.guests} guests.${prefLine}`,
      },
      {
        title: "Build-your-own taco bar",
        tag: "food",
        description: `Crowd-pleasing, customizable, and easy to source in ${city}.`,
      },
      {
        title: "Backyard cinema",
        tag: "activity",
        description: "A projector, string lights, and a stack of blankets after sundown.",
      },
      {
        title: "Sunrise balloon arch",
        tag: "decor",
        description: "A gradient balloon arch as the photo backdrop and entrance moment.",
      },
      {
        title: `${city} rooftop party`,
        tag: "theme",
        description: `Golden-hour skyline views with a simple grazing table.${prefLine}`,
      },
      {
        title: "Polaroid scavenger hunt",
        tag: "activity",
        description: "Printed prompt cards and instant cameras keep every age busy.",
      },
    ],
    community: [
      {
        title: "Neighborhood harvest fair",
        tag: "theme",
        description: `A warm, earthy market feel that invites all of ${city} to join.${prefLine}`,
      },
      {
        title: "Potluck world kitchen",
        tag: "food",
        description: `Residents bring a dish from home — a map of ${city}'s cultures on one table.`,
      },
      {
        title: "Skill-swap workshops",
        tag: "activity",
        description: "Short hands-on sessions — repair, grow, cook — led by neighbors.",
      },
      {
        title: "Hand-painted welcome banners",
        tag: "decor",
        description:
          "A pre-event painting session doubles as decor and community building.",
      },
      {
        title: `${city} green commons day`,
        tag: "theme",
        description: `Reusable signage and a zero-waste station keep it sustainable.${prefLine}`,
      },
      {
        title: "Volunteer appreciation wall",
        tag: "activity",
        description:
          "A visible thank-you board so helpers feel the impact of their time.",
      },
    ],
  };

  return sets[input.type];
}

export function mockLlmPlan(input: EventInput): LlmPlan {
  const meta = EVENT_TYPE_META[input.type];
  const percents = BUDGET_PERCENTS[input.type];

  return {
    budget: meta.budgetCategories.map((category, i) => ({
      category,
      percent: percents[i] ?? 0,
    })),
    timeline: TIMELINES[input.type],
    vendors: VENDORS[input.type],
    ideas: ideasFor(input),
  };
}
