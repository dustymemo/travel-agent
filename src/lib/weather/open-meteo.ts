/**
 * Weather grounding (TA-20) via Open-Meteo — no API key.
 *
 * Turns a destination name into typical-weather facts by geocoding it, sampling
 * the same calendar month from the most recent completed year (a climate proxy
 * for a future trip), and aggregating daily highs/lows/precip. The result feeds
 * the planner so packing and activity picks are grounded in real temps — same
 * idea as the seeded city facts (see cityFactsForPrompt).
 *
 * Framework-free (AGENTS.md §2). `fetch` is injectable so it's unit-testable
 * without network or globals.
 */
import { z } from "zod";
import { config } from "@/lib/config";

type FetchFn = typeof fetch;

// ── Open-Meteo response schemas (validate at the boundary) ──────────────────
const GeoResponse = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
      }),
    )
    .optional(),
});

const ArchiveResponse = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
  }),
});

export interface GeoPlace {
  name: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface Climate {
  place: string;
  country?: string;
  /** Averaged daily high over the window, °C. */
  avgHighC: number;
  /** Averaged daily low over the window, °C. */
  avgLowC: number;
  /** Total precipitation over the window, mm. */
  precipMm: number;
  /** Days with ≥1mm precipitation. */
  rainyDays: number;
  /** The historical window sampled, e.g. "Jul 2025". */
  window: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad2 = (n: number) => String(n).padStart(2, "0");
const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** A full-month date range (inclusive) with a readable label. */
export function historicalWindow(
  month: number,
  year: number,
): { start: string; end: string; label: string } {
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month
  return {
    start: `${year}-${pad2(month)}-01`,
    end: `${year}-${pad2(month)}-${pad2(lastDay)}`,
    label: `${MONTHS[month - 1]} ${year}`,
  };
}

/** Geocode a place name to coordinates (first match), or null. */
export async function geocodePlace(
  place: string,
  fetchFn: FetchFn = fetch,
): Promise<GeoPlace | null> {
  const url = `${config.services.weatherGeocodeBaseUrl}?name=${encodeURIComponent(
    place,
  )}&count=1&language=en&format=json`;

  try {
    const res = await fetchFn(url, {
      headers: { "User-Agent": config.services.userAgent },
    });
    if (!res.ok) return null;
    const parsed = GeoResponse.safeParse(await res.json());
    const hit = parsed.success ? parsed.data.results?.[0] : undefined;
    if (!hit) return null;
    return {
      name: hit.name,
      country: hit.country,
      lat: hit.latitude,
      lon: hit.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Typical weather for a destination. Best-effort: returns null (never throws)
 * so weather grounding can silently no-op when a place can't be resolved or the
 * service is down. `opts.now` and `opts.month` are injectable for determinism.
 */
export async function getDestinationClimate(
  place: string,
  opts: { now?: Date; month?: number } = {},
  fetchFn: FetchFn = fetch,
): Promise<Climate | null> {
  const geo = await geocodePlace(place, fetchFn);
  if (!geo) return null;

  const now = opts.now ?? new Date();
  const month = opts.month ?? now.getMonth() + 1;
  // Sample the most recent completed year for a future-trip climate proxy.
  const { start, end, label } = historicalWindow(month, now.getFullYear() - 1);

  const url =
    `${config.services.weatherBaseUrl}?latitude=${geo.lat}&longitude=${geo.lon}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  try {
    const res = await fetchFn(url);
    if (!res.ok) return null;
    const parsed = ArchiveResponse.safeParse(await res.json());
    if (!parsed.success) return null;

    const d = parsed.data.daily;
    const highs = d.temperature_2m_max.filter((n): n is number => n !== null);
    const lows = d.temperature_2m_min.filter((n): n is number => n !== null);
    const precip = d.precipitation_sum.filter((n): n is number => n !== null);
    if (!highs.length || !lows.length) return null;

    return {
      place: geo.name,
      country: geo.country,
      avgHighC: round1(mean(highs)),
      avgLowC: round1(mean(lows)),
      precipMm: round1(precip.reduce((a, b) => a + b, 0)),
      rainyDays: precip.filter((mm) => mm >= 1).length,
      window: label,
    };
  } catch {
    return null;
  }
}

/** Render climate into a grounding block for the planner system prompt. */
export function climateFactsForPrompt(c: Climate): string {
  const where = c.country ? `${c.place}, ${c.country}` : c.place;
  return [
    `TYPICAL WEATHER for ${where} (based on ${c.window}) — ground packing and outdoor activities in this, don't guess:`,
    `- Average daily high ${round1(c.avgHighC)}°C, average low ${round1(c.avgLowC)}°C`,
    `- ${c.rainyDays} rainy day(s) that month, ~${round1(c.precipMm)}mm total precipitation`,
  ].join("\n");
}
