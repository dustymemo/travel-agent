/**
 * WCAG 2.1 contrast maths — the objective half of "polished in light and dark".
 * Pure and framework-free so the palette itself can be unit-tested (see
 * palette.test.ts) instead of eyeballed: every ink/surface pairing has to clear
 * AA (4.5:1) in both themes, and a regression fails CI rather than shipping.
 *
 * Reference: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

const HEX_6 = /^#[0-9a-f]{6}$/;

/** Parse `#rrggbb` into 0–255 channels. Strict: shorthand/named colours throw. */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().toLowerCase();
  if (!HEX_6.test(normalized)) {
    throw new Error(`Expected a 6-digit hex colour like #bc6a47, got: ${hex}`);
  }
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

/**
 * Relative luminance: undo sRGB gamma per channel, then weight by human
 * sensitivity (green dominates). Returns 0 (black) to 1 (white).
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Contrast ratio between two hex colours, from 1:1 (identical) to 21:1
 * (black on white). Symmetric — foreground/background order is irrelevant.
 * WCAG AA needs >= 4.5 for body text, >= 3 for large text and UI boundaries.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
