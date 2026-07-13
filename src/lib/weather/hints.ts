/**
 * Best-effort extraction of a destination + travel month from the free-text
 * conversation, so the planner can fetch weather grounding (TA-20). Heuristic
 * by nature — when nothing confident is found we return nulls and the caller
 * simply skips weather. Framework-free, pure, fully unit-tested.
 */
import type { Message } from "@/types/trip";

/** Words that end a place phrase or can't themselves be a place. */
const STOP = new Set([
  "for",
  "next",
  "this",
  "during",
  "over",
  "with",
  "and",
  "in",
  "on",
  "to",
  "a",
  "an",
  "the",
  "because",
  "so",
  "around",
  "near",
  "go",
  "going",
  "visit",
  "visiting",
  "see",
  "seeing",
  "spend",
  "spending",
  "stay",
  "staying",
  "explore",
  "exploring",
  "head",
  "heading",
  "travel",
  "traveling",
  "travelling",
  "love",
  "want",
  "wanna",
  "like",
  "me",
  "my",
  "days",
  "day",
  "nights",
  "night",
  "week",
  "weeks",
  "trip",
  "somewhere",
]);

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const WORD = /^[A-Za-z][A-Za-z.'-]*$/;
const strip = (s: string) => s.replace(/[.,;!?]+$/, "");

/**
 * First plausible place after a "to"/"in" preposition. Walks tokens rather than
 * a greedy regex so "want to go to Paris" skips the verb and finds Paris.
 */
function extractPlace(text: string): string | null {
  const tokens = text.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = strip(tokens[i]).toLowerCase();
    if (t !== "to" && t !== "in") continue;

    const words: string[] = [];
    for (let j = i + 1; j < tokens.length; j++) {
      const w = strip(tokens[j]);
      if (!WORD.test(w) || STOP.has(w.toLowerCase())) break;
      words.push(w);
      if (/[.,;!?]$/.test(tokens[j])) break; // punctuation ends the phrase
    }
    const place = words.join(" ").trim();
    if (place.length >= 2) return place;
  }
  return null;
}

function extractMonth(text: string): number | null {
  const re = /\b([A-Za-z]{3,9})\b/g;
  for (const m of text.matchAll(re)) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month) return month;
  }
  return null;
}

export interface TripHints {
  place: string | null;
  month: number | null;
}

/**
 * Pull a destination + month from the conversation. Prefers the most recent
 * traveler message (their latest intent), falling back to earlier ones.
 */
export function extractTripHints(messages: Message[]): TripHints {
  const userTexts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .reverse();

  let place: string | null = null;
  let month: number | null = null;
  for (const text of userTexts) {
    place ??= extractPlace(text);
    month ??= extractMonth(text);
    if (place && month) break;
  }
  return { place, month };
}
