import { describe, it, expect } from "vitest";
import {
  getCity,
  listCities,
  formatCityFacts,
  cityFactsForPrompt,
} from "./loader";
import type { CityData } from "./schema";

describe("getCity", () => {
  it("loads and validates a seeded city", () => {
    const city = getCity("vancouver");
    expect(city).not.toBeNull();
    expect(city?.slug).toBe("vancouver");
    expect(city?.transitCard.value.name).toMatch(/compass/i);
  });

  it("is case-insensitive on the slug", () => {
    expect(getCity("VANCOUVER")?.slug).toBe("vancouver");
    expect(getCity(" Vancouver ")?.slug).toBe("vancouver");
  });

  it("returns null for an unknown city", () => {
    expect(getCity("atlantis")).toBeNull();
  });
});

describe("listCities", () => {
  it("lists the seeded slugs", () => {
    expect(listCities()).toContain("vancouver");
  });
});

/** A city carrying every optional field, so we exercise all format branches. */
const fullCity: CityData = {
  slug: "testville",
  name: "Testville",
  country: "Testland",
  currency: "TST",
  timezone: "Test/Zone",
  transitCard: {
    value: { name: "Test Card", notes: "Tap to ride." },
    source: "https://example.com/card",
    lastVerified: "2026-07-08",
  },
  plug: {
    value: { types: ["C", "F"], voltage: 230 },
    source: "https://example.com/plug",
    lastVerified: "2026-07-08",
  },
  tipping: {
    value: "Round up.",
    source: "https://example.com/tip",
    lastVerified: "2026-07-08",
  },
  apps: [
    {
      value: { name: "TestApp", why: "Transit times." },
      source: "https://example.com/app",
      lastVerified: "2026-07-08",
    },
  ],
  emergencyNumber: "112",
  entryRules: {
    value: "Visa on arrival.",
    source: "https://example.com/entry",
    lastVerified: "2026-07-08",
  },
  cashNorms: {
    value: "Cards everywhere.",
    source: "https://example.com/cash",
    lastVerified: "2026-07-08",
  },
  safety: {
    value: "Very safe.",
    source: "https://example.com/safety",
    lastVerified: "2026-07-08",
  },
  seasons: [
    {
      value: { season: "summer", notes: "Hot." },
      source: "https://example.com/summer",
      lastVerified: "2026-07-08",
    },
  ],
};

describe("formatCityFacts", () => {
  it("renders every field when all optionals are present", () => {
    const text = formatCityFacts(fullCity);
    expect(text).toContain("TESTVILLE");
    expect(text).toContain("Testland");
    expect(text).toContain("TST");
    expect(text).toContain("Test Card");
    expect(text).toContain("C/F");
    expect(text).toContain("230V");
    expect(text).toContain("Round up.");
    expect(text).toContain("112");
    expect(text).toContain("TestApp");
    expect(text).toContain("Visa on arrival.");
    expect(text).toContain("Cards everywhere.");
    expect(text).toContain("Very safe.");
    expect(text).toContain("summer");
  });

  it("omits optional lines when they are absent", () => {
    const minimal: CityData = {
      ...fullCity,
      entryRules: undefined,
      cashNorms: undefined,
      safety: undefined,
      seasons: undefined,
    };
    const text = formatCityFacts(minimal);
    expect(text).not.toContain("Entry rules");
    expect(text).not.toContain("Cash");
    expect(text).not.toContain("Safety");
    expect(text).not.toContain("Seasons");
    // required lines still present
    expect(text).toContain("Test Card");
  });
});

describe("cityFactsForPrompt", () => {
  it("grounds the prompt with real Vancouver facts", () => {
    const text = cityFactsForPrompt("vancouver");
    expect(text).not.toBeNull();
    expect(text).toContain("VANCOUVER");
    expect(text).toContain("Compass Card");
    expect(text).toContain("911");
    expect(text).toContain("120V");
  });

  it("returns null for an unknown city", () => {
    expect(cityFactsForPrompt("atlantis")).toBeNull();
  });
});
