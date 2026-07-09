/**
 * App navigation model (framework-free so the active-route logic is unit-tested
 * without React). The Roam shell renders these in the left nav rail.
 *
 * MVP surfaces Plan + Trips; Discover/Profile arrive with later epics.
 */
export interface NavItem {
  href: string;
  label: string;
  /** Decorative glyph shown in the rail (paired with the text label). */
  glyph: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Plan", glyph: "◈" },
  { href: "/trips", label: "Trips", glyph: "✈" },
];

/**
 * Is `href` the active destination for the current `pathname`? The root (`/`)
 * matches only exactly; every other section also matches its nested children
 * (e.g. `/trips/123` activates `/trips`).
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
