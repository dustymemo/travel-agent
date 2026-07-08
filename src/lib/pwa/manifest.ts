import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes Travel Agent installable ("Add to Home Screen")
 * and launch fullscreen like a native app. Served at /manifest.webmanifest
 * via app/manifest.ts. Kept as a typed, unit-tested object.
 */
export const manifest: MetadataRoute.Manifest = {
  name: "Travel Agent",
  short_name: "Travel",
  description:
    "AI travel planner — day-by-day plans, packing lists, budget, and maps.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#0b1220",
  theme_color: "#0ea5e9",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
};
