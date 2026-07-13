/**
 * Weather grounding for the planner (TA-20): pull a destination + month from
 * the conversation, fetch typical weather, and format it for the system prompt.
 * Best-effort — returns null (never throws) so the planner works unchanged when
 * there's no clear destination or the weather service is unavailable.
 */
import type { Message, TripDates } from "@/types/trip";
import { extractTripHints } from "./hints";
import { getDestinationClimate, climateFactsForPrompt } from "./open-meteo";

type FetchFn = typeof fetch;

/**
 * Weather grounding block for the conversation. When explicit trip `dates` are
 * given they drive the exact sample window (precise); otherwise we fall back to
 * a month extracted from the chat. The destination is always read from the
 * messages.
 */
export async function weatherGroundingFor(
  messages: Message[],
  opts: { now?: Date; dates?: TripDates } = {},
  fetchFn: FetchFn = fetch,
): Promise<string | null> {
  const { place, month } = extractTripHints(messages);
  if (!place) return null;

  const climate = await getDestinationClimate(
    place,
    opts.dates
      ? { now: opts.now, range: opts.dates }
      : { now: opts.now, month: month ?? undefined },
    fetchFn,
  );
  return climate ? climateFactsForPrompt(climate) : null;
}
