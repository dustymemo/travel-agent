import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItineraryPanel } from "./ItineraryPanel";
import { withActivityPrice } from "@/lib/itinerary";
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
          location: "Water Street",
          priceCad: 45,
        },
        { startTime: "21:00", title: "Night walk", type: "explore" },
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

  it("shows a stop's location when the plan has one", () => {
    render(<ItineraryPanel itinerary={itinerary} />);
    expect(screen.getByText(/Water Street/)).toBeInTheDocument();
  });

  describe("read-only (no onPriceChange)", () => {
    // TripDetail renders a *saved* trip through this same panel; it must not
    // offer to edit something it cannot persist.
    it("renders prices as text, not inputs", () => {
      render(<ItineraryPanel itinerary={itinerary} />);
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
      expect(screen.getByText(/\$45/)).toBeInTheDocument();
    });
  });

  describe("editable (onPriceChange given)", () => {
    it("gives every stop a labelled price field, including unpriced ones", () => {
      render(<ItineraryPanel itinerary={itinerary} onPriceChange={vi.fn()} />);
      expect(
        screen.getByLabelText("Ticket price for Dinner in Gastown"),
      ).toHaveValue(45);
      // An unpriced stop still needs a way to add a price.
      expect(screen.getByLabelText("Ticket price for Night walk")).toHaveValue(
        null,
      );
    });

    it("reports the edited price with its day and index", async () => {
      // The field is controlled, so it only advances if the parent feeds the
      // new price back — exactly what usePlanner does. A bare spy would leave
      // the value pinned and every keystroke would append to it.
      const onPriceChange = vi.fn();
      function Harness() {
        const [current, setCurrent] = useState(itinerary);
        return (
          <ItineraryPanel
            itinerary={current}
            onPriceChange={(day, index, price) => {
              onPriceChange(day, index, price);
              setCurrent((prev) => withActivityPrice(prev, day, index, price));
            }}
          />
        );
      }
      render(<Harness />);

      const field = screen.getByLabelText("Ticket price for Dinner in Gastown");
      await userEvent.clear(field);
      await userEvent.type(field, "60");

      expect(onPriceChange).toHaveBeenLastCalledWith(1, 1, 60);
      expect(field).toHaveValue(60);
      // …and the trip total followed the edit: 750 - 45 + 60
      expect(screen.getByText(/765/)).toBeInTheDocument();
    });

    it("treats a cleared field as free, not NaN", async () => {
      const onPriceChange = vi.fn();
      render(
        <ItineraryPanel itinerary={itinerary} onPriceChange={onPriceChange} />,
      );

      await userEvent.clear(
        screen.getByLabelText("Ticket price for Dinner in Gastown"),
      );

      expect(onPriceChange).toHaveBeenLastCalledWith(1, 1, 0);
    });

    it("refuses negative prices", () => {
      render(<ItineraryPanel itinerary={itinerary} onPriceChange={vi.fn()} />);
      expect(
        screen.getByLabelText("Ticket price for Dinner in Gastown"),
      ).toHaveAttribute("min", "0");
    });
  });
});
