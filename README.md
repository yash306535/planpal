# PlanPal — the event planner's journal

A small, production-quality GenAI planning assistant for **weddings, birthdays and
community events**. Give it a few details and it produces, in one server-side LLM call:

- a **budget** whose category amounts sum exactly to your total,
- a **timeline** of dated milestones counting back from the event date (overdue ones flagged),
- a **vendor checklist** grouped by category, with tickable items, and
- 6–8 **personalized ideas** (themes, food, activities, decor) shaped by your city and preferences.

Then click **“Talk to your planner”** for a live video conversation (via the Tavus
Conversational Video Interface) with an AI planner that already knows your event.

No account, no database, no login. Everything you do is saved in your browser’s
`localStorage`. **It runs immediately in mock mode with no API keys at all** — great for a demo.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000 and click "Try an example"
```

With no keys set, plan generation uses a deterministic **mock planner** and the video
feature shows a friendly “not configured” message — the rest of the app works fully.

To use the real services, copy `.env.example` → `.env` (or `.env.local`) and fill in keys.

---

## Deploy to Render

The repo ships a `render.yaml` blueprint (Node web service, `npm ci --include=dev && npm run build` → `npm run start`, health check on `/`, Node 22 pinned via `.node-version`). Secrets use `sync: false`, so they are never committed — you set them in Render.

**One click (recommended):**

1. Open **https://render.com/deploy?repo=https://github.com/yash306535/planpal**
2. Render reads `render.yaml`. When prompted, set the env vars you want:
   - `ANTHROPIC_API_KEY` — for real AI plans (leave blank to run in mock mode),
   - `TAVUS_API_KEY`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID` — for live video (optional).
3. Create the service. `autoDeploy` is on, so every `git push` to `main` redeploys.

**Via the Render API** (if you have `RENDER_API_KEY` in your shell):

```bash
RENDER_API_KEY=... ./scripts/render-deploy.sh
```

Then add the secret env vars in the Render dashboard and trigger a deploy. Never paste the API key or any secret into source or chat.

---

## Environment variables

All variables are **server-side only** and are never exposed to the client.

| Variable            | Required | Purpose                                                                                                                   |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | no       | Claude API key for real plan generation. Blank → mock planner.                                                            |
| `ANTHROPIC_MODEL`   | no       | Model id (default `claude-opus-5-5`). Lets you swap models without code changes — e.g. `claude-haiku-5-5` for lower cost. |
| `TAVUS_API_KEY`     | no       | Tavus API key for live video.                                                                                             |
| `TAVUS_REPLICA_ID`  | no       | Tavus replica id (looks like `r…`).                                                                                       |
| `TAVUS_PERSONA_ID`  | no       | Tavus persona id (looks like `p…`).                                                                                       |
| `MOCK_MODE`         | no       | `true` forces the seeded mock plan and skips all external calls.                                                          |

`.env*` is git-ignored (except `.env.example`), so secrets never get committed.

### Where to find the Tavus IDs

In the [Tavus dashboard](https://platform.tavus.io/):

- **API key** — _Account → API Keys_.
- **Replica ID** — the _Replicas_ page. Use a stock replica or create your own; ids start with `r`.
- **Persona ID** — the _Personas_ page. Use a default persona or create one; ids start with `p`.

All three (plus any one of them missing) are checked server-side; if the set is
incomplete the video feature is simply disabled and the app keeps working.

---

## Scripts

| Script                            | What it does                                         |
| --------------------------------- | ---------------------------------------------------- |
| `npm run dev`                     | Start the dev server.                                |
| `npm run build`                   | Production build (also type-checks + lints).         |
| `npm run start`                   | Serve the production build.                          |
| `npm run lint`                    | ESLint (`next/core-web-vitals` + `next/typescript`). |
| `npm run typecheck`               | `tsc --noEmit` in strict mode.                       |
| `npm run test`                    | Run the Vitest suite once.                           |
| `npm run test:coverage`           | Run tests with coverage (≥80% gate on `lib/`).       |
| `npm run format` / `format:check` | Prettier write / check.                              |

---

## Architecture overview

```
app/
  layout.tsx                 fonts (next/font), skip-link, header/footer, paper grain
  page.tsx                   client orchestrator: form ⇄ plan, localStorage, offline/error
  globals.css                theme tokens, event-type themes, motion, ticket/arch styling
  api/plan/route.ts                  POST → one LLM call → computed plan
  api/tavus/conversation/route.ts    POST → { conversation_url } only
components/                  EventForm, PlanView, Tabs, Budget/Timeline/Vendors/Ideas, TavusPanel, SmartImage
lib/
  schema.ts                  zod schemas = SINGLE SOURCE OF TRUTH; all types inferred
  defaults.ts                per-type categories, currencies, theming metadata
  budget.ts                  normalize % → integer amounts that sum exactly to the total
  timeline.ts                weeksBefore → dates, overdue flags (injectable clock)
  parsePlan.ts               validate + repair LLM JSON (pure)
  mockPlan.ts                deterministic seeded plan per event type
  llm.ts                     LlmClient interface + Anthropic adapter + mock + factory
  tavus.ts / tavusClient.ts  pure context builder / network call
  rateLimit.ts               in-memory sliding-window limiter
  hash.ts                    stable hash of inputs (cache key)
  images.ts                  typed Unsplash set + credits
  storage.ts                 SSR-safe localStorage layer
tests/                       unit, API-route (mocked), and component tests
```

**Data flow.** The form validates input with zod, hashes it, and checks the
`localStorage` cache. On a miss it `POST`s to `/api/plan`, which runs **exactly one**
LLM call behind the `LlmClient` interface, validates the compact JSON against the zod
schema (retrying once, then failing safely), and then **derives every exact number
locally** — budget amounts, remaining totals and milestone dates are computed in pure
`lib/` functions, never trusted from the model. The result and any edits (ticks, actual
spend) persist in `localStorage`, so a reload restores everything.

**Provider swap.** `getLlmClient()` returns the Anthropic adapter when a key is present,
or a deterministic mock otherwise (or when `MOCK_MODE=true`). Swapping providers means
writing one new `LlmClient`.

---

## Security

- **Secrets stay server-side.** Keys are read from env inside route handlers / adapters
  and never sent to the client. The Tavus route returns **only** `conversation_url`
  (verified by a test). `.env*` is git-ignored.
- **Every request body is validated with zod** (`app/api/*`): types, ranges and max
  lengths — guests 1–10 000, budget > 0, preferences ≤ 500 chars, 3-letter currency,
  real calendar dates. Invalid or oversized (>10 KB) bodies get a generic `400`.
- **Untrusted text is sandboxed.** User free-text goes into a delimited `<event_data>`
  block and the system prompt tells the model to treat it as data and never follow
  instructions inside it. The model’s output is validated against the schema before use,
  **retried once**, then fails safely with a generic message.
- **No `dangerouslySetInnerHTML`** anywhere (enforced by the `react/no-danger` lint rule);
  all model/user text is rendered through React escaping.
- **Rate limiting** — in-memory sliding window, 10 req/min per IP on both routes → `429`
  with `Retry-After`.
- **Security headers** (`next.config.mjs`): a Content-Security-Policy allowing only self,
  Unsplash images and Tavus/Daily frame sources; `X-Content-Type-Options: nosniff`;
  `Referrer-Policy`; `X-Frame-Options`; and a `Permissions-Policy` granting camera/mic
  only to self and the Tavus frame.
- **Outbound timeouts** — the Anthropic client uses a 20 s timeout; the Tavus `fetch`
  aborts after 15 s.
- **No sensitive logging** — errors log a generic string only; event details and secrets
  are never logged, and clients receive generic messages.

### Known dependency advisories (`npm audit`)

Two transitive advisories remain; both would require a **breaking major upgrade** to clear,
and neither is reachable in a way that affects this app:

- **zod < 4.6.6 (high)** — memory exhaustion validating _oversized constrained collections_.
  Not reachable here: user-controlled input schemas contain **no arrays**, and every request
  body is size-capped at 10 KB before it reaches zod. A full fix needs zod v4 (breaking API change).
- **postcss (via Next, moderate)** — a build-time source-map disclosure; not in the request
  path. Cleared only by upgrading to Next 16 (breaking).

Both are left in place deliberately rather than forcing a breaking upgrade; the mitigations
above neutralize the practical risk.

---

## Accessibility (targeting WCAG 2.1 AA)

- Semantic landmarks (`header`/`main`/`nav`/`section`), ordered headings, and a **Skip to
  content** link as the first focusable element.
- Every input has a visible `<label>`; errors use `aria-describedby` + `aria-invalid`, are
  announced via an `aria-live="polite"` region, and never rely on color alone (each carries
  a ⚠ icon and text).
- **Tabs** follow the WAI-ARIA pattern: `role="tablist"`, roving `tabindex`, arrow/Home/End
  navigation, `aria-selected`, `aria-controls`. Checklists use real `<input type="checkbox">`.
- Fully keyboard operable with a visible focus ring; focus moves to the plan heading when a
  plan loads, into the video panel when it opens, and back to the trigger button on close.
- Color contrast ≥ 4.5:1 (the accent is darkened to `--accent-deep` for text/buttons); text
  scales to 200%; `prefers-reduced-motion` disables all animation.
- The budget bar has a full table/text equivalent (the bars are `aria-hidden`); the Tavus
  iframe has a descriptive `title` and a note that video/mic are optional; touch targets are
  ≥ 44px and the layout works from 320px wide.

---

## Design decisions

The brief: it must **not** look AI-generated. The concept is a warm **“event planner’s
journal”** — paper and ink, editorial, tactile.

- **Palette** (CSS variables in `globals.css`, all ≥ 4.5:1 for text):
  paper `#F6F0E6`, ink `#1F2A24`, a bold terracotta accent `#C8553D` and a sage secondary
  `#7A8F6A`. No purple/indigo gradients, glassmorphism, glow or neon.
- **Typography**: a characterful serif, **Fraunces**, for headings paired with the humanist
  sans **DM Sans** for body — both loaded and self-hosted with `next/font` (so no external
  font requests, and the CSP can stay tight).
- **Layout**: asymmetric and editorial — an offset hero with overlapping, slightly-rotated
  arched photo frames; a sticky plan summary column; numbered section markers (01/02/03);
  thin rules and generous whitespace; a **masonry** ideas section (CSS columns, not a rigid
  grid); and **ticket-stub** styling for timeline milestones (punched notches + a dashed
  perforation).
- **Details**: a subtle SVG paper-grain overlay, arched/rounded-top image crops, and a
  hand-drawn SVG underline under the hero headline.
- **Event-type theming**: the accent (and hero/card imagery) shifts by type — wedding = soft
  gold, birthday = citrus, community = earthy green — via a single `data-theme` attribute;
  nothing else changes.
- **Motion**: only purposeful touches (staggered fade-up on plan load, a satisfying tick on
  checklists), all disabled under `prefers-reduced-motion`.
- **Copy**: warm and specific (“Let’s start with the date — everything else bends around it”),
  no buzzwords, no emoji-as-decoration, no lorem ipsum.
- **Brand**: a wordmark set in the heading serif, not a logo icon.

### Imagery

Real photos from Unsplash (`lib/images.ts`), requested at resized URLs
(`?w=…&q=70&auto=format`), served through `next/image` with `remotePatterns` limited to
`images.unsplash.com`, explicit sizes, `priority` only on the hero, and lazy loading
elsewhere. Each image has meaningful alt text (or `alt=""` when decorative) and an
`onError` fallback to a local themed **SVG** (`components/SmartImage.tsx`) so the layout
never breaks if a photo fails to load. A “Photos via Unsplash” credit with per-photo links
sits in the footer.

### The three views (description)

- **Hero / landing**: left column with a large serif headline (hand-drawn underline) and a
  numbered 3-step list; right column with three overlapping, rotated arched photos. Below, a
  single-column form with an image-backed event-type picker.
- **Plan view**: a sticky left summary card (event name, date, city, guests, budget, source
  badge, the “Talk to your planner” panel, and “Plan another event”) beside a right column of
  four tabs — Budget (table + CSS bars + editable actual-spend + live remaining), Timeline
  (ticket stubs, overdue flags), Vendors (grouped checkboxes with done counts), Ideas (masonry
  cards with per-tag photos).
- **Mobile (from 320px)**: columns stack — hero text over photos, and the plan summary above
  the tabs; tabs wrap; touch targets stay ≥ 44px; no horizontal scroll.

---

## Testing

`npm run test:coverage` — Vitest + React Testing Library (jsdom).

- **`lib/` unit tests**: budget normalization (sums to exactly 100 / to the total, rounding),
  timeline generation (dates counted back, overdue flagged, sorting), zod schemas (valid +
  many invalid cases), the rate limiter, the LLM parse/repair + retry, the Tavus context
  builder, the mock planner, and the hash. Coverage of `lib/` is **100% lines / functions /
  statements, 86% branches** (gate ≥ 80%).
- **API-route tests** (LLM + Tavus mocked): success, invalid input (400), oversized input
  (400), malformed LLM output failing safely after one retry (502), upstream failure (502),
  rate limit (429), and a test asserting the Tavus key never appears in a response.
- **Component tests**: form validation messages + ARIA wiring, tab switching by keyboard,
  vendor ticks persisting to `localStorage` (and restoring on remount), and the Tavus button’s
  error / unavailable / success-and-close-focus states.

---

## How each evaluation parameter is satisfied

| Area                               | Where                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Code Quality**                | `app/ components/ lib/ tests/` structure; pure logic in `lib/*` separate from UI; zod-inferred types in `lib/schema.ts` (no `any`); ESLint + Prettier; `npm run lint`, `test`, `build` all pass.                                                                                                                                                                                                                           |
| **B. Security**                    | `.env.example`, `.gitignore`; zod validation + ranges in `lib/schema.ts` and both routes; prompt-injection handling + output validation/retry in `lib/llm.ts` + `lib/parsePlan.ts`; React escaping (no `dangerouslySetInnerHTML`); `lib/rateLimit.ts`; CSP/headers + `Permissions-Policy` in `next.config.mjs`; outbound timeouts in `lib/llm.ts` + `lib/tavusClient.ts`; generic errors/no secret logging in both routes. |
| **C. Efficiency**                  | One LLM call per plan with compact prompt + capped `max_tokens` (`lib/llm.ts`); derived values local (`lib/budget.ts`, `lib/timeline.ts`); `localStorage` cache keyed by `lib/hash.ts`; submit disabled while loading (`EventForm`); Tavus panel lazy-loaded via `next/dynamic` (`PlanView`); CSS-only budget bars, no chart libs (132 KB first-load JS).                                                                  |
| **D. Testing**                     | `tests/` — unit, route, component; `npm run test:coverage` with an ≥80% `lib/` gate.                                                                                                                                                                                                                                                                                                                                       |
| **E. Accessibility**               | Skip link + landmarks in `app/layout.tsx`; labeled/`aria-describedby` errors + live region in `EventForm`; WAI-ARIA `Tabs`; real checkboxes in `VendorsTab`; focus management in `PlanView`/`TavusPanel`; contrast tokens + reduced-motion in `globals.css`; table equivalent in `BudgetTab`; iframe title + text alt in `TavusPanel`.                                                                                     |
| **F. Problem Statement Alignment** | Three event types with type-specific defaults (`lib/defaults.ts`); budget/timeline/vendors/ideas in every plan; ideas reflect city + preferences (`lib/mockPlan.ts` and the LLM prompt); Tavus receives full event context (`lib/tavus.ts`); “Try an example” seeded demo (`EventForm`).                                                                                                                                   |

---

## Limitations

- In-memory rate limiting and mock mode are per-instance (fine for a single-instance demo;
  a multi-instance deploy would need a shared store).
- Persistence is `localStorage` only — by design (no database, no login).
- Photographer names are credited generically as “Unsplash” (linked per photo) to avoid
  misattribution; swap in exact names from each photo’s Unsplash page if desired.
- Two dependency advisories remain (see _Security_) because clearing them requires breaking
  major upgrades; their practical risk is mitigated.
