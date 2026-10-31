"use client";

import { IDEA_TAG_IMAGES } from "@/lib/images";
import { SmartImage } from "@/components/SmartImage";
import type { ComputedPlan } from "@/lib/schema";

const TAG_LABEL: Record<string, string> = {
  theme: "Theme",
  food: "Food",
  activity: "Activity",
  decor: "Decor",
};

export function IdeasTab({ ideas }: { ideas: ComputedPlan["ideas"] }) {
  return (
    <ul className="animate-fade-up columns-1 gap-5 sm:columns-2 lg:columns-3">
      {ideas.map((idea, i) => {
        const img = IDEA_TAG_IMAGES[idea.tag];
        return (
          <li
            key={`${idea.title}-${i}`}
            className="mb-5 break-inside-avoid overflow-hidden rounded-xl border border-line bg-paper-deep"
          >
            <div className="relative h-40 w-full overflow-hidden">
              <SmartImage
                src={img.url}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-0.5 text-xs font-semibold text-accent-deep">
                {TAG_LABEL[idea.tag] ?? idea.tag}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-serif text-lg font-semibold leading-snug">
                {idea.title}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">{idea.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
