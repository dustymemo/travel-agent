import { describe, it, expect } from "vitest";
import { extractTripHints } from "./hints";
import type { Message } from "@/types/trip";

const user = (content: string): Message => ({ role: "user", content });

describe("extractTripHints", () => {
  it("pulls a place from a 'days in <place>' phrasing", () => {
    expect(
      extractTripHints([user("3 relaxed days in kyoto, love food")]).place,
    ).toBe("kyoto");
  });

  it("pulls a place from a 'trip to <place>' phrasing, skipping verbs", () => {
    // The first "to" follows "want to go" — must skip to the real place.
    expect(
      extractTripHints([user("I want to go to Paris for a week")]).place,
    ).toBe("Paris");
  });

  it("keeps multi-word place names, stopping at a clause word", () => {
    expect(
      extractTripHints([user("a week in New York for some food")]).place,
    ).toBe("New York");
  });

  it("extracts a travel month by name", () => {
    expect(extractTripHints([user("Tokyo in October")]).month).toBe(10);
  });

  it("prefers the most recent traveler message for the place", () => {
    const msgs = [
      user("maybe somewhere in Italy"),
      { role: "assistant", content: "Sure!" } as Message,
      user("actually let's do 4 days in Lisbon"),
    ];
    expect(extractTripHints(msgs).place).toBe("Lisbon");
  });

  it("returns nulls when no place or month is present", () => {
    expect(extractTripHints([user("plan me something fun")])).toEqual({
      place: null,
      month: null,
    });
  });
});
