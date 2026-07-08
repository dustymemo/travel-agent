import { describe, it, expect } from "vitest";
import { config } from "@/lib/config";

describe("config", () => {
  it("defaults to metric, CAD, en-CA", () => {
    expect(config.units).toBe("metric");
    expect(config.currency).toBe("CAD");
    expect(config.locale).toBe("en-CA");
  });

  it("defaults the AI provider to claude-cli on Sonnet", () => {
    expect(config.ai.provider).toBe("claude-cli");
    expect(config.ai.model).toBe("claude-sonnet-5");
  });

  it("points at free, no-key external services", () => {
    expect(config.services.weatherBaseUrl).toContain("open-meteo");
    expect(config.services.geocodeBaseUrl).toContain("nominatim");
    expect(config.services.overpassBaseUrl).toContain("overpass");
  });
});
