import { describe, it, expect } from "vitest";
import { tripDayCount, formatTripDatesNote } from "./dates";

describe("tripDayCount", () => {
  it("counts inclusive days", () => {
    expect(tripDayCount({ start: "2026-09-09", end: "2026-09-15" })).toBe(7);
    expect(tripDayCount({ start: "2026-09-09", end: "2026-09-09" })).toBe(1);
  });

  it("spans month boundaries", () => {
    expect(tripDayCount({ start: "2026-01-30", end: "2026-02-02" })).toBe(4);
  });
});

describe("formatTripDatesNote", () => {
  it("states the window and exact day count for the planner", () => {
    const note = formatTripDatesNote({
      start: "2026-09-09",
      end: "2026-09-15",
    });
    expect(note).toMatch(/7 days/);
    expect(note).toMatch(/Sep(?:tember)? 9/);
    expect(note).toMatch(/Sep(?:tember)? 15/);
    expect(note).toMatch(/2026/);
  });
});
