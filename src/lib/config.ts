/**
 * Global app configuration & defaults.
 *
 * Centralized here so units/currency/locale are never hardcoded in the UI,
 * which keeps the `lib/` core portable for a future native/App Store shell.
 */

export const config = {
  units: "metric" as const, // "metric" | "imperial"
  currency: "CAD" as const, // ISO 4217
  locale: "en-CA" as const,

  ai: {
    /** Which provider the server uses. Override with TRAVEL_AI_PROVIDER. */
    provider: (process.env.TRAVEL_AI_PROVIDER ?? "claude-cli") as
      "claude-cli" | "claude-api" | "codex-cli",
    /** Model id used for planning (claude-cli). */
    model: process.env.TRAVEL_AI_MODEL ?? "claude-sonnet-5",
    /** Model for the codex-cli provider; empty = Codex CLI's own default. */
    codexModel: process.env.TRAVEL_CODEX_MODEL ?? "",
    /**
     * Guards the subscription/host against overload (TA-50). Defaults are
     * conservative for a single-user Phase-1 deployment.
     */
    rateLimit: {
      maxRequests: Number(process.env.TRAVEL_AI_MAX_REQUESTS ?? 20),
      windowMs: Number(process.env.TRAVEL_AI_RATE_WINDOW_MS ?? 60_000),
      maxConcurrent: Number(process.env.TRAVEL_AI_MAX_CONCURRENT ?? 2),
    },
  },

  /** Free, no-key external services. */
  services: {
    weatherBaseUrl: "https://archive-api.open-meteo.com/v1/archive",
    /** Open-Meteo geocoding (no key) — turns a place name into lat/lon. */
    weatherGeocodeBaseUrl: "https://geocoding-api.open-meteo.com/v1/search",
    geocodeBaseUrl: "https://nominatim.openstreetmap.org",
    overpassBaseUrl: "https://overpass-api.de/api/interpreter",
    /** Sent as User-Agent to OSM services (their usage policy requires it). */
    userAgent: "TravelAgent/0.1 (personal project)",
  },
} as const;

export type AppConfig = typeof config;
