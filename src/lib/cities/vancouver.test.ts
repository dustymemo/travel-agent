import { describe, it, expect } from "vitest";
import vancouver from "./vancouver.json";
import { CityData } from "./schema";

describe("vancouver.json", () => {
  it("is valid, fully source-cited CityData", () => {
    const parsed = CityData.safeParse(vancouver);
    if (!parsed.success) {
      console.error(JSON.stringify(parsed.error.issues, null, 2));
    }
    expect(parsed.success).toBe(true);
  });

  it("carries Vancouver ground truth (Compass Card, CAD, 911)", () => {
    expect(vancouver.slug).toBe("vancouver");
    expect(vancouver.currency).toBe("CAD");
    expect(vancouver.emergencyNumber).toBe("911");
    expect(vancouver.transitCard.value.name).toMatch(/compass/i);
  });

  it("cites every required fact with an https source + lastVerified date", () => {
    for (const field of [
      vancouver.transitCard,
      vancouver.plug,
      vancouver.tipping,
      ...vancouver.apps,
    ]) {
      expect(field.source).toMatch(/^https:\/\//);
      expect(field.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
