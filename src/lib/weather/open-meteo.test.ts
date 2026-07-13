import { describe, it, expect, vi } from "vitest";
import {
  geocodePlace,
  getDestinationClimate,
  climateFactsForPrompt,
  historicalWindow,
} from "./open-meteo";

const geoBody = {
  results: [
    {
      name: "Kyoto",
      latitude: 35.01,
      longitude: 135.77,
      country: "Japan",
      admin1: "Kyoto",
    },
  ],
};

const archiveBody = {
  daily: {
    time: ["2025-07-01", "2025-07-02", "2025-07-03", "2025-07-04"],
    temperature_2m_max: [30, 32, 28, 34],
    temperature_2m_min: [22, 24, 20, 22],
    precipitation_sum: [0, 5, 0.5, 12],
  },
};

/** A fake fetch that routes canned JSON by URL, and records the URLs seen. */
function fakeFetch(
  routes: {
    geo?: unknown;
    archive?: unknown;
    geoOk?: boolean;
    archiveOk?: boolean;
  } = {},
) {
  const urls: string[] = [];
  const fn = vi.fn(async (url: string) => {
    urls.push(url);
    const isGeo = url.includes("geocoding-api");
    const body = isGeo
      ? (routes.geo ?? geoBody)
      : (routes.archive ?? archiveBody);
    const ok = isGeo ? (routes.geoOk ?? true) : (routes.archiveOk ?? true);
    return { ok, json: async () => body } as Response;
  });
  return { fn: fn as unknown as typeof fetch, urls };
}

describe("historicalWindow", () => {
  it("builds a full-month range with a readable label", () => {
    expect(historicalWindow(7, 2025)).toEqual({
      start: "2025-07-01",
      end: "2025-07-31",
      label: "Jul 2025",
    });
    // February leap-year length
    expect(historicalWindow(2, 2024).end).toBe("2024-02-29");
  });
});

describe("geocodePlace", () => {
  it("returns the first match as lat/lon", async () => {
    const { fn, urls } = fakeFetch();
    const place = await geocodePlace("Kyoto", fn);
    expect(place).toEqual({
      name: "Kyoto",
      country: "Japan",
      lat: 35.01,
      lon: 135.77,
    });
    expect(urls[0]).toContain("name=Kyoto");
  });

  it("returns null when there are no results", async () => {
    const { fn } = fakeFetch({ geo: { results: [] } });
    expect(await geocodePlace("Nowhereville", fn)).toBeNull();
  });

  it("returns null on a non-OK response", async () => {
    const { fn } = fakeFetch({ geoOk: false });
    expect(await geocodePlace("Kyoto", fn)).toBeNull();
  });
});

describe("getDestinationClimate", () => {
  it("geocodes then aggregates the historical daily data", async () => {
    const { fn, urls } = fakeFetch();
    const climate = await getDestinationClimate(
      "Kyoto",
      { now: new Date("2026-07-12T00:00:00Z"), month: 7 },
      fn,
    );

    expect(climate).not.toBeNull();
    expect(climate!.place).toBe("Kyoto");
    expect(climate!.country).toBe("Japan");
    expect(climate!.avgHighC).toBe(31); // mean(30,32,28,34)
    expect(climate!.avgLowC).toBe(22); // mean(22,24,20,22)
    expect(climate!.precipMm).toBe(17.5); // 0+5+0.5+12
    expect(climate!.rainyDays).toBe(2); // >=1mm: 5, 12
    // samples last completed year (2025) for the requested month
    expect(urls[1]).toContain("start_date=2025-07-01");
    expect(urls[1]).toContain("end_date=2025-07-31");
  });

  it("returns null when the place can't be geocoded", async () => {
    const { fn } = fakeFetch({ geo: { results: [] } });
    expect(
      await getDestinationClimate("???", { now: new Date("2026-07-12") }, fn),
    ).toBeNull();
  });

  it("returns null (never throws) when the archive request fails", async () => {
    const { fn } = fakeFetch({ archiveOk: false });
    expect(
      await getDestinationClimate("Kyoto", { now: new Date("2026-07-12") }, fn),
    ).toBeNull();
  });
});

describe("climateFactsForPrompt", () => {
  it("renders a grounding block with temps and rain", () => {
    const block = climateFactsForPrompt({
      place: "Kyoto",
      country: "Japan",
      avgHighC: 31,
      avgLowC: 22,
      precipMm: 17.5,
      rainyDays: 2,
      window: "Jul 2025",
    });
    expect(block).toMatch(/kyoto/i);
    expect(block).toContain("31");
    expect(block).toContain("22");
    expect(block).toMatch(/rain/i);
  });
});
