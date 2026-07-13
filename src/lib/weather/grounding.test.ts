import { describe, it, expect, vi } from "vitest";
import { weatherGroundingFor } from "./grounding";
import type { Message } from "@/types/trip";

const geoBody = {
  results: [
    { name: "Lisbon", latitude: 38.7, longitude: -9.1, country: "Portugal" },
  ],
};
const archiveBody = {
  daily: {
    time: ["2025-09-01", "2025-09-02"],
    temperature_2m_max: [26, 28],
    temperature_2m_min: [17, 19],
    precipitation_sum: [0, 2],
  },
};

function fakeFetch() {
  return vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (url.includes("geocoding-api") ? geoBody : archiveBody),
  })) as unknown as typeof fetch;
}

const user = (content: string): Message => ({ role: "user", content });

describe("weatherGroundingFor", () => {
  it("returns a weather block when a destination is found", async () => {
    const block = await weatherGroundingFor(
      [user("4 days in Lisbon in September")],
      { now: new Date("2026-07-12") },
      fakeFetch(),
    );
    expect(block).toMatch(/lisbon/i);
    expect(block).toMatch(/TYPICAL WEATHER/);
  });

  it("uses explicit trip dates for the sample window", async () => {
    const fetchSpy = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.includes("geocoding-api") ? geoBody : archiveBody),
    })) as unknown as typeof fetch;
    const urls: string[] = [];
    const wrapped = ((u: string) => {
      urls.push(u);
      return (fetchSpy as (u: string) => Promise<Response>)(u);
    }) as unknown as typeof fetch;

    await weatherGroundingFor(
      [user("a week in Lisbon")],
      {
        now: new Date("2026-07-12"),
        dates: { start: "2026-09-09", end: "2026-09-15" },
      },
      wrapped,
    );
    expect(urls[1]).toContain("start_date=2025-09-09");
    expect(urls[1]).toContain("end_date=2025-09-15");
  });

  it("returns null when no destination can be extracted", async () => {
    const block = await weatherGroundingFor(
      [user("plan me something fun")],
      {},
      fakeFetch(),
    );
    expect(block).toBeNull();
  });

  it("returns null (never throws) when the weather fetch fails", async () => {
    const failing = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    const block = await weatherGroundingFor(
      [user("a week in Lisbon")],
      {},
      failing,
    );
    expect(block).toBeNull();
  });
});
