/**
 * Prompt construction for the planner brain (TA-18). Pure + framework-free so
 * it's fully unit-tested without a model. The system prompt pins the output
 * contract, the app's currency/units, and — when we recognise the city —
 * grounds the model in our verified local facts (E2).
 */
import { config } from "@/lib/config";
import { getCity, listCities, cityFactsForPrompt } from "@/lib/cities/loader";
import type { Message, Itinerary } from "@/types/trip";

export interface PlannerRequest {
  system: string;
  prompt: string;
}

/** The JSON shape we require back — described to the model in the prompt. */
const OUTPUT_CONTRACT = `Respond with ONLY a JSON object (no markdown, no code fences) of the form:
{
  "reply": string,        // 1-2 warm sentences to the traveler about what you did
  "itinerary": {
    "summary": string,
    "days": [{ "day": number, "title": string, "activities": [
      { "startTime": "HH:MM", "title": string, "type": "transport"|"stay"|"food"|"activity"|"explore",
        "description"?: string, "location"?: string, "priceCad"?: number } ] }],
    "packing": string[],
    "apps": [{ "name": string, "why": string }],
    "tips": string[],
    "budget": [{ "category": "flights"|"hotels"|"food"|"transit"|"activities"|"other", "amountCad": number, "note"?: string }]
  }
}`;

/**
 * Find verified facts for the first known city named anywhere in the
 * conversation (matches slug or display name, case-insensitive).
 */
export function detectCityFacts(text: string): string | null {
  const haystack = text.toLowerCase();
  for (const slug of listCities()) {
    const city = getCity(slug);
    if (!city) continue;
    if (haystack.includes(slug) || haystack.includes(city.name.toLowerCase())) {
      return cityFactsForPrompt(slug);
    }
  }
  return null;
}

/** Build the system + user prompt for one planning turn. */
export function buildPlannerRequest(
  messages: Message[],
  currentItinerary?: Itinerary,
): PlannerRequest {
  const conversation = messages
    .map((m) => `${m.role === "user" ? "Traveler" : "Roam"}: ${m.content}`)
    .join("\n");

  const facts = detectCityFacts(
    messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" "),
  );

  const parts: string[] = [
    "You are Roam, an expert, friendly travel planner.",
    `Plan in ${config.units} units and price everything in ${config.currency}. Write in English (${config.locale}).`,
    "Be specific and realistic: real neighbourhoods, sensible timings, and costs that add up to the budget.",
    OUTPUT_CONTRACT,
  ];

  if (facts) {
    parts.push(
      `Ground your plan in these ${facts}\nPrefer these verified facts over your own assumptions.`,
    );
  }

  if (currentItinerary) {
    parts.push(
      "The traveler already has this current itinerary (JSON). Apply their latest request and return the FULL updated itinerary, not a diff:",
      JSON.stringify(currentItinerary),
    );
  }

  return { system: parts.join("\n\n"), prompt: conversation };
}
