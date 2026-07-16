/**
 * The focus ring, in one place.
 *
 * Before TA-26/TA-60 this string was hand-written a dozen times across eight
 * files, and it drifted: three different ring colours, sometimes with the UA
 * outline removed and nothing put back. Suppressing `outline` is only safe
 * *because* a ring replaces it — keep the two together, always.
 *
 * `focus-visible` (not `focus`) so the ring appears for keyboard users without
 * flashing on every mouse click.
 *
 * Two rings because there are two worlds: app surfaces re-theme with
 * `prefers-color-scheme`, while the nav rail is dark in both themes and needs a
 * light ring. Both are contrast-checked (3:1, WCAG 1.4.11) against the surfaces
 * they land on by src/lib/theme/palette.test.ts.
 */

/** For canvas/surface/field — anything that flips with the theme. */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

/** For the nav rail, which stays dark in both themes. */
export const FOCUS_RING_RAIL =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-rail";
