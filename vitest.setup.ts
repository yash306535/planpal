import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { ComponentProps } from "react";

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    // localStorage may be unavailable in some environments; ignore.
  }
});

// next/image needs Next's build-time image config; render a plain <img> in tests.
vi.mock("next/image", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement("img", {
        src: typeof props.src === "string" ? props.src : undefined,
        alt: typeof props.alt === "string" ? props.alt : "",
        className: typeof props.className === "string" ? props.className : undefined,
      } as ComponentProps<"img">),
  };
});
