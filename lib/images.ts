import type { EventType, IdeaTag } from "@/lib/schema";

/**
 * Curated Unsplash imagery. All URLs are request-resized (`w`, `q=70`,
 * `auto=format`) for efficiency, and every image carries alt text + a credit
 * link shown in the footer. Any image that fails to load falls back to a local
 * themed SVG (see components/SmartImage.tsx), so the layout never breaks.
 *
 * Photographer names vary per photo on Unsplash; we link each photo's page and
 * credit "Unsplash" generically rather than risk misattribution.
 */
export interface UnsplashImage {
  url: string;
  alt: string;
  credit: string;
  link: string;
}

function unsplash(id: string, width = 1000): string {
  return `https://images.unsplash.com/${id}?w=${width}&q=70&auto=format&fit=crop`;
}

function photoLink(id: string): string {
  // strip the trailing slug → canonical photo page
  return `https://unsplash.com/photos/${id.replace(/^photo-/, "")}`;
}

function image(id: string, alt: string, width = 1000): UnsplashImage {
  return { url: unsplash(id, width), alt, credit: "Unsplash", link: photoLink(id) };
}

export const HERO_IMAGES: UnsplashImage[] = [
  image(
    "photo-1519741497674-611481863552",
    "A long banquet table set for a celebration",
    1100,
  ),
  image(
    "photo-1464366400600-7168b8af9bc3",
    "Soft floral table styling in warm light",
    800,
  ),
  image("photo-1530103862676-de8c9debad1d", "Sparklers held up at an evening party", 800),
];

export const EVENT_TYPE_IMAGES: Record<EventType, UnsplashImage> = {
  wedding: image(
    "photo-1519225421980-715cb0215aed",
    "A couple at an outdoor wedding ceremony",
    900,
  ),
  birthday: image(
    "photo-1464349153735-7db50ed83c84",
    "Colorful balloons for a birthday party",
    900,
  ),
  community: image(
    "photo-1540575467063-178a50c2df87",
    "A crowd gathered at a community event",
    900,
  ),
};

export const IDEA_TAG_IMAGES: Record<IdeaTag, UnsplashImage> = {
  theme: image(
    "photo-1478146896981-b80fe463b330",
    "Festive string lights and confetti",
    800,
  ),
  food: image(
    "photo-1504674900247-0877df9cc836",
    "A generous spread of shared dishes",
    800,
  ),
  activity: image(
    "photo-1529156069898-49953e39b3ac",
    "People laughing together at a party",
    800,
  ),
  decor: image(
    "photo-1522673607200-164d1b6ce486",
    "Fresh seasonal flowers arranged for decor",
    800,
  ),
};

/** De-duplicated list of every credited photo, for the footer. */
export const IMAGE_CREDITS: UnsplashImage[] = (() => {
  const all = [
    ...HERO_IMAGES,
    ...Object.values(EVENT_TYPE_IMAGES),
    ...Object.values(IDEA_TAG_IMAGES),
  ];
  const seen = new Set<string>();
  return all.filter((img) => (seen.has(img.link) ? false : (seen.add(img.link), true)));
})();
