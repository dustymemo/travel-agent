import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItineraryPanel } from "./ItineraryPanel";
import type { Itinerary } from "@/types/trip";

const itinerary: Itinerary = {
  summary: "3 relaxed days in Vancouver",
  days: [
    {
      day: 1,
      title: "Arrival & Gastown",
      activities: [
        {
          startTime: "16:00",
          title: "Land at YVR",
          type: "transport",
          priceCad: 11,
        },
        {
          startTime: "19:00",
          title: "Dinner in Gastown",
          type: "food",
          priceCad: 45,
        },
      ],
    },
  ],
  packing: ["rain jacket"],
  apps: [{ name: "Transit", why: "departures" }],
  tips: ["Tap your Compass Card"],
  budget: [
    { category: "hotels", amountCad: 540 },
    { category: "food", amountCad: 210 },
  ],
};

describe("ItineraryPanel", () => {
  it("shows the summary and the trip total", () => {
    render(<ItineraryPanel itinerary={itinerary} />);
    expect(screen.getByText(/3 relaxed days in Vancouver/)).toBeInTheDocument();
    // 540 + 210 = 750
    expect(screen.getByText(/750/)).toBeInTheDocument();
  });

  it("renders each stop with its time and title", () => {
    render(<ItineraryPanel itinerary={itinerary} />);
    expect(screen.getByText("Land at YVR")).toBeInTheDocument();
    expect(screen.getByText("Dinner in Gastown")).toBeInTheDocument();
    expect(screen.getByText("16:00")).toBeInTheDocument();
  });

  it("surfaces packing, apps, and tips", () => {
    render(<ItineraryPanel itinerary={itinerary} />);
    expect(screen.getByText("rain jacket")).toBeInTheDocument();
    expect(screen.getByText(/Transit — departures/)).toBeInTheDocument();
    expect(screen.getByText("Tap your Compass Card")).toBeInTheDocument();
  });
});
