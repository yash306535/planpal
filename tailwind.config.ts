import type { Config } from "tailwindcss";

// Colors are driven by CSS variables (defined in app/globals.css) so the
// event-type theme can swap the accent without touching markup. Variables hold
// space-separated RGB channels so Tailwind's <alpha-value> works.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        "paper-deep": "rgb(var(--paper-deep) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        terracotta: "rgb(var(--terracotta) / <alpha-value>)",
        sage: "rgb(var(--sage) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-deep": "rgb(var(--accent-deep) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        arch: "48% 48% 6px 6px / 44% 44% 6px 6px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        tick: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        tick: "tick 0.28s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
