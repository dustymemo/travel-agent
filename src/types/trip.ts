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

/**
 * Category of a timeline stop — drives the Roam colour dot / tag in the UI.
 * (Roam design: Transport / Stay / Food / Activity / Explore.)
 */
export const StopType = z.enum([
  "transport",
  "stay",
  "food",
  "activity",
  "explore",
]);
export type StopType = z.infer<typeof StopType>;

/** One time-blocked activity on a day's timeline. */
export const Activity = z.object({
  startTime: z.string(), // "09:30"
  title: z.string(),
  /** Category for the UI dot/tag; defaults to "activity" when omitted. */
  type: StopType.default("activity"),
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

/**
 * An app-to-download suggestion. Tolerant of real model output: sometimes it
 * returns a bare app-name string instead of {name, why}, or omits `why`.
 * Coerce both into the canonical shape rather than failing the whole plan.
 */
export const AppRec = z.preprocess(
  (v) => (typeof v === "string" ? { name: v } : v),
  z.object({ name: z.string(), why: z.string().default("") }),
);
export type AppRec = z.infer<typeof AppRec>;

/** The full AI-generated plan for a single trip (or one budget tier). */
export const Itinerary = z.object({
  summary: z.string(),
  days: z.array(DayPlan),
  packing: z.array(z.string()),
  apps: z.array(AppRec),
  tips: z.array(z.string()),
  budget: z.array(BudgetLine),
  budgetTierCad: z.number().positive().optional(), // set when this is one tier of several
});
export type Itinerary = z.infer<typeof Itinerary>;

/** One turn of the Plan conversation. */
export const Message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type Message = z.infer<typeof Message>;

/**
 * What the planner brain returns each turn: a short chat reply to show in the
 * conversation, plus the full (re)generated itinerary to render beside it.
 * This is also the exact JSON contract the AI model must emit.
 */
export const PlanTurnOutput = z.object({
  reply: z.string().min(1),
  itinerary: Itinerary,
});
export type PlanTurnOutput = z.infer<typeof PlanTurnOutput>;

/** A saved trip = the input plus one or more generated itineraries. */
export const Trip = z.object({
  id: z.string(),
  createdAt: z.string(),
  input: TripInput,
  itineraries: z.array(Itinerary),
});
export type Trip = z.infer<typeof Trip>;
