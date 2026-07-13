import { describe, it, expect } from "vitest";
import { Itinerary } from "./trip";

const base = {
  summary: "A short trip.",
  days: [],
  packing: ["passport"],
  apps: [] as unknown[],
  tips: ["carry cash"],
  budget: [],
};

describe("Itinerary schema — tolerant apps", () => {
  it("accepts well-formed {name, why} app entries", () => {
    const r = Itinerary.safeParse({
      ...base,
      apps: [{ name: "Suica", why: "transit" }],
    });
    expect(r.success).toBe(true);
    expect(r.data?.apps[0]).toEqual({ name: "Suica", why: "transit" });
  });

  it("coerces a bare app-name string into {name, why:''}", () => {
    // The real model sometimes returns apps as string[] instead of objects.
    const r = Itinerary.safeParse({ ...base, apps: ["Google Maps", "Bolt"] });
    expect(r.success).toBe(true);
    expect(r.data?.apps).toEqual([
      { name: "Google Maps", why: "" },
      { name: "Bolt", why: "" },
    ]);
  });

  it("defaults a missing 'why' on an object entry", () => {
    const r = Itinerary.safeParse({ ...base, apps: [{ name: "Maps" }] });
    expect(r.success).toBe(true);
    expect(r.data?.apps[0]).toEqual({ name: "Maps", why: "" });
  });
});
