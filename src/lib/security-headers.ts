/**
 * Security response headers applied to every route (TA-49).
 *
 * Framework-free (AGENTS.md §2) so it's unit-testable in isolation; consumed by
 * `next.config.ts`'s `headers()`. Start reasonably strict and functional, then
 * tighten the CSP iteratively (e.g. nonce-based scripts) as the app grows.
 */

/** Origins the app legitimately talks to — the source of truth for connect-src. */
const CONNECT_SRC = [
  "'self'",
  // Supabase (Postgres/Auth/Storage over REST + realtime websockets)
  "https://*.supabase.co",
  "wss://*.supabase.co",
  // Free, no-key external services (weather / geocoding / POIs)
  "https://api.open-meteo.com",
  "https://archive-api.open-meteo.com",
  "https://nominatim.openstreetmap.org",
  "https://overpass-api.de",
];

/**
 * Build the Content-Security-Policy string. `'unsafe-eval'` is only added in
 * development, where Turbopack's HMR needs it — production stays without it.
 */
export function contentSecurityPolicy(
  isDev: boolean = process.env.NODE_ENV !== "production",
): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    // data:/blob: for next/image + generated assets; https: for map tiles (E5)
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": CONNECT_SRC,
    "worker-src": ["'self'"], // PWA service worker
    "manifest-src": ["'self'"],
    "frame-ancestors": ["'none'"], // clickjacking (modern equivalent of X-Frame-Options)
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");
}

/** The full set of security headers, in Next.js `headers()` shape. */
export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      // geolocation=(self) so a future "near me" map can prompt; others off.
      value: "camera=(), microphone=(), geolocation=(self)",
    },
  ];
}
