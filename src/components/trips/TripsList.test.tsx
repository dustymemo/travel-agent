import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TripsList } from "./TripsList";
import { listTrips, type SavedTrip } from "@/lib/trips/repo";
import type { Itinerary } from "@/types/trip";

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({}) as never,
}));
vi.mock("@/lib/trips/repo", () => ({ listTrips: vi.fn() }));

const itinerary: Itinerary = {
  summary: "Kyoto",
  days: [{ day: 1, title: "D1", activities: [] }],
  packing: [],
  apps: [],
  tips: [],
  budget: [{ category: "food", amountCad: 100 }],
};

const trip: SavedTrip = {
  id: "t1",
  title: "3 days in Kyoto",
  itinerary,
  createdAt: "2026-07-12T00:00:00Z",
};

beforeEach(() => vi.clearAllMocks());

describe("TripsList", () => {
  it("renders saved trips linking to their detail pages", async () => {
    vi.mocked(listTrips).mockResolvedValue([trip]);
    render(<TripsList />);

    const link = await screen.findByRole("link", { name: /3 days in Kyoto/i });
    expect(link).toHaveAttribute("href", "/trips/t1");
    expect(screen.getByText(/1 day ·/)).toBeInTheDocument();
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no trips", async () => {
    vi.mocked(listTrips).mockResolvedValue([]);
    render(<TripsList />);
    expect(await screen.findByText(/No saved trips yet/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    vi.mocked(listTrips).mockRejectedValue(new Error("boom"));
    render(<TripsList />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't load/i,
    );
  });
});
