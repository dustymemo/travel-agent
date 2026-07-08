/**
 * City-knowledge schema (TA-14).
 *
 * Curated, source-cited facts per city that ground the AI so critical
 * essentials (transit card, must-have apps, plug type, tipping, entry rules)
 * are accurate rather than guessed. Zod is the single source of truth: TS types
 * are derived from the schemas and the same schemas validate authored city
 * files at runtime.
 *
 * Every fact is wrapped in `sourced()` so it carries a source URL + a
 * lastVerified date, which the UI surfaces as a clickable "verified source"
 * badge (TA-16). Framework-free by design (see AGENTS.md §2) so the data layer
 * is reusable across web/native shells.
 */
import { z } from "zod";

/**
 * Wraps a value in provenance: where the fact came from (`source`) and when it
 * was last checked (`lastVerified`, an ISO `YYYY-MM-DD` date). Used for every
 * essential in {@link CityData}.
 */
export const sourced = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    value,
    source: z.url(),
    lastVerified: z.iso.date(),
  });

/** Convenience type for a sourced fact of value type `T`. */
export type Sourced<T> = { value: T; source: string; lastVerified: string };

/** Public transit fare card / payment method (e.g. Compass Card, not Suica). */
const TransitCard = z.object({
  name: z.string().min(1),
  notes: z.string().min(1),
});

/** Electrical outlet standard for the city. */
const Plug = z.object({
  /** IEC plug-type letters, e.g. ["A", "B"]. */
  types: z.array(z.string().min(1)).min(1),
  voltage: z.number().positive(),
});

/** A recommended app to download before/for the trip. */
const RecommendedApp = z.object({
  name: z.string().min(1),
  why: z.string().min(1),
});

/** Weather/what-to-expect note for one season. */
const SeasonalNote = z.object({
  season: z.enum(["spring", "summer", "autumn", "winter"]),
  notes: z.string().min(1),
});

/**
 * All source-cited essentials for a single city. Designed so more cities
 * (Tokyo, etc.) can be authored against the same shape; Vancouver is seeded
 * first as home-turf ground truth (TA-15).
 */
export const CityData = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  /** ISO 4217 currency code, e.g. "CAD". */
  currency: z.string().length(3),
  /** IANA timezone, e.g. "America/Vancouver". */
  timezone: z.string().min(1),

  transitCard: sourced(TransitCard),
  plug: sourced(Plug),
  tipping: sourced(z.string().min(1)),
  /** At least one must-have app — an empty list is not "grounded". */
  apps: z.array(sourced(RecommendedApp)).min(1),
  emergencyNumber: z.string().min(1),

  // Richer essentials (TA-14 scope). Optional so cities can be seeded
  // incrementally, but source-cited whenever present.
  /** ID / visa / entry requirements. */
  entryRules: sourced(z.string().min(1)).optional(),
  /** Cash vs card norms, ATM availability, etc. */
  cashNorms: sourced(z.string().min(1)).optional(),
  /** General safety guidance / areas to note. */
  safety: sourced(z.string().min(1)).optional(),
  /** Per-season weather notes. */
  seasons: z.array(sourced(SeasonalNote)).optional(),
});
export type CityData = z.infer<typeof CityData>;
