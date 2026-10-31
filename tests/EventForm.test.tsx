import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "@/components/EventForm";

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("EventForm", () => {
  it("shows accessible validation messages on empty submit and does not submit", async () => {
    const onSubmit = vi.fn();
    render(<EventForm onSubmit={onSubmit} loading={false} />);

    await userEvent.click(screen.getByRole("button", { name: /make my plan/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Give your event a name")).toBeInTheDocument();
    expect(screen.getByText("Which city?")).toBeInTheDocument();

    // The name field is marked invalid and points at its error via aria-describedby.
    const name = screen.getByLabelText("Event name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name.getAttribute("aria-describedby")).toContain("name-error");

    // Polite summary is announced.
    expect(screen.getByText(/need your attention/i)).toBeInTheDocument();
  });

  it("submits a parsed, normalized EventInput when valid", async () => {
    const onSubmit = vi.fn();
    render(<EventForm onSubmit={onSubmit} loading={false} />);

    fill("Event name", "Mia turns 8");
    fill("Date", "2027-01-10");
    fill("City", "Austin");
    fill("Guests", "25");
    fill("Budget amount", "1200");

    await userEvent.click(screen.getByRole("button", { name: /make my plan/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0]![0];
    expect(arg).toMatchObject({
      type: "wedding",
      name: "Mia turns 8",
      city: "Austin",
      guests: 25,
      budget: 1200,
      currency: "USD",
    });
  });

  it("disables the submit button while loading", () => {
    render(<EventForm onSubmit={vi.fn()} loading />);
    expect(screen.getByRole("button", { name: /planning/i })).toBeDisabled();
  });

  it("renders an API error with a retry control", () => {
    render(
      <EventForm
        onSubmit={vi.fn()}
        loading={false}
        error="We couldn't generate your plan."
      />,
    );
    expect(screen.getByText("We couldn't generate your plan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
