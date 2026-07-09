import { describe, it, expect } from "vitest";
import { budgetTotalCad, dayTotalCad, STOP_DOT, STOP_LABEL } from "./itinerary";
import type { Itinerary, DayPlan } from "@/types/trip";

const day: DayPlan = {
  day: 1,
  title: "Arrival",
  activities: [
    { startTime: "16:00", title: "Land", type: "transport", priceCad: 11 },
    { startTime: "19:00", title: "Dinner", type: "food", priceCad: 45 },
    { startTime: "21:00", title: "Walk", type: "explore" }, // no price
  ],
};

const itinerary: Itinerary = {
  summary: "Test",
  days: [day],
  packing: [],
  apps: [],
  tips: [],
  budget: [
    { category: "hotels", amountCad: 540 },
    { category: "food", amountCad: 210 },
  ],
};

describe("budgetTotalCad", () => {
  it("sums the budget lines", () => {
    expect(budgetTotalCad(itinerary)).toBe(750);
  });
});

describe("dayTotalCad", () => {
  it("sums activity prices, treating missing prices as 0", () => {
    expect(dayTotalCad(day)).toBe(56);
  });
});

describe("stop token maps", () => {
  it("cover every StopType", () => {
    for (const type of [
      "transport",
      "stay",
      "food",
      "activity",
      "explore",
    ] as const) {
      expect(STOP_DOT[type]).toBeTruthy();
      expect(STOP_LABEL[type]).toBeTruthy();
    }
  });
});
