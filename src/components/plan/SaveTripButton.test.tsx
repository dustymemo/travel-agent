import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveTripButton } from "./SaveTripButton";
import { saveTrip } from "@/lib/trips/repo";
import type { Itinerary } from "@/types/trip";

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({}) as never,
}));
vi.mock("@/lib/trips/repo", () => ({ saveTrip: vi.fn() }));

const itinerary: Itinerary = {
  summary: "3 days in Kyoto",
  days: [],
  packing: [],
  apps: [],
  tips: [],
  budget: [],
};

beforeEach(() => vi.clearAllMocks());

describe("SaveTripButton", () => {
  it("saves the itinerary and confirms success", async () => {
    vi.mocked(saveTrip).mockResolvedValue({
      id: "t1",
      title: "3 days in Kyoto",
      itinerary,
      createdAt: "2026-07-12",
    });

    render(<SaveTripButton itinerary={itinerary} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Save this trip" }),
    );

    expect(saveTrip).toHaveBeenCalledWith(expect.anything(), itinerary);
    expect(
      await screen.findByRole("button", { name: "Saved ✓" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /view your trips/i }),
    ).toHaveAttribute("href", "/trips");
  });

  it("shows an error when saving fails", async () => {
    vi.mocked(saveTrip).mockRejectedValue(new Error("nope"));

    render(<SaveTripButton itinerary={itinerary} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Save this trip" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't save/i,
    );
  });
});
