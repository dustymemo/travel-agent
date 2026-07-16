import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { themeTokens, darkTokens, type Tokens } from "./tokens";
import { contrastRatio } from "./contrast";

/**
 * The palette's accessibility contract (TA-26).
 *
 * globals.css is the single source of truth; this reads it back and holds every
 * real colour pairing to WCAG AA in *both* themes. Pairs are drawn from actual
 * usage in the components — a pairing nothing renders isn't worth enforcing,
 * and decorative marks (the aria-hidden category dots, hairline dividers) are
 * exempt under WCAG 1.4.11, so they're deliberately absent.
 */

const CSS = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");

const LIGHT = themeTokens(CSS);
// A dark override is a *patch* over the light theme: tokens the dark block
// leaves alone (the rail is a dark rail in both themes) intentionally carry
// through, which is exactly how the cascade resolves them at runtime.
const DARK: Tokens = { ...LIGHT, ...darkTokens(CSS) };

const AA_TEXT = 4.5; // WCAG 1.4.3 — normal-size body text
const AA_NON_TEXT = 3; // WCAG 1.4.11 — focus rings and UI boundaries

/** [foreground, background, required ratio, where it renders] */
const PAIRS: [string, string, number, string][] = [
  // Body + muted text on every surface it can land on
  ["ink", "canvas", AA_TEXT, "body text on the page"],
  ["ink", "surface", AA_TEXT, "body text on a card"],
  ["ink", "surface-2", AA_TEXT, "body text on a raised card"],
  ["ink", "field", AA_TEXT, "typed text in an input"],
  ["ink-soft", "canvas", AA_TEXT, "muted text on the page"],
  ["ink-soft", "surface", AA_TEXT, "muted text on a card"],
  ["ink-soft", "surface-2", AA_TEXT, "muted text on a raised card"],
  ["ink-soft", "field", AA_TEXT, "input placeholder"],

  // Accent surfaces that carry a label (SaveTripButton, PlanChat send, NavRail home)
  ["surface", "terracotta", AA_TEXT, "button label on the accent"],
  ["surface", "terracotta-deep", AA_TEXT, "button label on accent hover"],

  // Accent used *as* text (links, role=alert copy in 5 components)
  ["terracotta-deep", "surface", AA_TEXT, "link/error text on a card"],
  ["terracotta-deep", "canvas", AA_TEXT, "link/error text on the page"],

  // The nav rail is a dark warm rail in both themes, so it owns its ink
  ["rail-ink", "rail", AA_TEXT, "nav rail active label"],
  ["rail-ink", "rail-active", AA_TEXT, "nav rail active label, highlighted"],
  ["rail-idle", "rail", AA_TEXT, "nav rail idle label"],

  // The user's chat bubble pairs body ink with a warm surface
  ["ink", "bubble", AA_TEXT, "user message bubble"],

  // The itinerary total pill inverts ink/surface; it must hold up both ways
  ["surface", "ink", AA_TEXT, "itinerary total pill"],

  // The verified-source badge takes a className, so it can land on either surface
  ["olive", "surface", AA_TEXT, "verified-source badge on a card"],
  ["olive", "canvas", AA_TEXT, "verified-source badge on the page"],

  // Focus rings must be visible against whatever they sit on
  ["focus", "canvas", AA_NON_TEXT, "focus ring on the page"],
  ["focus", "surface", AA_NON_TEXT, "focus ring on a card"],
  ["focus", "field", AA_NON_TEXT, "focus ring on an input"],
  ["focus-rail", "rail", AA_NON_TEXT, "focus ring on the nav rail"],
];

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
])("%s palette", (theme, tokens) => {
  it("resolves every token the contrast contract references", () => {
    const referenced = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]));
    const missing = [...referenced].filter((t) => !tokens[`--color-${t}`]);
    expect(missing, `undefined in the ${theme} theme`).toEqual([]);
  });

  it.each(PAIRS)(`%s on %s clears %s:1 — %s`, (fg, bg, required, where) => {
    const ratio = contrastRatio(
      tokens[`--color-${fg}`],
      tokens[`--color-${bg}`],
    );
    expect(
      Number(ratio.toFixed(2)),
      `${fg} on ${bg} (${where}) is ${ratio.toFixed(2)}:1 in the ${theme} theme`,
    ).toBeGreaterThanOrEqual(required);
  });
});

describe("dark theme wiring", () => {
  it("flips the surfaces so the page is dark and the text is light", () => {
    const lightness = (hex: string) => contrastRatio(hex, "#000000");
    // Sanity: canvas must be darker than ink in dark, and the reverse in light.
    expect(lightness(DARK["--color-canvas"])).toBeLessThan(
      lightness(DARK["--color-ink"]),
    );
    expect(lightness(LIGHT["--color-canvas"])).toBeGreaterThan(
      lightness(LIGHT["--color-ink"]),
    );
  });

  it("overrides only tokens that exist in the light theme", () => {
    const orphans = Object.keys(darkTokens(CSS)).filter((t) => !LIGHT[t]);
    expect(orphans, "dark overrides with no light counterpart").toEqual([]);
  });
});
