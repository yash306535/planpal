import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html"],
      // Pure logic modules — the grading target is ≥80% here.
      include: [
        "lib/budget.ts",
        "lib/timeline.ts",
        "lib/schema.ts",
        "lib/rateLimit.ts",
        "lib/tavus.ts",
        "lib/parsePlan.ts",
        "lib/mockPlan.ts",
        "lib/hash.ts",
        "lib/defaults.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
