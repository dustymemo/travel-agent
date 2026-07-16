import { describe, it, expect } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("returns 21:1 for black on white — the maximum possible", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  });

  it("returns 1:1 for identical colours", () => {
    expect(contrastRatio("#f5efe3", "#f5efe3")).toBeCloseTo(1, 5);
  });

  it("is symmetric — argument order doesn't matter", () => {
    expect(contrastRatio("#bc6a47", "#f5efe3")).toBeCloseTo(
      contrastRatio("#f5efe3", "#bc6a47"),
      5,
    );
  });

  // #767676 on white is the canonical grey that just clears WCAG AA (4.5:1);
  // it pins the luminance curve, so a wrong gamma step fails here.
  it("matches the WCAG reference value at the AA threshold", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("matches the WCAG reference value just below the AA threshold", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("tolerates uppercase and surrounding whitespace", () => {
    expect(contrastRatio("  #FFFFFF ", "#000000")).toBeCloseTo(21, 2);
  });

  it("rejects malformed hex rather than scoring it silently", () => {
    expect(() => contrastRatio("#fff", "#000000")).toThrow(/hex/i);
    expect(() => contrastRatio("nope", "#000000")).toThrow(/hex/i);
    expect(() => contrastRatio("#gggggg", "#000000")).toThrow(/hex/i);
  });
});
