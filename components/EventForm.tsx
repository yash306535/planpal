"use client";

import { useRef, useState, type FormEvent } from "react";
import { EVENT_TYPE_META, CURRENCIES } from "@/lib/defaults";
import { EVENT_TYPE_IMAGES } from "@/lib/images";
import {
  eventInputSchema,
  EVENT_TYPES,
  type EventInput,
  type EventType,
} from "@/lib/schema";
import { SmartImage } from "@/components/SmartImage";

interface FormState {
  type: EventType;
  name: string;
  date: string;
  guests: string;
  budget: string;
  currency: string;
  city: string;
  preferences: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  type: "wedding",
  name: "",
  date: "",
  guests: "",
  budget: "",
  currency: "USD",
  city: "",
  preferences: "",
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeExample(type: EventType): FormState {
  const examples: Record<EventType, FormState> = {
    wedding: {
      type: "wedding",
      name: "Maya & Leo",
      date: addDaysISO(240),
      guests: "120",
      budget: "28000",
      currency: "USD",
      city: "Lisbon",
      preferences: "garden ceremony, candlelit dinner, sustainable, earthy greens",
    },
    birthday: {
      type: "birthday",
      name: "Mia turns 8",
      date: addDaysISO(45),
      guests: "25",
      budget: "1200",
      currency: "USD",
      city: "Austin",
      preferences: "dinosaurs, citrus colors, backyard, early afternoon",
    },
    community: {
      type: "community",
      name: "Riverside Spring Fair",
      date: addDaysISO(90),
      guests: "400",
      budget: "9000",
      currency: "USD",
      city: "Portland",
      preferences: "family friendly, local makers, live music, zero waste",
    },
  };
  return examples[type];
}

interface EventFormProps {
  onSubmit: (input: EventInput) => void;
  loading: boolean;
  error?: string | null;
  onTypeChange?: (type: EventType) => void;
}

export function EventForm({ onSubmit, loading, error, onTypeChange }: EventFormProps) {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [summary, setSummary] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validateAndSubmit(candidate: FormState) {
    const result = eventInputSchema.safeParse(candidate);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as keyof FormState] = issue.message;
        }
      }
      setErrors(next);
      const count = Object.keys(next).length;
      setSummary(
        `${count} ${count === 1 ? "field needs" : "fields need"} your attention.`,
      );
      // Move focus to the first field with a problem.
      const firstKey = Object.keys(next)[0];
      if (firstKey) {
        formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      }
      return;
    }
    setErrors({});
    setSummary("");
    onSubmit(result.data);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validateAndSubmit(values);
  }

  function handleExample() {
    const example = makeExample(values.type);
    setValues(example);
    onTypeChange?.(example.type);
    validateAndSubmit(example);
  }

  function describedBy(field: keyof FormState, hasHint: boolean): string | undefined {
    const ids = [hasHint ? `${field}-hint` : "", errors[field] ? `${field}-error` : ""]
      .filter(Boolean)
      .join(" ");
    return ids || undefined;
  }

  const fieldError = (field: keyof FormState) =>
    errors[field] ? (
      <p
        id={`${field}-error`}
        className="mt-1.5 flex items-center gap-1.5 text-sm text-accent-deep"
      >
        <span aria-hidden className="font-bold">
          ⚠
        </span>
        <span>{errors[field]}</span>
      </p>
    ) : null;

  const inputClass =
    "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-ink shadow-sm placeholder:text-ink-soft/60 focus-visible:border-accent-deep";

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Event type */}
      <fieldset>
        <legend className="mb-3 font-serif text-lg font-semibold">
          <span className="mr-2 font-sans text-sm font-bold text-accent-deep">01</span>
          What are we planning?
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {EVENT_TYPES.map((type) => {
            const meta = EVENT_TYPE_META[type];
            const img = EVENT_TYPE_IMAGES[type];
            const checked = values.type === type;
            return (
              <label
                key={type}
                className="group relative block cursor-pointer overflow-hidden rounded-xl border border-line bg-paper-deep"
              >
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={checked}
                  onChange={() => {
                    set("type", type);
                    onTypeChange?.(type);
                  }}
                  className="peer sr-only"
                />
                <span className="relative block h-28 w-full overflow-hidden">
                  <SmartImage
                    src={img.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </span>
                <span className="block px-3 py-2.5">
                  <span className="flex items-center justify-between">
                    <span className="font-serif text-base font-semibold">
                      {meta.label}
                    </span>
                    <span
                      aria-hidden
                      className={`grid h-5 w-5 place-items-center rounded-full border text-xs ${
                        checked
                          ? "border-accent-deep bg-accent-deep text-paper"
                          : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    {meta.tagline}
                  </span>
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-accent-deep peer-checked:ring-2 peer-focus-visible:ring-2" />
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Details */}
      <div className="space-y-5">
        <h2 className="font-serif text-lg font-semibold">
          <span className="mr-2 font-sans text-sm font-bold text-accent-deep">02</span>
          The essentials
        </h2>

        <div>
          <label htmlFor="name" className="mb-1 block font-medium">
            Event name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            maxLength={100}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name", true)}
            className={inputClass}
            placeholder="e.g. Maya & Leo"
          />
          <p id="name-hint" className="mt-1 text-sm text-ink-soft">
            What should we call it?
          </p>
          {fieldError("name")}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="mb-1 block font-medium">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={describedBy("date", true)}
              className={inputClass}
            />
            <p id="date-hint" className="mt-1 text-sm text-ink-soft">
              Let&rsquo;s start here — everything else bends around it.
            </p>
            {fieldError("date")}
          </div>

          <div>
            <label htmlFor="city" className="mb-1 block font-medium">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={values.city}
              maxLength={100}
              onChange={(e) => set("city", e.target.value)}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={describedBy("city", true)}
              className={inputClass}
              placeholder="e.g. Lisbon"
            />
            <p id="city-hint" className="mt-1 text-sm text-ink-soft">
              Helps us tailor ideas and vendors.
            </p>
            {fieldError("city")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="guests" className="mb-1 block font-medium">
              Guests
            </label>
            <input
              id="guests"
              name="guests"
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              value={values.guests}
              onChange={(e) => set("guests", e.target.value)}
              aria-invalid={Boolean(errors.guests)}
              aria-describedby={describedBy("guests", true)}
              className={inputClass}
              placeholder="e.g. 120"
            />
            <p id="guests-hint" className="mt-1 text-sm text-ink-soft">
              A rough headcount is fine.
            </p>
            {fieldError("guests")}
          </div>

          <div>
            <span className="mb-1 block font-medium" id="budget-group-label">
              Total budget
            </span>
            <div className="flex gap-2" role="group" aria-labelledby="budget-group-label">
              <input
                id="budget"
                name="budget"
                type="number"
                inputMode="decimal"
                min={1}
                value={values.budget}
                onChange={(e) => set("budget", e.target.value)}
                aria-invalid={Boolean(errors.budget)}
                aria-describedby={describedBy("budget", false)}
                aria-label="Budget amount"
                className={inputClass}
                placeholder="e.g. 28000"
              />
              <label htmlFor="currency" className="sr-only">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={values.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-2.5 text-ink shadow-sm focus-visible:border-accent-deep"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {fieldError("budget")}
          </div>
        </div>

        <div>
          <label htmlFor="preferences" className="mb-1 block font-medium">
            Style &amp; preferences
          </label>
          <textarea
            id="preferences"
            name="preferences"
            rows={3}
            maxLength={500}
            value={values.preferences}
            onChange={(e) => set("preferences", e.target.value)}
            aria-invalid={Boolean(errors.preferences)}
            aria-describedby={describedBy("preferences", true)}
            className={`${inputClass} resize-y`}
            placeholder="Colors, vibe, must-haves, anything to avoid…"
          />
          <p id="preferences-hint" className="mt-1 text-sm text-ink-soft">
            {values.preferences.length}/500 — the more you share, the more tailored the
            ideas.
          </p>
          {fieldError("preferences")}
        </div>
      </div>

      {/* Live region: validation summary + API errors announced politely. */}
      <div aria-live="polite" className="space-y-3">
        {summary ? (
          <p className="rounded-lg border border-accent-deep/40 bg-accent/10 px-3 py-2 text-sm text-accent-deep">
            <span aria-hidden className="mr-1.5 font-bold">
              ⚠
            </span>
            {summary}
          </p>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-accent-deep/40 bg-accent/10 px-3 py-3 text-sm text-ink">
            <p className="mb-2 font-medium text-accent-deep">
              <span aria-hidden className="mr-1.5 font-bold">
                ⚠
              </span>
              {error}
            </p>
            <button
              type="button"
              onClick={() => validateAndSubmit(values)}
              className="rounded-md border border-accent-deep px-3 py-1.5 font-semibold text-accent-deep hover:bg-accent-deep hover:text-paper"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-deep px-5 py-3 font-semibold text-paper shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Planning…" : "Make my plan"}
        </button>
        <button
          type="button"
          onClick={handleExample}
          disabled={loading}
          className="rounded-lg border border-ink/20 px-5 py-3 font-semibold text-ink transition hover:border-ink/40 disabled:opacity-60"
        >
          Try an example
        </button>
      </div>
    </form>
  );
}
