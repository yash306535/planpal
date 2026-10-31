import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { IMAGE_CREDITS } from "@/lib/images";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlanPal — your event planner's journal",
  description:
    "Plan weddings, birthdays and community events: a budget, timeline, vendor checklist and tailored ideas — then talk it through with a live AI planner.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="relative min-h-dvh font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only rounded-md bg-accent-deep px-4 py-2 font-semibold text-paper focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>

        <div className="relative z-10 flex min-h-dvh flex-col">
          <header className="border-b border-line">
            <div className="mx-auto flex w-full max-w-6xl items-baseline gap-3 px-4 py-5 sm:px-6">
              <span className="font-serif text-2xl font-black tracking-tight text-ink">
                PlanPal
              </span>
              <span
                aria-hidden
                className="h-2 w-2 translate-y-[-2px] rounded-full bg-accent"
              />
              <span className="font-serif text-sm italic text-ink-soft">
                the event planner&rsquo;s journal
              </span>
            </div>
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer className="mt-16 border-t border-line">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-ink-soft sm:px-6">
              <p className="mb-2">
                Built as a planning companion — your plans live only in this browser.
              </p>
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                <span>Photos via</span>
                {IMAGE_CREDITS.map((img, i) => (
                  <a
                    key={img.link}
                    href={img.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-deep underline decoration-line underline-offset-2 hover:decoration-accent-deep"
                  >
                    Unsplash{i < IMAGE_CREDITS.length - 1 ? "," : ""}
                  </a>
                ))}
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
