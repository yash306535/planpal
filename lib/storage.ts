import type { ComputedPlan, EventInput } from "@/lib/schema";

/**
 * Thin, SSR-safe localStorage layer. Everything is wrapped in try/catch so the
 * app works even where storage is unavailable (private mode, blocked cookies).
 * No server, no login — this is the entire persistence story.
 */

const PREFIX = "planpal:v1:";

export interface StoredSession {
  hash: string;
  input: EventInput;
  plan: ComputedPlan;
  source: "llm" | "mock";
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded / unavailable — non-fatal
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

// --- plan cache (keyed by a hash of the form inputs) ---

export function savePlan(session: StoredSession): void {
  write(`session:${session.hash}`, session);
}
export function loadPlan(hash: string): StoredSession | null {
  return read<StoredSession>(`session:${hash}`);
}

// --- "current" pointer so a reload restores the last plan ---

export function saveCurrentHash(hash: string): void {
  write("current", hash);
}
export function loadCurrentHash(): string | null {
  return read<string>("current");
}
export function clearCurrent(): void {
  remove("current");
}

// --- per-plan vendor ticks & actual-spend edits ---

export type Ticks = Record<string, boolean>;
export type Spent = Record<string, number>;

export function saveTicks(hash: string, ticks: Ticks): void {
  write(`ticks:${hash}`, ticks);
}
export function loadTicks(hash: string): Ticks {
  return read<Ticks>(`ticks:${hash}`) ?? {};
}

export function saveSpent(hash: string, spent: Spent): void {
  write(`spent:${hash}`, spent);
}
export function loadSpent(hash: string): Spent {
  return read<Spent>(`spent:${hash}`) ?? {};
}
