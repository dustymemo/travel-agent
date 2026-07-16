import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeatherBadge } from "./WeatherBadge";
import type { Climate } from "@/lib/weather/open-meteo";

const climate: Climate = {
  place: "Tokyo",
  country: "Japan",
  avgHighC: 30.9,
  avgLowC: 24.4,
  precipMm: 64.1,
  rainyDays: 4,
  window: "Sep 9–15, 2025",
};

describe("WeatherBadge", () => {
  it("shows the window, rounded temps, and rainy days", () => {
    render(<WeatherBadge weather={climate} />);
    const region = screen.getByRole("region", {
      name: /typical weather/i,
    });
    expect(region).toHaveTextContent("Sep 9–15, 2025");
    expect(region).toHaveTextContent("31°");
    expect(region).toHaveTextContent("24°C");
    expect(region).toHaveTextContent("4 rainy days");
  });

  it("uses the singular for a single rainy day", () => {
    render(<WeatherBadge weather={{ ...climate, rainyDays: 1 }} />);
    expect(screen.getByText("1 rainy day")).toBeInTheDocument();
  });
});
