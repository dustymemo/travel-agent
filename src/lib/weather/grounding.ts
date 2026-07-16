/**
 * Weather grounding for the planner (TA-20): pull a destination + month from
 * the conversation, fetch typical weather, and format it for the system prompt.
 * Best-effort — returns null (never throws) so the planner works unchanged when
 * there's no clear destination or the weather service is unavailable.
 */
import type { Message, TripDates } from "@/types/trip";
import { extractTripHints } from "./hints";
import { getDestinationClimate, type Climate } from "./open-meteo";

type FetchFn = typeof fetch;

/**
 * Resolve typical weather for the conversation as a structured {@link Climate}
 * (so the API can both ground the prompt and show it in the UI). When explicit
 * trip `dates` are given they drive the exact sample window; otherwise we fall
 * back to a month extracted from the chat. Destination is read from the
 * messages. Best-effort — null when there's no clear place or on failure.
 */
export async function resolveClimate(
  messages: Message[],
  opts: { now?: Date; dates?: TripDates } = {},
  fetchFn: FetchFn = fetch,
): Promise<Climate | null> {
  const { place, month } = extractTripHints(messages);
  if (!place) return null;

  return getDestinationClimate(
    place,
    opts.dates
      ? { now: opts.now, range: opts.dates }
      : { now: opts.now, month: month ?? undefined },
    fetchFn,
  );
}
