/**
 * City knowledge loader (TA-16).
 *
 * Loads a seeded, source-cited {@link CityData} record and turns it into a
 * prompt fragment that grounds the AI in verified local facts (E3 injects the
 * fragment into the system prompt so the model never guesses transit cards,
 * plug types, or emergency numbers).
 *
 * Framework-free (AGENTS.md §2): pure TypeScript, no React/Next imports.
 */
import { CityData } from "./schema";
import vancouver from "./vancouver.json";

/** Seeded cities, keyed by slug. Add a JSON file + entry to expand coverage. */
const RAW: Record<string, unknown> = {
  vancouver,
};

/** Normalize user/route input into a registry key. */
function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

/**
 * Load and validate a seeded city. Returns `null` for an unknown slug; throws
 * if a seeded record fails its schema (that's our data bug, and it should be
 * loud rather than silently degrade the AI's grounding).
 */
export function getCity(slug: string): CityData | null {
  const raw = RAW[normalizeSlug(slug)];
  if (raw === undefined) return null;
  return CityData.parse(raw);
}

/** The slugs we have verified data for. */
export function listCities(): string[] {
  return Object.keys(RAW);
}

/**
 * Render a city into a plain-text block of verified facts for the AI system
 * prompt. Only cited fields are included; optional facts are emitted only when
 * present so the model isn't told about data we don't have.
 */
export function formatCityFacts(city: CityData): string {
  const lines = [
    `VERIFIED LOCAL FACTS FOR ${city.name.toUpperCase()}, ${city.country} — use these; do not guess:`,
    `- Currency: ${city.currency}`,
    `- Transit card: ${city.transitCard.value.name} — ${city.transitCard.value.notes}`,
    `- Power plug: types ${city.plug.value.types.join("/")}, ${city.plug.value.voltage}V`,
    `- Tipping: ${city.tipping.value}`,
    `- Emergency number: ${city.emergencyNumber}`,
    `- Useful apps: ${city.apps
      .map((a) => `${a.value.name} (${a.value.why})`)
      .join("; ")}`,
  ];

  if (city.entryRules) lines.push(`- Entry rules: ${city.entryRules.value}`);
  if (city.cashNorms) lines.push(`- Cash norms: ${city.cashNorms.value}`);
  if (city.safety) lines.push(`- Safety: ${city.safety.value}`);
  if (city.seasons?.length) {
    lines.push(
      `- Seasons: ${city.seasons
        .map((s) => `${s.value.season} — ${s.value.notes}`)
        .join("; ")}`,
    );
  }

  return lines.join("\n");
}

/**
 * Convenience wrapper: look up a city by slug and format its facts for the
 * prompt. Returns `null` when the city isn't seeded.
 */
export function cityFactsForPrompt(slug: string): string | null {
  const city = getCity(slug);
  return city ? formatCityFacts(city) : null;
}
