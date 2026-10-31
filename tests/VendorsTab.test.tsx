import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VendorsTab } from "@/components/VendorsTab";
import { loadTicks } from "@/lib/storage";
import type { ComputedPlan } from "@/lib/schema";

const vendors: ComputedPlan["vendors"] = [
  { category: "Venue", items: ["Tour venues", "Confirm date"] },
  { category: "Catering", items: ["Schedule a tasting"] },
];

describe("VendorsTab", () => {
  it("ticks an item, persists it, and restores on remount", async () => {
    const { unmount } = render(<VendorsTab vendors={vendors} hash="h1" />);

    const checkbox = screen.getByRole("checkbox", { name: "Tour venues" });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Persisted to localStorage under a category|item key.
    expect(loadTicks("h1")["Venue|Tour venues"]).toBe(true);

    // Remount reads back the saved tick.
    unmount();
    render(<VendorsTab vendors={vendors} hash="h1" />);
    expect(screen.getByRole("checkbox", { name: "Tour venues" })).toBeChecked();
  });

  it("shows a per-group done count", async () => {
    render(<VendorsTab vendors={vendors} hash="h2" />);
    expect(screen.getByText("0/2 done")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Confirm date" }));
    expect(screen.getByText("1/2 done")).toBeInTheDocument();
  });
});
