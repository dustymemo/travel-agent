import { describe, it, expect } from "vitest";
import {
  budgetTotalCad,
  dayTotalCad,
  withActivityPrice,
  BUDGET_CATEGORY_FOR_STOP,
  STOP_DOT,
  STOP_LABEL,
} from "./itinerary";
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

describe("withActivityPrice", () => {
  it("sets the activity's price", () => {
    const next = withActivityPrice(itinerary, 1, 1, 60);
    expect(next.days[0].activities[1].priceCad).toBe(60);
  });

  it("moves the trip total by exactly what the traveller changed", () => {
    // The whole point of TA-23: edit a price, the headline number follows.
    const next = withActivityPrice(itinerary, 1, 1, 60); // dinner 45 -> 60
    expect(budgetTotalCad(next)).toBe(budgetTotalCad(itinerary) + 15);
  });

  it("bills the edit to the category the stop belongs to, not always 'activities'", () => {
    // Dinner is food. Rolling it into `activities` would double-count against
    // the existing food line and make the total *less* honest.
    const next = withActivityPrice(itinerary, 1, 1, 60);
    expect(next.budget.find((l) => l.category === "food")?.amountCad).toBe(225);
    expect(
      next.budget.find((l) => l.category === "activities"),
    ).toBeUndefined();
  });

  it("opens a budget line when the category has none yet", () => {
    // "Land" is transport -> transit, and this itinerary has no transit line.
    const next = withActivityPrice(itinerary, 1, 0, 31); // 11 -> 31
    expect(next.budget.find((l) => l.category === "transit")?.amountCad).toBe(
      20,
    );
    expect(budgetTotalCad(next)).toBe(budgetTotalCad(itinerary) + 20);
  });

  it("treats a previously unpriced activity as 0", () => {
    const next = withActivityPrice(itinerary, 1, 2, 25); // walk: none -> 25
    expect(next.days[0].activities[2].priceCad).toBe(25);
    expect(budgetTotalCad(next)).toBe(budgetTotalCad(itinerary) + 25);
  });

  it("never drives a budget line negative", () => {
    // food line is 210; clearing a 45 dinner is fine, but the guard matters
    // once the AI's estimate is smaller than the tickets under it.
    const thin: Itinerary = {
      ...itinerary,
      budget: [{ category: "food", amountCad: 10 }],
    };
    const next = withActivityPrice(thin, 1, 1, 0); // dinner 45 -> 0, delta -45
    expect(next.budget.find((l) => l.category === "food")?.amountCad).toBe(0);
  });

  it("does not mutate the itinerary it was given", () => {
    const before = structuredClone(itinerary);
    withActivityPrice(itinerary, 1, 1, 60);
    expect(itinerary).toEqual(before);
  });

  it("returns the same object when the price is unchanged", () => {
    // Referential equality keeps React from re-rendering on a no-op edit.
    expect(withActivityPrice(itinerary, 1, 1, 45)).toBe(itinerary);
  });

  it("ignores a day or activity that isn't there", () => {
    expect(withActivityPrice(itinerary, 99, 0, 10)).toBe(itinerary);
    expect(withActivityPrice(itinerary, 1, 99, 10)).toBe(itinerary);
  });
});

describe("BUDGET_CATEGORY_FOR_STOP", () => {
  it("maps every StopType to a real budget category", () => {
    const categories = ["hotels", "food", "transit", "activities"];
    for (const type of [
      "transport",
      "stay",
      "food",
      "activity",
      "explore",
    ] as const) {
      expect(categories).toContain(BUDGET_CATEGORY_FOR_STOP[type]);
    }
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
