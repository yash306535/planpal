"use client";

import { useEffect, useState } from "react";
import { EventForm } from "@/components/EventForm";
import { PlanView } from "@/components/PlanView";
import { SmartImage } from "@/components/SmartImage";
import { hashObject } from "@/lib/hash";
import { HERO_IMAGES } from "@/lib/images";
import {
  clearCurrent,
  loadCurrentHash,
  loadPlan,
  saveCurrentHash,
  savePlan,
} from "@/lib/storage";
import {
  planResponseSchema,
  type ComputedPlan,
  type EventInput,
  type EventType,
} from "@/lib/schema";

interface Current {
  input: EventInput;
  plan: ComputedPlan;
  source: "llm" | "mock";
  hash: string;
}

const HERO_FRAMES = [
  "left-0 top-6 h-56 w-44 -rotate-3 frame-arch sm:h-64 sm:w-52",
  "right-2 top-0 h-52 w-40 rotate-3 frame-soft sm:h-60 sm:w-48",
  "bottom-0 right-10 h-44 w-36 -rotate-2 frame-soft sm:h-48 sm:w-44",
];

const STEPS = [
  { n: "01", label: "Tell us the essentials — the date comes first." },
  { n: "02", label: "Get a budget, timeline, vendors and ideas in seconds." },
  { n: "03", label: "Talk it through with a planner on live video." },
];

export default function Home() {
  const [current, setCurrent] = useState<Current | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore the last plan from localStorage after mount.
  useEffect(() => {
    const hash = loadCurrentHash();
    if (!hash) return;
    const saved = loadPlan(hash);
    if (saved) {
      setCurrent({
        input: saved.input,
        plan: saved.plan,
        source: saved.source,
        hash: saved.hash,
      });
    }
  }, []);

  function previewTheme(type: EventType) {
    document.documentElement.setAttribute("data-theme", type);
  }

  async function handleSubmit(input: EventInput) {
    setError(null);
    const hash = hashObject(input);

    // Cache hit → reuse the last result, no network call.
    const cached = loadPlan(hash);
    if (cached) {
      saveCurrentHash(hash);
      setCurrent({ input: cached.input, plan: cached.plan, source: cached.source, hash });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You appear to be offline. Reconnect to generate a new plan.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      if (res.status === 429) {
        setError("That's a lot of plans at once — please wait a moment and try again.");
        return;
      }
      if (!res.ok) {
        setError("We couldn't generate your plan right now. Please try again.");
        return;
      }

      const parsed = planResponseSchema.safeParse(await res.json());
      if (!parsed.success) {
        setError("We received an unexpected response. Please try again.");
        return;
      }

      const session = { hash, input, plan: parsed.data.plan, source: parsed.data.source };
      savePlan(session);
      saveCurrentHash(hash);
      setCurrent(session);
    } catch {
      setError("Something went wrong reaching the planner. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    clearCurrent();
    setCurrent(null);
    setError(null);
    setLoading(false);
    document.documentElement.removeAttribute("data-theme");
  }

  if (current) {
    return (
      <PlanView
        input={current.input}
        plan={current.plan}
        source={current.source}
        hash={current.hash}
        onStartOver={startOver}
      />
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 pt-10 sm:px-6 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="font-serif text-4xl font-black leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
              Plan the{" "}
              <span className="relative inline-block">
                day
                <svg
                  aria-hidden
                  viewBox="0 0 120 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-3 w-full text-accent"
                >
                  <path
                    d="M2 9 C 30 3, 60 12, 90 6 S 116 7, 118 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              , not the spreadsheet.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              A few details become a budget that adds up, a timeline that counts back from
              the big day, a vendor checklist, and ideas made for your city — then you can
              talk it through with a planner on video.
            </p>
            <ol className="mt-7 space-y-2.5">
              {STEPS.map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="font-sans text-sm font-bold text-accent-deep">
                    {step.n}
                  </span>
                  <span className="text-ink">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mx-auto h-[360px] w-full max-w-md sm:h-[440px]">
            {HERO_IMAGES.map((img, i) => (
              <div
                key={img.url}
                className={`absolute overflow-hidden border border-line shadow-sm ${HERO_FRAMES[i] ?? ""}`}
              >
                <SmartImage
                  src={img.url}
                  alt={i === 0 ? img.alt : ""}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 640px) 55vw, 220px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold">Start your plan</h2>
          <p className="mt-1 text-ink-soft">
            No account, no keys needed — try the example to see a full plan instantly.
          </p>
        </div>
        <EventForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          onTypeChange={previewTheme}
        />
      </section>
    </>
  );
}
