import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TavusPanel } from "@/components/TavusPanel";
import { eventInputSchema } from "@/lib/schema";

const input = eventInputSchema.parse({
  type: "wedding",
  name: "Maya & Leo",
  date: "2026-09-12",
  guests: 120,
  budget: 28000,
  currency: "USD",
  city: "Lisbon",
  preferences: "garden",
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("TavusPanel", () => {
  it("shows an error state with a retry control when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    render(<TavusPanel eventInput={input} planSummary="summary" />);

    await userEvent.click(screen.getByRole("button", { name: /talk to your planner/i }));

    expect(
      await screen.findByText(/couldn't start the video planner/i),
    ).toBeInTheDocument();
    // The trigger remains, so the user can retry.
    expect(
      screen.getByRole("button", { name: /talk to your planner/i }),
    ).toBeInTheDocument();
  });

  it("explains the feature is unavailable on a 503 (rest of app keeps working)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: "Live video planner isn't configured." }, 503),
      ),
    );
    render(<TavusPanel eventInput={input} planSummary="summary" />);

    await userEvent.click(screen.getByRole("button", { name: /talk to your planner/i }));
    expect(await screen.findByText(/isn't configured/i)).toBeInTheDocument();
  });

  it("opens the iframe on success and returns focus to the trigger on close", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ conversation_url: "https://tavus.daily.co/abc" })),
    );
    render(<TavusPanel eventInput={input} planSummary="summary" />);

    await userEvent.click(screen.getByRole("button", { name: /talk to your planner/i }));

    const iframe = await screen.findByTitle(/live video planning session/i);
    expect(iframe).toHaveAttribute("allow", "camera; microphone");
    expect(iframe).toHaveAttribute("src", "https://tavus.daily.co/abc");

    await userEvent.click(screen.getByRole("button", { name: /end & close/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /talk to your planner/i })).toHaveFocus(),
    );
  });
});
