import { describe, it, expect } from "vitest";
import { themeTokens, darkTokens } from "./tokens";

const SAMPLE = `
@import "tailwindcss";

@theme {
  /* a comment */
  --color-canvas: #e7ddc9;
  --color-ink: #2c271f;
  --font-display: var(--font-instrument-serif), Georgia, serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-canvas: #17140f;
    --color-ink: #f2ebdd;
  }
}

html {
  background: var(--color-canvas);
}
`;

describe("themeTokens", () => {
  it("extracts custom properties from the @theme block", () => {
    expect(themeTokens(SAMPLE)).toMatchObject({
      "--color-canvas": "#e7ddc9",
      "--color-ink": "#2c271f",
    });
  });

  it("keeps non-colour tokens with their full value", () => {
    expect(themeTokens(SAMPLE)["--font-display"]).toBe(
      "var(--font-instrument-serif), Georgia, serif",
    );
  });

  it("ignores declarations outside the @theme block", () => {
    expect(themeTokens(SAMPLE)).not.toHaveProperty("background");
  });

  it("returns nothing when there is no @theme block", () => {
    expect(themeTokens("html { color: red; }")).toEqual({});
  });
});

describe("darkTokens", () => {
  // The dark block nests :root inside @media, so a naive "match to the first
  // closing brace" parser would truncate here.
  it("extracts overrides from inside the prefers-color-scheme block", () => {
    expect(darkTokens(SAMPLE)).toEqual({
      "--color-canvas": "#17140f",
      "--color-ink": "#f2ebdd",
    });
  });

  it("does not leak the light values from @theme", () => {
    expect(darkTokens(SAMPLE)["--color-canvas"]).not.toBe("#e7ddc9");
  });

  it("returns nothing when there is no dark block", () => {
    expect(darkTokens("@theme { --color-canvas: #fff; }")).toEqual({});
  });
});
