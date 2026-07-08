/**
 * Shared domain types + Zod schemas.
 *
 * Zod is the single source of truth: we derive TypeScript types from the
 * schemas AND use them to validate AI output and stored trips at runtime.
 */
import { z } from "zod";

export const Season = z.enum(["spring", "summer", "autumn", "winter"]);
export type Season = z.infer<typeof Season>;

export const Pace = z.enum(["relaxed", "balanced", "packed"]);
export type Pace = z.infer<typeof Pace>;

/** What the user fills into the trip form. */
export const TripInput = z.object({
  destination: z.string().min(1),
  days: z.number().int().min(1).max(60),
  season: Season,
  /** Target budget in CAD. null = no limit → generate tiered options. */
  budgetCad: z.number().positive().nullable(),
  // Advanced (all optional, smart defaults applied downstream)
  pace: Pace.optional(),
  interests: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
  partySize: z.number().int().min(1).optional(),
});
export type TripInput = z.infer<typeof TripInput>;

/** One time-blocked activity on a day's timeline. */
export const Activity = z.object({
  startTime: z.string(), // "09:30"
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  /** Ticket/entry price in CAD; rolls up into the budget. */
  priceCad: z.number().nonnegative().optional(),
});
export type Activity = z.infer<typeof Activity>;

export const DayPlan = z.object({
  day: z.number().int().min(1),
  title: z.string(),
  activities: z.array(Activity),
});
export type DayPlan = z.infer<typeof DayPlan>;

export const BudgetLine = z.object({
  category: z.enum([
    "flights",
    "hotels",
    "food",
    "transit",
    "activities",
    "other",
  ]),
  amountCad: z.number().nonnegative(),
  note: z.string().optional(),
});
export type BudgetLine = z.infer<typeof BudgetLine>;

/** The full AI-generated plan for a single trip (or one budget tier). */
export const Itinerary = z.object({
  summary: z.string(),
  days: z.array(DayPlan),
  packing: z.array(z.string()),
  apps: z.array(z.object({ name: z.string(), why: z.string() })),
  tips: z.array(z.string()),
  budget: z.array(BudgetLine),
  budgetTierCad: z.number().positive().optional(), // set when this is one tier of several
});
export type Itinerary = z.infer<typeof Itinerary>;

/** A saved trip = the input plus one or more generated itineraries. */
export const Trip = z.object({
  id: z.string(),
  createdAt: z.string(),
  input: TripInput,
  itineraries: z.array(Itinerary),
});
export type Trip = z.infer<typeof Trip>;
