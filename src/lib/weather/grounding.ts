/**
 * Weather grounding for the planner (TA-20): pull a destination + month from
 * the conversation, fetch typical weather, and format it for the system prompt.
 * Best-effort — returns null (never throws) so the planner works unchanged when
 * there's no clear destination or the weather service is unavailable.
 */
import type { Message } from "@/types/trip";
import { extractTripHints } from "./hints";
import { getDestinationClimate, climateFactsForPrompt } from "./open-meteo";

type FetchFn = typeof fetch;

export async function weatherGroundingFor(
  messages: Message[],
  opts: { now?: Date } = {},
  fetchFn: FetchFn = fetch,
): Promise<string | null> {
  const { place, month } = extractTripHints(messages);
  if (!place) return null;

  const climate = await getDestinationClimate(
    place,
    { now: opts.now, month: month ?? undefined },
    fetchFn,
  );
  return climate ? climateFactsForPrompt(climate) : null;
}
