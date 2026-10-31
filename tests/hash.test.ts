import { describe, it, expect } from "vitest";
import { stableStringify, fnv1a, hashObject } from "@/lib/hash";

describe("stableStringify", () => {
  it("sorts object keys so order doesn't matter", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("preserves array order and handles nesting", () => {
    expect(stableStringify({ list: [3, 1, 2], n: null })).toBe(
      '{"list":[3,1,2],"n":null}',
    );
  });

  it("drops undefined values", () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe("fnv1a / hashObject", () => {
  it("returns an 8-char hex string", () => {
    expect(fnv1a("hello")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic and key-order independent", () => {
    expect(hashObject({ a: 1, b: 2 })).toBe(hashObject({ b: 2, a: 1 }));
  });

  it("differs for different inputs", () => {
    expect(hashObject({ city: "Lisbon" })).not.toBe(hashObject({ city: "Porto" }));
  });
});
