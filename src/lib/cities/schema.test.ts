import { describe, it, expect } from "vitest";
import { CityData, sourced } from "@/lib/cities/schema";
import { z } from "zod";

const validCity = {
  slug: "vancouver",
  name: "Vancouver",
  country: "Canada",
  currency: "CAD",
  timezone: "America/Vancouver",
  transitCard: {
    value: { name: "Compass Card", notes: "Tap on/off SkyTrain, bus, SeaBus." },
    source: "https://www.compasscard.ca/",
    lastVerified: "2026-07-08",
  },
  plug: {
    value: { types: ["A", "B"], voltage: 120 },
    source: "https://www.iec.ch/world-plugs",
    lastVerified: "2026-07-08",
  },
  tipping: {
    value: "15–20% at sit-down restaurants; not expected at counters.",
    source: "https://example.gov/tipping",
    lastVerified: "2026-07-08",
  },
  apps: [
    {
      value: { name: "Transit", why: "Real-time bus/SkyTrain times." },
      source: "https://transitapp.com/",
      lastVerified: "2026-07-08",
    },
  ],
  emergencyNumber: "911",
};

describe("sourced()", () => {
  it("requires a value, a URL source, and a lastVerified date", () => {
    const schema = sourced(z.string());
    expect(
      schema.safeParse({
        value: "x",
        source: "not-a-url",
        lastVerified: "2026-07-08",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        value: "x",
        source: "https://a.com",
        lastVerified: "nope",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        value: "x",
        source: "https://a.com",
        lastVerified: "2026-07-08",
      }).success,
    ).toBe(true);
  });
});

describe("CityData", () => {
  it("accepts a well-formed, source-cited city", () => {
    const parsed = CityData.safeParse(validCity);
    expect(parsed.success).toBe(true);
  });

  it("rejects a city whose transit card has no source", () => {
    const bad = structuredClone(validCity);
    // @ts-expect-error deleting a required field for the test
    delete bad.transitCard.source;
    expect(CityData.safeParse(bad).success).toBe(false);
  });

  it("requires at least one recommended app", () => {
    const bad = structuredClone(validCity);
    bad.apps = [];
    expect(CityData.safeParse(bad).success).toBe(false);
  });

  it("accepts optional richer essentials when they are source-cited", () => {
    const rich = {
      ...structuredClone(validCity),
      entryRules: {
        value: "eTA required for visa-exempt air travellers.",
        source: "https://example.gov/eta",
        lastVerified: "2026-07-08",
      },
      cashNorms: {
        value: "Cards accepted almost everywhere; carry small cash for tips.",
        source: "https://example.gov/cash",
        lastVerified: "2026-07-08",
      },
      safety: {
        value: "Very safe; usual big-city awareness downtown at night.",
        source: "https://example.gov/safety",
        lastVerified: "2026-07-08",
      },
      seasons: [
        {
          value: { season: "summer", notes: "Warm, dry; long daylight." },
          source: "https://example.gov/weather",
          lastVerified: "2026-07-08",
        },
      ],
    };
    expect(CityData.safeParse(rich).success).toBe(true);
  });

  it("rejects an optional richer field that is present but unsourced", () => {
    const bad = {
      ...structuredClone(validCity),
      safety: { value: "Very safe.", lastVerified: "2026-07-08" }, // missing source
    };
    expect(CityData.safeParse(bad).success).toBe(false);
  });
});
