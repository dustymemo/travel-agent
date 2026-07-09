import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanChat } from "./PlanChat";

const itinerary = {
  summary: "3 days in Vancouver",
  days: [
    {
      day: 1,
      title: "Arrival",
      activities: [
        { startTime: "16:00", title: "Land at YVR", type: "transport" },
      ],
    },
  ],
  packing: [],
  apps: [],
  tips: [],
  budget: [{ category: "food", amountCad: 120 }],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PlanChat", () => {
  it("shows the empty state and an accessible composer", () => {
    render(<PlanChat />);
    expect(screen.getByText(/Tell Roam your dates and vibe/)).toBeVisible();
    expect(screen.getByLabelText("Message Roam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled(); // empty input → disabled
    expect(
      screen.getByText(/Your day-by-day plan will appear here/),
    ).toBeInTheDocument();
  });

  it("sends a message and renders the returned itinerary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reply: "Here you go!", itinerary }),
      }),
    );

    render(<PlanChat />);
    await userEvent.type(
      screen.getByLabelText("Message Roam"),
      "plan me something fun",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    // traveler message + Roam reply appear
    expect(
      await screen.findByText("plan me something fun"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Here you go!")).toBeInTheDocument();
    // itinerary renders
    expect(screen.getByText("Land at YVR")).toBeInTheDocument();
  });
});
