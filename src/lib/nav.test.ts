import { describe, it, expect } from "vitest";
import { NAV_ITEMS, isActiveRoute } from "./nav";

describe("NAV_ITEMS", () => {
  it("exposes Plan and Trips as the MVP destinations", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/trips");
    // every item has a label for a11y
    expect(NAV_ITEMS.every((i) => i.label.length > 0)).toBe(true);
  });
});

describe("isActiveRoute", () => {
  it("matches the root only exactly", () => {
    expect(isActiveRoute("/", "/")).toBe(true);
    expect(isActiveRoute("/trips", "/")).toBe(false);
    expect(isActiveRoute("/trips/123", "/")).toBe(false);
  });

  it("matches a section by exact path or nested child", () => {
    expect(isActiveRoute("/trips", "/trips")).toBe(true);
    expect(isActiveRoute("/trips/123", "/trips")).toBe(true);
  });

  it("does not match unrelated sections", () => {
    expect(isActiveRoute("/", "/trips")).toBe(false);
    expect(isActiveRoute("/tripsomething", "/trips")).toBe(false);
  });
});
