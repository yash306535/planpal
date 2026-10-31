import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, type TabDef } from "@/components/Tabs";

const tabs: TabDef[] = [
  { id: "budget", label: "Budget", content: <p>Budget panel</p> },
  { id: "timeline", label: "Timeline", content: <p>Timeline panel</p> },
  { id: "vendors", label: "Vendors", content: <p>Vendors panel</p> },
  { id: "ideas", label: "Ideas", content: <p>Ideas panel</p> },
];

describe("Tabs (WAI-ARIA pattern)", () => {
  it("selects the first tab by default and shows its panel", () => {
    render(<Tabs tabs={tabs} ariaLabel="Plan sections" />);
    const tabButtons = screen.getAllByRole("tab");
    expect(tabButtons[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Budget panel");
  });

  it("moves between tabs with arrow keys and wraps around", async () => {
    render(<Tabs tabs={tabs} ariaLabel="Plan sections" />);
    const tabButtons = screen.getAllByRole("tab");

    tabButtons[0]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tabButtons[1]).toHaveAttribute("aria-selected", "true");
    expect(tabButtons[1]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Timeline panel");

    // ArrowLeft from the first wraps to the last.
    tabButtons[0]!.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(tabButtons[3]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Ideas panel");
  });

  it("uses a roving tabindex", () => {
    render(<Tabs tabs={tabs} ariaLabel="Plan sections" />);
    const tabButtons = screen.getAllByRole("tab");
    expect(tabButtons[0]).toHaveAttribute("tabindex", "0");
    expect(tabButtons[1]).toHaveAttribute("tabindex", "-1");
  });
});
