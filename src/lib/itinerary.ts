/**
 * Pure itinerary helpers for the Plan UI — totals + the Roam category token
 * maps. Framework-free so they're unit-tested and reusable across screens.
 */
import type { Itinerary, DayPlan, StopType, BudgetLine } from "@/types/trip";

/** Sum of all budget lines, in CAD. */
export function budgetTotalCad(itinerary: Itinerary): number {
  return itinerary.budget.reduce((sum, line) => sum + line.amountCad, 0);
}

/** Sum of a day's activity prices, in CAD (missing prices count as 0). */
export function dayTotalCad(day: DayPlan): number {
  return day.activities.reduce((sum, a) => sum + (a.priceCad ?? 0), 0);
}

/**
 * Which budget line a timeline stop's ticket price belongs to.
 *
 * TA-23 says prices "roll up into the activities line", but the data disagrees:
 * timeline prices span categories — a Compass Card fare is transit, dinner is
 * food. Billing those to `activities` would double-count them against the
 * existing food/transit lines and make the total *less* honest, which is the
 * opposite of the point. So each stop pays into its own category.
 */
export const BUDGET_CATEGORY_FOR_STOP: Record<
  StopType,
  BudgetLine["category"]
> = {
  transport: "transit",
  stay: "hotels",
  food: "food",
  activity: "activities",
  explore: "activities",
};

/**
 * Set one activity's ticket price and keep the trip total honest (TA-27/TA-23).
 *
 * Applies the *delta* to the matching budget line rather than rebasing the line
 * to the sum of ticket prices. Two reasons: the AI's estimate covers more than
 * the priced stops (the food line pays for meals with no ticket), so rebasing
 * would erase that; and a rebase would make the total lurch on the traveller's
 * first edit. With a delta, the total moves by exactly what they changed —
 * nothing more.
 *
 * Pure: returns a new itinerary, or the same reference when nothing changed.
 */
export function withActivityPrice(
  itinerary: Itinerary,
  dayNumber: number,
  activityIndex: number,
  priceCad: number,
): Itinerary {
  const dayIndex = itinerary.days.findIndex((d) => d.day === dayNumber);
  if (dayIndex === -1) return itinerary;

  const activity = itinerary.days[dayIndex].activities[activityIndex];
  if (!activity) return itinerary;

  const previous = activity.priceCad ?? 0;
  const delta = priceCad - previous;
  // No-op edits keep the same reference so React skips the re-render.
  if (delta === 0) return itinerary;

  const days = itinerary.days.map((day, i) =>
    i !== dayIndex
      ? day
      : {
          ...day,
          activities: day.activities.map((a, j) =>
            j !== activityIndex ? a : { ...a, priceCad },
          ),
        },
  );

  const category = BUDGET_CATEGORY_FOR_STOP[activity.type];
  const lineIndex = itinerary.budget.findIndex((l) => l.category === category);
  const budget =
    lineIndex === -1
      ? [...itinerary.budget, { category, amountCad: Math.max(0, delta) }]
      : itinerary.budget.map((line, i) =>
          i !== lineIndex
            ? line
            : { ...line, amountCad: Math.max(0, line.amountCad + delta) },
        );

  return { ...itinerary, days, budget };
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
