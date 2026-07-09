/**
 * Pure itinerary helpers for the Plan UI — totals + the Roam category token
 * maps. Framework-free so they're unit-tested and reusable across screens.
 */
import type { Itinerary, DayPlan, StopType } from "@/types/trip";

/** Sum of all budget lines, in CAD. */
export function budgetTotalCad(itinerary: Itinerary): number {
  return itinerary.budget.reduce((sum, line) => sum + line.amountCad, 0);
}

/** Sum of a day's activity prices, in CAD (missing prices count as 0). */
export function dayTotalCad(day: DayPlan): number {
  return day.activities.reduce((sum, a) => sum + (a.priceCad ?? 0), 0);
}

/** Tailwind background-color class for each stop category's dot. */
export const STOP_DOT: Record<StopType, string> = {
  transport: "bg-cat-transport",
  stay: "bg-cat-stay",
  food: "bg-cat-food",
  activity: "bg-cat-activity",
  explore: "bg-cat-explore",
};

/** Human label for each stop category. */
export const STOP_LABEL: Record<StopType, string> = {
  transport: "Transport",
  stay: "Stay",
  food: "Food",
  activity: "Activity",
  explore: "Explore",
};
