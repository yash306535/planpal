/**
 * Stable, dependency-free hash of the event input. Used as a localStorage cache
 * key so identical form submissions reuse the last plan instead of calling the
 * LLM again.
 */

/** Deterministic JSON with sorted keys so key order never changes the hash. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}

/** 32-bit FNV-1a hash, returned as an 8-char hex string. */
export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    // h *= 16777619 (FNV prime) with 32-bit overflow
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function hashObject(value: unknown): string {
  return fnv1a(stableStringify(value));
}
