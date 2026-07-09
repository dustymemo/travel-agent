import { describe, it, expect } from "vitest";
import { fakePlannerResponse } from "./fake-plan";
import { PlanTurnOutput } from "@/types/trip";

function plan(prompt: string) {
  const raw = fakePlannerResponse({ prompt, json: true });
  const parsed = PlanTurnOutput.parse(JSON.parse(raw));
  return parsed;
}

const budgetTotal = (p: ReturnType<typeof plan>) =>
  p.itinerary.budget.reduce((sum, b) => sum + b.amountCad, 0);

describe("fakePlannerResponse", () => {
  it("returns a valid PlanTurnOutput by default", () => {
    const p = plan("3 relaxed days in Vancouver");
    expect(p.itinerary.days.length).toBeGreaterThan(0);
    expect(p.reply.length).toBeGreaterThan(0);
  });

  it("trims the budget when asked to make it cheaper", () => {
    const base = budgetTotal(plan("plan Vancouver"));
    const cheaper = plan("can you make it cheaper");
    expect(budgetTotal(cheaper)).toBeLessThan(base);
    expect(cheaper.reply).toMatch(/cheaper|trim|budget/i);
  });

  it("swaps in the train when asked", () => {
    const p = plan("use trains instead of the car");
    const titles = p.itinerary.days.flatMap((d) =>
      d.activities.map((a) => a.title.toLowerCase()),
    );
    expect(titles.some((t) => t.includes("train"))).toBe(true);
  });

  it("adds a food tour when asked", () => {
    const base = plan("plan Vancouver");
    const foodCount = (p: ReturnType<typeof plan>) =>
      p.itinerary.days
        .flatMap((d) => d.activities)
        .filter((a) => a.type === "food").length;
    const withFood = plan("add a food tour please");
    expect(foodCount(withFood)).toBeGreaterThan(foodCount(base));
    expect(withFood.reply).toMatch(/food/i);
  });
});
